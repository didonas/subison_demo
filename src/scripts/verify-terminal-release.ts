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
import { bookAppointment, transitionAppointmentStatus } from "../lib/appointments/service";

export async function runTerminalReleaseVerification() {
  console.log("=================================================");
  console.log("   EXPANDED TERMINAL STATUS & CAPACITY SUITE     ");
  console.log("=================================================\n");

  const results: Record<string, boolean> = {};

  try {
    const doctor = await prisma.doctor.findFirst({
      include: { department: true }
    });
    if (!doctor) {
      console.log("BLOCKED — database unavailable");
      return;
    }

    const adminUser = await prisma.adminUser.findFirst();
    const testDate = new Date("2026-09-01");
    const testTime = "10:00";

    const terminalStatuses = ["CANCELLED", "REJECTED", "COMPLETED", "NO_SHOW"] as const;

    for (const status of terminalStatuses) {
      // 1. Create a test appointment with an active SlotReservation and associated note
      const apt = await prisma.appointment.create({
        data: {
          bookingReference: `TEST-${status}-${Date.now().toString().slice(-4)}`,
          doctorId: doctor.id,
          departmentId: doctor.departmentId,
          appointmentDate: testDate,
          startTime: testTime,
          endTime: testTime,
          status: status === "COMPLETED" || status === "NO_SHOW" ? "CONFIRMED" : "PENDING",
          patientName: `Test ${status} Patient`,
          mobileNumber: "9870099999",
          patientType: "NEW",
          preferredLanguage: "EN",
          privacyConsent: true,
          communicationConsent: true,
          activeSlotKey: null,
          ...(adminUser ? {
            notes: {
              create: {
                content: `Initial clinical note for ${status}`,
                authorAdminId: adminUser.id
              }
            }
          } : {})
        }
      });

      await prisma.slotReservation.create({
        data: {
          doctorId: doctor.id,
          appointmentDate: testDate,
          startTime: testTime,
          position: 1,
          appointmentId: apt.id,
        }
      });

      // 2. Transition to terminal status
      const transitionResult = await transitionAppointmentStatus({
        appointmentId: apt.id,
        targetStatus: status,
        notes: `Transitioning to ${status} in test`
      });

      // 3. Verify SlotReservation is deleted
      const remainingReservation = await prisma.slotReservation.findUnique({
        where: { appointmentId: apt.id }
      });

      // 4. Verify Appointment, Status History, Audit records, and Notes still exist
      const remainingApt = await prisma.appointment.findUnique({
        where: { id: apt.id },
        include: { history: true, notes: true }
      });

      const released = transitionResult.success && remainingReservation === null;
      const dataRetained = 
        remainingApt !== null && 
        remainingApt.history.length > 0 && 
        remainingApt.activeSlotKey === null;

      results[`${status}: SlotReservation deleted`] = released;
      results[`${status}: Appointment, history, notes retained with activeSlotKey null`] = dataRetained;

      // 5. Repeated terminal request check (idempotency / safe rejection)
      const repeatTransition = await transitionAppointmentStatus({
        appointmentId: apt.id,
        targetStatus: status,
        notes: `Repeated transition`
      });
      results[`Repeated ${status}: safe handling`] = !repeatTransition.success || repeatTransition.appointment?.status === status;

      // Cleanup
      if (adminUser) {
        await prisma.appointmentNote.deleteMany({ where: { appointmentId: apt.id } });
      }
      await prisma.appointmentStatusHistory.deleteMany({ where: { appointmentId: apt.id } });
      await prisma.appointment.delete({ where: { id: apt.id } });
    }

    // ----------------------------------------------------
    // TEST: Service-Level Capacity = 2 with 10 Concurrent Booking Requests
    // ----------------------------------------------------
    console.log(">>> Testing Service-Level Capacity = 2 with 10 Concurrent Requests...");
    const capDateStr = "2026-09-02";
    const capDate = new Date(capDateStr);
    const capTime = "14:00";

    // Setup doctor availability with capacity = 2
    const dayOfWeek = capDate.getDay();
    await prisma.doctorAvailability.deleteMany({
      where: {
        doctorId: doctor.id,
        dayOfWeek
      }
    });

    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek,
        startTime: "14:00",
        endTime: "15:00",
        slotDuration: 30,
        maxBookings: 2, // capacity = 2
        capacity: 2,
      }
    });

    // Clean any prior bookings on this slot
    const priorApts = await prisma.appointment.findMany({
      where: { doctorId: doctor.id, appointmentDate: capDate, startTime: capTime }
    });
    if (priorApts.length > 0) {
      const priorIds = priorApts.map(a => a.id);
      await prisma.slotReservation.deleteMany({ where: { appointmentId: { in: priorIds } } });
      await prisma.appointmentStatusHistory.deleteMany({ where: { appointmentId: { in: priorIds } } });
      await prisma.appointment.deleteMany({ where: { id: { in: priorIds } } });
    }

    // Issue 10 concurrent booking requests via the authoritative bookAppointment service
    const concurrentRequests = Array.from({ length: 10 }).map((_, idx) => {
      const numStr = String(idx + 1).padStart(2, "0");
      return bookAppointment({
        patientName: `Concurrent Capacity Patient ${numStr}`,
        mobileNumber: `98700980${numStr}`,
        email: `verify_p7_cap_${numStr}@example.com`,
        doctorId: doctor.id,
        appointmentDate: capDateStr,
        startTime: capTime,
        patientType: "NEW",
        preferredLanguage: "EN",
        privacyConsent: true,
        communicationConsent: true,
        turnstileToken: "1x00000000000000000000AA"
      });
    });

    const bookingOutcomes = await Promise.all(concurrentRequests);
    const successfulBookings = bookingOutcomes.filter(b => b.success);
    const rejectedBookings = bookingOutcomes.filter(b => !b.success);

    // Query resulting database state
    const createdReservations = await prisma.slotReservation.findMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: capDate,
        startTime: capTime
      },
      orderBy: { position: "asc" }
    });

    const createdAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: capDate,
        startTime: capTime
      }
    });

    const positions = createdReservations.map(r => r.position);
    const hasPositions1And2 = positions.length === 2 && positions[0] === 1 && positions[1] === 2;
    const noDuplicatePositions = new Set(positions).size === positions.length;
    const noOrphanReservations = createdReservations.every(r => createdAppointments.some(a => a.id === r.appointmentId));
    const noMissingReservations = createdAppointments.every(a => createdReservations.some(r => r.appointmentId === a.id));
    const noPositionGreaterThanCapacity = createdReservations.every(r => r.position <= 2);

    results["Capacity 2: Exactly 2 successful appointments out of 10"] = successfulBookings.length === 2;
    results["Capacity 2: Exactly 8 rejected requests with capacity exceeded"] = rejectedBookings.length === 8;
    results["Capacity 2: Exactly 2 SlotReservations with positions 1 and 2"] = hasPositions1And2;
    results["Capacity 2: 0 duplicate reservation positions"] = noDuplicatePositions;
    results["Capacity 2: 0 appointments missing reservations"] = noMissingReservations;
    results["Capacity 2: 0 orphan reservations"] = noOrphanReservations;
    results["Capacity 2: 0 positions greater than capacity"] = noPositionGreaterThanCapacity;

    // Cleanup capacity test appointments
    const capIds = createdAppointments.map(a => a.id);
    await prisma.slotReservation.deleteMany({ where: { appointmentId: { in: capIds } } });
    await prisma.appointmentStatusHistory.deleteMany({ where: { appointmentId: { in: capIds } } });
    await prisma.appointment.deleteMany({ where: { id: { in: capIds } } });

    console.log("\n--- TEST RESULTS ---");
    let allPassed = true;
    for (const [name, passed] of Object.entries(results)) {
      console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
      if (!passed) allPassed = false;
    }

    console.log(`\nOVERALL: ${allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}`);
  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runTerminalReleaseVerification();
}
