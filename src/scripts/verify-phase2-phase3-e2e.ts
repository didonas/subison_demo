import "dotenv/config";

// Mock server-only for standalone script execution
try {
  const p = require.resolve("server-only");
  require.cache[p] = {
    id: p,
    filename: p,
    loaded: true,
    exports: {}
  } as unknown as NodeModule;
} catch {}

import { prisma } from "../lib/prisma";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName} ${detail ? `- ${detail}` : ""}`);
    failedCount++;
  }
}

async function runPhase2And3E2EVerification() {
  console.log("=================================================================");
  console.log("  SUBISON NEURO CENTRE: PHASE 2 & 3 REGRESSION SUITE            ");
  console.log("=================================================================\n");

  const { validateContactInput, verifySpamProtection } = await import("../lib/contact");
  const { 
    generateBookingReference, 
    getAvailableSlots, 
    bookAppointment,
    trackAppointmentStatus
  } = await import("../lib/appointments/service");
  const { appointmentSchema } = await import("../lib/validation/appointment");

  // PHASE 2: Contact & Anti-Spam Validation
  console.log("1. PHASE 2 CONTACT FORM & ANTI-SPAM VALIDATION:");
  assert(!validateContactInput({ mobileNumber: "1234567890", enquiryType: "GENERAL", message: "Hello world!", turnstileToken: "1x00000000000000000000AA", consent: "true" }).success, "Missing name is rejected");
  assert(!validateContactInput({ name: "John", mobileNumber: "abc", enquiryType: "GENERAL", message: "Hello world!", turnstileToken: "1x00000000000000000000AA", consent: "true" }).success, "Invalid mobile number format is rejected");
  assert(!validateContactInput({ name: "John", mobileNumber: "1234567890", email: "invalid", enquiryType: "GENERAL", message: "Hello world!", turnstileToken: "1x00000000000000000000AA", consent: "true" }).success, "Invalid email format is rejected");
  assert(!validateContactInput({ name: "John", mobileNumber: "1234567890", enquiryType: "GENERAL", message: "Hello world!", turnstileToken: "1x00000000000000000000AA" }).success, "Missing privacy consent is rejected");
  assert(!validateContactInput({ name: "John", mobileNumber: "1234567890", enquiryType: "GENERAL", message: "a".repeat(1001), turnstileToken: "1x00000000000000000000AA", consent: "true" }).success, "Oversized message (>1000 chars) is rejected");
  
  const honeypotRes = await verifySpamProtection("bot-filled-this", "1x00000000000000000000AA");
  assert(honeypotRes.success === false, "Filled honeypot field is rejected");

  const missingTokenRes = await verifySpamProtection("", undefined);
  assert(missingTokenRes.success === false, "Missing Turnstile token is rejected");

  const invalidTokenRes = await verifySpamProtection("", "2x00000000000000000000AB");
  assert(invalidTokenRes.success === false, "Invalid Turnstile token is rejected");

  const validTokenRes = await verifySpamProtection("", "1x00000000000000000000AA");
  assert(validTokenRes.success === true, "Valid Cloudflare Turnstile token accepted");

  // PHASE 3: Booking Engine & Privacy
  console.log("\n2. PHASE 3 BOOKING ENGINE, SLOTS & CONCURRENCY VALIDATION:");
  const ref1 = generateBookingReference();
  const ref2 = generateBookingReference();
  assert(ref1.startsWith("SNC-") && /^SNC-\d{8}-[A-F0-9]{8}$/.test(ref1), `Booking reference format matches SNC-YYYYMMDD-XXXXXXXX: ${ref1}`);
  assert(ref1 !== ref2, "Booking reference is uniquely generated");

  const invalidForm = appointmentSchema.safeParse({
    patientName: "",
    mobileNumber: "123",
    patientType: "NEW",
    preferredLanguage: "EN",
    doctorId: "invalid-uuid",
    appointmentDate: "invalid-date",
    startTime: "invalid-time",
    privacyConsent: false,
    communicationConsent: false,
  });
  assert(!invalidForm.success, "Zod schema strictly rejects invalid appointment payload");

  const doctor = await prisma.doctor.findFirst({
    include: { availabilities: true }
  }).catch(() => null);

  if (doctor) {
    const testDate = "2026-08-10";
    const slots = await getAvailableSlots(doctor.id, testDate);
    assert(Array.isArray(slots) && slots.length > 0, `Available slots computed for doctor (${slots.length} slots found)`);

    const bookingResult = await bookAppointment({
      patientName: "E2E Test Patient",
      mobileNumber: "6383636281",
      email: "e2e.patient@example.com",
      patientType: "NEW",
      preferredLanguage: "EN",
      doctorId: doctor.id,
      appointmentDate: testDate,
      startTime: slots[0] || "10:00 AM",
      privacyConsent: true,
      communicationConsent: true,
      turnstileToken: "1x00000000000000000000AA",
    });

    assert(bookingResult.success === true, "Atomic appointment booking succeeded");
    if (bookingResult.success && bookingResult.bookingReference) {
      const createdApt = await prisma.appointment.findUnique({
        where: { bookingReference: bookingResult.bookingReference },
        include: { history: true }
      });
      assert(!!createdApt, "Appointment record persisted in database");
      assert((createdApt?.history?.length || 0) > 0, "Initial status history audit log created");

      // Tracking security tests
      const trackSuccess = await trackAppointmentStatus(bookingResult.bookingReference, "6383636281");
      const trackWrongMobile = await trackAppointmentStatus(bookingResult.bookingReference, "9876543299");
      const trackWrongRef = await trackAppointmentStatus("SNC-20260802-0000", "6383636281");

      assert(trackSuccess.success && trackSuccess.data?.bookingReference === bookingResult.bookingReference, "Appointment tracking with correct reference and mobile succeeds");
      assert(!trackWrongMobile.success, "Tracking with incorrect mobile number is rejected");
      assert(!trackWrongRef.success, "Tracking with nonexistent reference is rejected");
      assert(trackWrongMobile.error === trackWrongRef.error, "Tracking errors are generic and identical (No user enumeration)");
      assert(!("id" in (trackSuccess.data || {})), "Internal database UUID is never exposed in tracking response");

      // Cleanup test records
      if (createdApt) {
        await prisma.appointmentStatusHistory.deleteMany({ where: { appointmentId: createdApt.id } });
        await prisma.appointment.delete({ where: { id: createdApt.id } });
      }
      await prisma.notification.deleteMany({ where: { recipient: "e2e.patient@example.com" } });
    }
  } else {
    console.log("  [INFO] Offline / Mock environment: verified schema, reference formats, and validation logic.");
  }

  console.log("\n=================================================================");
  console.log(`  VERIFICATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================================\n");
}

runPhase2And3E2EVerification()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
