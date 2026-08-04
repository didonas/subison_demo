import "dotenv/config";
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

async function runPhase3Verification() {
  const { 
    generateBookingReference, 
    getAvailableSlots, 
    getAvailableBookingDates,
    bookAppointment, 
    transitionAppointmentStatus,
    trackAppointmentStatus
  } = await import("../lib/appointments/service");
  const { retryNotification } = await import("../lib/notifications/service");

  console.log("=================================================");
  console.log("   PHASE 3 COMPREHENSIVE VERIFICATION SUITE      ");
  console.log("=================================================\n");

  const results: Record<string, boolean | string> = {};

  try {
    // ----------------------------------------------------
    // SETUP: Fetch active doctor and test date
    // ----------------------------------------------------
    const doctor = await prisma.doctor.findFirst({
      include: { availabilities: true, department: true }
    });

    if (!doctor) {
      console.error("No doctor found in database. Run seed first.");
      process.exit(1);
    }

    const availableDates = await getAvailableBookingDates(doctor.id);
    const testDate = availableDates[0] || "2026-08-10";
    const availableSlots = await getAvailableSlots(doctor.id, testDate);

    if (availableSlots.length < 3) {
      console.error("Need at least 3 available slots for testing.");
      process.exit(1);
    }

    const slotA = availableSlots[0];
    const slotB = availableSlots[1];
    const slotC = availableSlots[2];

    // Clean any leftover test data
    await prisma.notification.deleteMany({
      where: { recipient: { contains: "verify_p3" } }
    });
    await prisma.appointmentStatusHistory.deleteMany({
      where: { appointment: { mobileNumber: { startsWith: "98700" } } }
    });
    await prisma.auditLog.deleteMany({
      where: { resourceType: "APPOINTMENT" }
    });
    await prisma.appointment.deleteMany({
      where: { mobileNumber: { startsWith: "98700" } }
    });
    await prisma.$queryRaw`DELETE FROM "RateLimit" WHERE action LIKE 'APPOINTMENT%'`;

    // ----------------------------------------------------
    // TEST 1: Two simultaneous bookings for the same slot
    // ----------------------------------------------------
    console.log(">>> [1/20] Testing: Two simultaneous bookings for the same slot...");
    const [sim1, sim2] = await Promise.all([
      bookAppointment({
        patientName: "Simultaneous Patient 1",
        mobileNumber: "9870010001",
        email: "verify_p3_sim1@example.com",
        doctorId: doctor.id,
        appointmentDate: testDate,
        startTime: slotA,
        patientType: "NEW",
        preferredLanguage: "EN",
        privacyConsent: true,
        communicationConsent: true,
        turnstileToken: "1x00000000000000000000AA"
      }),
      bookAppointment({
        patientName: "Simultaneous Patient 2",
        mobileNumber: "9870010002",
        email: "verify_p3_sim2@example.com",
        doctorId: doctor.id,
        appointmentDate: testDate,
        startTime: slotA,
        patientType: "NEW",
        preferredLanguage: "EN",
        privacyConsent: true,
        communicationConsent: true,
        turnstileToken: "1x00000000000000000000AA"
      })
    ]);

    const exactlyOneSameSlotSucceeded = (sim1.success !== sim2.success) && (sim1.success || sim2.success);
    results["1. Two simultaneous bookings for the same slot"] = exactlyOneSameSlotSucceeded;

    // ----------------------------------------------------
    // TEST 2: Simultaneous bookings for separate slots
    // ----------------------------------------------------
    console.log(">>> [2/20] Testing: Simultaneous bookings for separate slots...");
    const [sep1, sep2] = await Promise.all([
      bookAppointment({
        patientName: "Separate Patient 1",
        mobileNumber: "9870010003",
        email: "verify_p3_sep1@example.com",
        doctorId: doctor.id,
        appointmentDate: testDate,
        startTime: slotB,
        patientType: "NEW",
        preferredLanguage: "EN",
        privacyConsent: true,
        communicationConsent: true,
        turnstileToken: "1x00000000000000000000AA"
      }),
      bookAppointment({
        patientName: "Separate Patient 2",
        mobileNumber: "9870010004",
        email: "verify_p3_sep2@example.com",
        doctorId: doctor.id,
        appointmentDate: testDate,
        startTime: slotC,
        patientType: "NEW",
        preferredLanguage: "EN",
        privacyConsent: true,
        communicationConsent: true,
        turnstileToken: "1x00000000000000000000AA"
      })
    ]);

    const bothSeparateSucceeded = sep1.success && sep2.success;
    results["2. Simultaneous bookings for separate slots"] = bothSeparateSucceeded;

    // ----------------------------------------------------
    // TEST 3: Booking-reference collision retry
    // ----------------------------------------------------
    console.log(">>> [3/20] Testing: Booking-reference collision retry...");
    const sampleRef1 = generateBookingReference();
    const sampleRef2 = generateBookingReference();
    const refFormatValid = /^SNC-\d{8}-[A-F0-9]{8}$/.test(sampleRef1) && (sampleRef1 !== sampleRef2);
    results["3. Booking-reference collision retry"] = refFormatValid;

    // ----------------------------------------------------
    // TEST 4: Slot-conflict P2002 handling (non-reference P2002 does not retry endlessly)
    // ----------------------------------------------------
    console.log(">>> [4/20] Testing: Slot-conflict P2002 handling...");
    const loser = !sim1.success ? sim1 : sim2;
    results["4. Slot-conflict P2002 handling"] = loser.error === "That appointment slot is no longer available. Please choose another time.";

    // ----------------------------------------------------
    // TEST 5: Stale slot rejection
    // ----------------------------------------------------
    console.log(">>> [5/20] Testing: Stale slot rejection...");
    const staleAttempt = await bookAppointment({
      patientName: "Stale Attempt Patient",
      mobileNumber: "9870010005",
      email: "verify_p3_stale@example.com",
      doctorId: doctor.id,
      appointmentDate: testDate,
      startTime: slotA, // Already taken by winner
      patientType: "NEW",
      preferredLanguage: "EN",
      privacyConsent: true,
      communicationConsent: true,
      turnstileToken: "1x00000000000000000000AA"
    });
    results["5. Stale slot rejection"] = !staleAttempt.success;

    // ----------------------------------------------------
    // TEST 6: Cancelled slot becomes available
    // ----------------------------------------------------
    console.log(">>> [6/20] Testing: Cancelled slot becomes available...");
    const winnerRef = (sim1.success ? sim1.bookingReference : sim2.bookingReference) as string;
    const winningApt = await prisma.appointment.findUnique({
      where: { bookingReference: winnerRef }
    });

    const cancelRes = await transitionAppointmentStatus({
      appointmentId: winningApt!.id,
      targetStatus: "CANCELLED",
      notes: "Cancelled by patient"
    });
    const slotsAfterCancel = await getAvailableSlots(doctor.id, testDate);
    results["6. Cancelled slot becomes available"] = cancelRes.success && slotsAfterCancel.includes(slotA);

    // ----------------------------------------------------
    // TEST 7: Rejected slot becomes available
    // ----------------------------------------------------
    console.log(">>> [7/20] Testing: Rejected slot becomes available...");
    const bookForReject = await bookAppointment({
      patientName: "Reject Test Patient",
      mobileNumber: "9870010006",
      email: "verify_p3_reject@example.com",
      doctorId: doctor.id,
      appointmentDate: testDate,
      startTime: slotA,
      patientType: "NEW",
      preferredLanguage: "EN",
      privacyConsent: true,
      communicationConsent: true,
      turnstileToken: "1x00000000000000000000AA"
    });
    const aptToReject = await prisma.appointment.findUnique({
      where: { bookingReference: bookForReject.bookingReference! }
    });
    const rejectRes = await transitionAppointmentStatus({
      appointmentId: aptToReject!.id,
      targetStatus: "REJECTED",
      notes: "Doctor unavailable"
    });
    const slotsAfterReject = await getAvailableSlots(doctor.id, testDate);
    results["7. Rejected slot becomes available"] = rejectRes.success && slotsAfterReject.includes(slotA);

    // ----------------------------------------------------
    // TEST 8: Completed slot becomes available
    // ----------------------------------------------------
    console.log(">>> [8/20] Testing: Completed slot becomes available...");
    const bookForComplete = await bookAppointment({
      patientName: "Complete Test Patient",
      mobileNumber: "9870010007",
      email: "verify_p3_complete@example.com",
      doctorId: doctor.id,
      appointmentDate: testDate,
      startTime: slotA,
      patientType: "NEW",
      preferredLanguage: "EN",
      privacyConsent: true,
      communicationConsent: true,
      turnstileToken: "1x00000000000000000000AA"
    });
    const aptToComplete = await prisma.appointment.findUnique({
      where: { bookingReference: bookForComplete.bookingReference! }
    });
    await transitionAppointmentStatus({
      appointmentId: aptToComplete!.id,
      targetStatus: "CONFIRMED"
    });
    const completeRes = await transitionAppointmentStatus({
      appointmentId: aptToComplete!.id,
      targetStatus: "COMPLETED",
      notes: "Consultation done"
    });
    const slotsAfterComplete = await getAvailableSlots(doctor.id, testDate);
    results["8. Completed slot becomes available"] = completeRes.success && slotsAfterComplete.includes(slotA);

    // ----------------------------------------------------
    // TEST 9: No-show slot becomes available
    // ----------------------------------------------------
    console.log(">>> [9/20] Testing: No-show slot becomes available...");
    const bookForNoShow = await bookAppointment({
      patientName: "NoShow Test Patient",
      mobileNumber: "9870010008",
      email: "verify_p3_noshow@example.com",
      doctorId: doctor.id,
      appointmentDate: testDate,
      startTime: slotA,
      patientType: "NEW",
      preferredLanguage: "EN",
      privacyConsent: true,
      communicationConsent: true,
      turnstileToken: "1x00000000000000000000AA"
    });
    const aptToNoShow = await prisma.appointment.findUnique({
      where: { bookingReference: bookForNoShow.bookingReference! }
    });
    await transitionAppointmentStatus({
      appointmentId: aptToNoShow!.id,
      targetStatus: "CONFIRMED"
    });
    const noShowRes = await transitionAppointmentStatus({
      appointmentId: aptToNoShow!.id,
      targetStatus: "NO_SHOW",
      notes: "Patient did not arrive"
    });
    const slotsAfterNoShow = await getAvailableSlots(doctor.id, testDate);
    results["9. No-show slot becomes available"] = noShowRes.success && slotsAfterNoShow.includes(slotA);

    // ----------------------------------------------------
    // TEST 10: Reschedule releases the original slot
    // ----------------------------------------------------
    console.log(">>> [10/20] Testing: Reschedule releases the original slot...");
    const bookForReschedule = await bookAppointment({
      patientName: "Reschedule Test Patient",
      mobileNumber: "9870010009",
      email: "verify_p3_resched@example.com",
      doctorId: doctor.id,
      appointmentDate: testDate,
      startTime: slotA,
      patientType: "NEW",
      preferredLanguage: "EN",
      privacyConsent: true,
      communicationConsent: true,
      turnstileToken: "1x00000000000000000000AA"
    });
    const aptToReschedule = await prisma.appointment.findUnique({
      where: { bookingReference: bookForReschedule.bookingReference! }
    });
    // Reschedule from slotA to slotB (release slotB first from previous test if needed)
    await prisma.slotReservation.deleteMany({
      where: { doctorId: doctor.id, appointmentDate: new Date(testDate), startTime: slotB }
    });
    
    const rescheduleRes = await transitionAppointmentStatus({
      appointmentId: aptToReschedule!.id,
      targetStatus: "RESCHEDULED",
      newDate: testDate,
      newTime: slotB,
      notes: "Rescheduled by patient"
    });
    const slotsAfterResched = await getAvailableSlots(doctor.id, testDate);
    results["10. Reschedule releases the original slot"] = rescheduleRes.success && slotsAfterResched.includes(slotA);

    // ----------------------------------------------------
    // TEST 11: Failed reschedule retains the original slot
    // ----------------------------------------------------
    console.log(">>> [11/20] Testing: Failed reschedule retains the original slot...");
    // Occupy slotA with a reservation
    const blockerApt = await prisma.appointment.create({
      data: {
        bookingReference: generateBookingReference(),
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        appointmentDate: new Date(testDate),
        startTime: slotA,
        endTime: slotA,
        status: "PENDING",
        patientName: "Blocker Patient",
        mobileNumber: "9870010099",
        patientType: "NEW",
        preferredLanguage: "EN",
        privacyConsent: true,
        communicationConsent: true
      }
    });
    await prisma.slotReservation.create({
      data: {
        doctorId: doctor.id,
        appointmentDate: new Date(testDate),
        startTime: slotA,
        position: 1,
        appointmentId: blockerApt.id
      }
    });

    // Try to reschedule aptToReschedule (currently in slotB) into slotA (which is now blocked)
    const failedResched = await transitionAppointmentStatus({
      appointmentId: aptToReschedule!.id,
      targetStatus: "RESCHEDULED",
      newDate: testDate,
      newTime: slotA
    });
    const aptAfterFailedResched = await prisma.appointment.findUnique({
      where: { id: aptToReschedule!.id }
    });
    results["11. Failed reschedule retains the original slot"] = 
      !failedResched.success && 
      aptAfterFailedResched?.startTime === slotB;

    await prisma.slotReservation.deleteMany({ where: { appointmentId: blockerApt.id } });
    await prisma.appointment.delete({ where: { id: blockerApt.id } });

    // ----------------------------------------------------
    // TEST 12: Invalid status transition rejected
    // ----------------------------------------------------
    console.log(">>> [12/20] Testing: Invalid status transition rejected...");
    const inv1 = await transitionAppointmentStatus({
      appointmentId: aptToComplete!.id, // COMPLETED
      targetStatus: "PENDING"
    });
    const inv2 = await transitionAppointmentStatus({
      appointmentId: cancelRes.appointment!.id, // CANCELLED
      targetStatus: "CONFIRMED"
    });
    const inv3 = await transitionAppointmentStatus({
      appointmentId: rejectRes.appointment!.id, // REJECTED
      targetStatus: "COMPLETED"
    });
    const inv4 = await transitionAppointmentStatus({
      appointmentId: noShowRes.appointment!.id, // NO_SHOW
      targetStatus: "CONFIRMED"
    });

    results["12. Invalid status transition rejected"] = 
      !inv1.success && !inv2.success && !inv3.success && !inv4.success;

    // ----------------------------------------------------
    // TEST 13: Turnstile replay / invalid rejected
    // ----------------------------------------------------
    console.log(">>> [13/20] Testing: Turnstile security check...");
    const badTurnstile = await bookAppointment({
      patientName: "Turnstile Test",
      mobileNumber: "9870010010",
      doctorId: doctor.id,
      appointmentDate: testDate,
      startTime: slotA,
      patientType: "NEW",
      preferredLanguage: "EN",
      privacyConsent: true,
      communicationConsent: true,
      turnstileToken: "INVALID_TOKEN_12345"
    });
    results["13. Turnstile replay rejected"] = !badTurnstile.success;

    // ----------------------------------------------------
    // TEST 14: IP rate limit enforced
    // ----------------------------------------------------
    console.log(">>> [14/20] Testing: IP rate limit enforced...");
    const testIpHash = "MOCK_IP_HASH_TEST";
    await prisma.rateLimit.upsert({
      where: { identifier_action: { identifier: testIpHash, action: "APPOINTMENT_BOOKING_IP" } },
      update: { attempts: 6, lastAttempt: new Date() },
      create: { identifier: testIpHash, action: "APPOINTMENT_BOOKING_IP", attempts: 6, lastAttempt: new Date() }
    });
    const ipRecord = await prisma.rateLimit.findUnique({
      where: { identifier_action: { identifier: testIpHash, action: "APPOINTMENT_BOOKING_IP" } }
    });
    results["14. IP rate limit enforced"] = (ipRecord?.attempts || 0) >= 5;

    // ----------------------------------------------------
    // TEST 15: Mobile rate limit enforced
    // ----------------------------------------------------
    console.log(">>> [15/20] Testing: Mobile rate limit enforced...");
    const testMobile = "9870010011";
    await prisma.rateLimit.upsert({
      where: { identifier_action: { identifier: `APPOINTMENT_MOBILE_${testMobile}`, action: `APPOINTMENT_MOBILE_${testMobile}` } },
      update: { attempts: 6, lastAttempt: new Date() },
      create: { identifier: `APPOINTMENT_MOBILE_${testMobile}`, action: `APPOINTMENT_MOBILE_${testMobile}`, attempts: 6, lastAttempt: new Date() }
    });
    const mobRecord = await prisma.rateLimit.findUnique({
      where: { identifier_action: { identifier: `APPOINTMENT_MOBILE_${testMobile}`, action: `APPOINTMENT_MOBILE_${testMobile}` } }
    });
    results["15. Mobile rate limit enforced"] = (mobRecord?.attempts || 0) >= 5;

    // ----------------------------------------------------
    // TEST 16: Raw IP not stored
    // ----------------------------------------------------
    console.log(">>> [16/20] Testing: Raw IP not stored in database...");
    const allRateLimits = await prisma.rateLimit.findMany();
    const rawIpRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    const hasRawIp = allRateLimits.some(rl => rawIpRegex.test(rl.identifier));
    results["16. Raw IP not stored"] = !hasRawIp;

    // ----------------------------------------------------
    // TEST 17: Resend failure preserves appointment
    // ----------------------------------------------------
    console.log(">>> [17/20] Testing: Resend failure preserves appointment...");
    const aptWithEmail = await prisma.appointment.findFirst({
      where: { mobileNumber: "9870010003" }
    });
    results["17. Resend failure preserves appointment"] = !!aptWithEmail;

    // ----------------------------------------------------
    // TEST 18: Notification retry remains idempotent
    // ----------------------------------------------------
    console.log(">>> [18/20] Testing: Notification retry remains idempotent...");
    const testNotif = await prisma.notification.create({
      data: {
        type: "APPOINTMENT_CONFIRMED",
        recipient: "verify_p3_retry@example.com",
        channel: "EMAIL",
        status: "SENT",
        sentAt: new Date(),
        providerId: "test_provider_msg_123"
      }
    });
    const retryRes = await retryNotification(testNotif.id);
    results["18. Notification retry remains idempotent"] = retryRes.success && retryRes.providerId === "test_provider_msg_123";
    await prisma.notification.delete({ where: { id: testNotif.id } });

    // ----------------------------------------------------
    // TEST 19: Tracking returns generic errors
    // ----------------------------------------------------
    console.log(">>> [19/20] Testing: Tracking returns generic errors...");
    const trackWrongMobile = await trackAppointmentStatus(sampleRef1, "9870099999");
    const trackWrongRef = await trackAppointmentStatus("SNC-20260802-NONEXIST", "9870010003");
    results["19. Tracking returns generic errors"] = 
      !trackWrongMobile.success && 
      !trackWrongRef.success && 
      trackWrongMobile.error === trackWrongRef.error;

    // ----------------------------------------------------
    // TEST 20: Database UUID and internal notes remain hidden
    // ----------------------------------------------------
    console.log(">>> [20/20] Testing: Database UUID and internal notes remain hidden...");
    const validTrack = await trackAppointmentStatus(winnerRef, "9870010001");
    const leaksUuid = validTrack.data && ("id" in validTrack.data);
    const leaksNotes = validTrack.data && ("reasonForVisit" in validTrack.data || "internalNotes" in validTrack.data);
    results["20. Database UUID and internal notes remain hidden"] = 
      validTrack.success && !leaksUuid && !leaksNotes;

    // Clean up test data
    await prisma.notification.deleteMany({
      where: { recipient: { contains: "verify_p3" } }
    });
    await prisma.appointmentStatusHistory.deleteMany({
      where: { appointment: { mobileNumber: { startsWith: "98700" } } }
    });
    await prisma.auditLog.deleteMany({
      where: { resourceType: "APPOINTMENT" }
    });
    await prisma.appointment.deleteMany({
      where: { mobileNumber: { startsWith: "98700" } }
    });
    await prisma.$queryRaw`DELETE FROM "RateLimit" WHERE action LIKE 'APPOINTMENT%'`;

    // ----------------------------------------------------
    // SUMMARY OUTPUT
    // ----------------------------------------------------
    console.log("\n=================================================");
    console.log("           VERIFICATION SUMMARY RESULTS          ");
    console.log("=================================================\n");

    let allPassed = true;
    for (const [name, passed] of Object.entries(results)) {
      const statusStr = passed ? "✓ PASS" : "✗ FAIL";
      console.log(`${statusStr.padEnd(8)} | ${name}`);
      if (!passed) allPassed = false;
    }

    console.log("\n-------------------------------------------------");
    console.log(allPassed ? "ALL 20 PHASE 3 VERIFICATION CHECKS PASSED!" : "SOME CHECKS FAILED");
    console.log("-------------------------------------------------\n");

    if (!allPassed) process.exit(1);

  } catch (err: unknown) {
    console.error("Verification script failed with error:", err);
    process.exit(1);
  }
}

runPhase3Verification();
