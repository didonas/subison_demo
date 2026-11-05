import "server-only";
import { prisma } from "../prisma";
import { randomBytes } from "crypto";
import { sendNotification } from "../notifications/service";
import { verifySpamProtection } from "../contact";
import { checkRateLimit } from "../rate-limit";
import { AppointmentFormData } from "../validation/appointment";
import { env } from "../env";

// 1. Generate unique booking reference: SNC-YYYYMMDD-XXXXXXXX (case-normalized, crypto random)
export function generateBookingReference(now = new Date()): string {
  // Use Asia/Kolkata timezone to get correct YYYYMMDD
  const kolkataDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  
  const datePart = kolkataDateStr.replace(/-/g, "");
  const randomSuffix = randomBytes(4).toString("hex").toUpperCase(); // 8 hex characters (4.29 billion possibilities per date)
  return `SNC-${datePart}-${randomSuffix}`;
}

// 2. Format active slot key for unique constraint
export function formatActiveSlotKey(doctorId: string, date: string, startTime: string): string {
  return `${doctorId}_${date}_${startTime}`;
}

// Helper to get current Date string in Asia/Kolkata
export function getTodayKolkata(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

// Helper to get current Time in minutes in Asia/Kolkata
export function getCurrentTimeMinutesKolkata(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date());
  
  const hour = Number(parts.find(p => p.type === "hour")?.value || "0");
  const minute = Number(parts.find(p => p.type === "minute")?.value || "0");
  return hour * 60 + minute;
}

export async function getAvailableBookingDates(doctorId: string): Promise<string[]> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { availabilities: true }
  });

  if (!doctor || doctor.availabilities.length === 0) {
    return [];
  }

  const availableDays = doctor.availabilities.map(a => a.dayOfWeek);
  
  // Generate next 30 days starting from today in Asia/Kolkata
  const todayStr = getTodayKolkata();
  const [tY, tM, tD] = todayStr.split("-").map(Number);
  const baseDate = new Date(Date.UTC(tY, tM - 1, tD, 12, 0, 0));

  const candidateDates: string[] = [];
  
  for (let i = 0; i <= 30; i++) {
    const d = new Date(baseDate);
    d.setUTCDate(baseDate.getUTCDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getUTCDay();
    
    if (availableDays.includes(dayOfWeek)) {
      candidateDates.push(dateStr);
    }
  }

  if (candidateDates.length === 0) return [];

  // Remove hospital holidays
  const holidays = await prisma.hospitalHoliday.findMany({
    where: {
      date: { in: candidateDates.map(d => new Date(d)) }
    },
    select: { date: true }
  });
  const holidayDateStrs = new Set(holidays.map(h => h.date.toISOString().split("T")[0]));

  // Remove full-day blocked slots
  const blocked = await prisma.blockedSlot.findMany({
    where: {
      date: { in: candidateDates.map(d => new Date(d)) },
      startTime: null
    },
    select: { date: true }
  });
  const blockedDateStrs = new Set(blocked.map(b => b.date.toISOString().split("T")[0]));

  return candidateDates.filter(d => !holidayDateStrs.has(d) && !blockedDateStrs.has(d));
}

export async function getAvailableSlots(doctorId: string, dateStr: string): Promise<string[]> {
  const dateObj = new Date(dateStr);
  const dayOfWeek = dateObj.getUTCDay();

  // Check hospital holiday
  const holiday = await prisma.hospitalHoliday.findFirst({
    where: { date: new Date(dateStr) }
  });
  if (holiday) return [];

  // Check full day block
  const fullDayBlock = await prisma.blockedSlot.findFirst({
    where: { date: new Date(dateStr), startTime: null }
  });
  if (fullDayBlock) return [];

  const availabilities = await prisma.doctorAvailability.findMany({
    where: { doctorId, dayOfWeek }
  });

  if (availabilities.length === 0) return [];

  const rawSlots: string[] = [];
  for (const availability of availabilities) {
    const [startHour, startMin] = availability.startTime.split(":").map(Number);
    const [endHour, endMin] = availability.endTime.split(":").map(Number);
    
    let currentMins = startHour * 60 + startMin;
    const endMins = endHour * 60 + endMin;
    
    while (currentMins + availability.slotDuration <= endMins) {
      const h = Math.floor(currentMins / 60).toString().padStart(2, "0");
      const m = (currentMins % 60).toString().padStart(2, "0");
      rawSlots.push(`${h}:${m}`);
      currentMins += availability.slotDuration;
    }
  }

  // Check partial time blocked slots on this date
  const partialBlocks = await prisma.blockedSlot.findMany({
    where: {
      date: new Date(dateStr),
      startTime: { not: null }
    }
  });

  let validSlots = rawSlots.filter(slot => {
    const [sH, sM] = slot.split(":").map(Number);
    const slotMins = sH * 60 + sM;
    
    for (const b of partialBlocks) {
      if (!b.startTime) continue;
      const [bStartH, bStartM] = b.startTime.split(":").map(Number);
      const bStartMins = bStartH * 60 + bStartM;
      
      const [bEndH, bEndM] = (b.endTime || b.startTime).split(":").map(Number);
      const bEndMins = bEndH * 60 + bEndM;

      if (slotMins >= bStartMins && slotMins < bEndMins) {
        return false;
      }
    }
    return true;
  });

  // If date is today in Asia/Kolkata, exclude passed time slots
  const todayKolkata = getTodayKolkata();
  if (dateStr === todayKolkata) {
    const currentMins = getCurrentTimeMinutesKolkata();
    validSlots = validSlots.filter(slot => {
      const [sH, sM] = slot.split(":").map(Number);
      return (sH * 60 + sM) > currentMins;
    });
  }

  if (validSlots.length === 0) return [];

  // Filter out slots already taken by active slot reservations up to capacity
  const reservations = await prisma.slotReservation.findMany({
    where: {
      doctorId,
      appointmentDate: new Date(dateStr),
      startTime: { in: validSlots },
    },
    select: { startTime: true }
  });

  const reservationCounts = new Map<string, number>();
  for (const r of reservations) {
    reservationCounts.set(r.startTime, (reservationCounts.get(r.startTime) || 0) + 1);
  }

  return validSlots.filter(s => {
    const [sH, sM] = s.split(":").map(Number);
    const slotMins = sH * 60 + sM;

    const matchingAvail = availabilities.find(a => {
      const [sh, sm] = a.startTime.split(":").map(Number);
      const [eh, em] = a.endTime.split(":").map(Number);
      return slotMins >= (sh * 60 + sm) && slotMins < (eh * 60 + em);
    });

    const capacity = matchingAvail?.capacity || matchingAvail?.maxBookings || 1;
    const reserved = reservationCounts.get(s) || 0;
    return reserved < capacity;
  });
}

export async function validateRequestedSlot(doctorId: string, dateStr: string, startTime: string): Promise<boolean> {
  const availableSlots = await getAvailableSlots(doctorId, dateStr);
  return availableSlots.includes(startTime);
}

// Rate limit helper using action-specific and identifier-specific HMAC-SHA256
async function checkAppointmentRateLimits(mobileNumber: string): Promise<{ success: boolean; error?: string }> {
  const ipLimit = await checkRateLimit("appointment_booking", 5, 15, { keyType: "ip" });
  if (!ipLimit.success) {
    return { success: false, error: "Too many appointment requests from this device. Please try again later." };
  }

  const mobileLimit = await checkRateLimit("appointment_booking", 5, 60, {
    keyType: "mobile",
    keyValue: mobileNumber,
  });
  if (!mobileLimit.success) {
    return { success: false, error: "Too many appointment requests for this mobile number. Please try again later." };
  }

  return { success: true };
}

export async function bookAppointment(data: AppointmentFormData) {
  // 1. Verify Spam Protection
  const turnstile = await verifySpamProtection(
    "appointment_booking",
    data.turnstileToken
  );
  if (!turnstile.success) {
    return { success: false, error: "Security check failed. Please refresh and try again." };
  }

  // 2. Rate Limits
  const rateLimit = await checkAppointmentRateLimits(data.mobileNumber);
  if (!rateLimit.success) {
    return { success: false, error: rateLimit.error };
  }

  // 3. Verify Doctor exists
  const doctor = await prisma.doctor.findUnique({ where: { id: data.doctorId } });
  if (!doctor) {
    return { success: false, error: "The selected doctor was not found." };
  }

  // 4. Verify Speciality if provided
  if (data.specialityId) {
    const spec = await prisma.speciality.findUnique({ where: { id: data.specialityId } });
    if (!spec) {
      return { success: false, error: "The selected speciality was not found." };
    }
  }

  // 5. Validate Slot is within doctor's configured availability right now
  const isAvailable = await validateRequestedSlot(data.doctorId, data.appointmentDate, data.startTime);
  if (!isAvailable) {
    return { success: false, error: "The requested time slot is not available for this doctor." };
  }

  // 6. Option A: Safe Retry Loop with fresh transactions for capacity & reference collisions
  const MAX_SLOT_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_SLOT_RETRIES; attempt++) {
    const bookingReference = generateBookingReference();

    try {
      const result = await prisma.$transaction(async (tx) => {
        const dateObj = new Date(data.appointmentDate);
        const dayOfWeek = dateObj.getUTCDay();

        // 1. Read effective slot capacity
        const avail = await tx.doctorAvailability.findFirst({
          where: { doctorId: data.doctorId, dayOfWeek }
        });
        const slotCapacity = avail?.capacity || avail?.maxBookings || 1;

        // 2. Query active SlotReservation rows for this slot
        const existingReservations = await tx.slotReservation.findMany({
          where: {
            doctorId: data.doctorId,
            appointmentDate: dateObj,
            startTime: data.startTime,
          },
          select: { position: true }
        });

        if (existingReservations.length >= slotCapacity) {
          throw new Error("SLOT_CAPACITY_EXCEEDED");
        }

        // 3. Select lowest available position in 1..slotCapacity
        const takenPositions = new Set(existingReservations.map(r => r.position));
        let assignedPosition = 1;
        for (let p = 1; p <= slotCapacity; p++) {
          if (!takenPositions.has(p)) {
            assignedPosition = p;
            break;
          }
        }

        // 4. Create appointment (activeSlotKey is set to null, SlotReservation is authoritative)
        const appointment = await tx.appointment.create({
          data: {
            bookingReference,
            doctorId: data.doctorId,
            departmentId: doctor.departmentId,
            specialityId: data.specialityId || null,
            appointmentDate: dateObj,
            startTime: data.startTime,
            endTime: data.startTime,
            activeSlotKey: null,
            status: "PENDING",
            patientName: data.patientName,
            mobileNumber: data.mobileNumber,
            alternativeNumber: data.alternativeNumber || null,
            email: data.email || null,
            ageGroup: data.ageGroup || null,
            gender: data.gender || null,
            patientType: data.patientType,
            preferredLanguage: data.preferredLanguage,
            reasonForVisit: data.reasonForVisit || null,
            privacyConsent: data.privacyConsent,
            communicationConsent: data.communicationConsent,
          }
        });

        // 5. Insert SlotReservation with compound unique constraint
        await tx.slotReservation.create({
          data: {
            doctorId: data.doctorId,
            appointmentDate: dateObj,
            startTime: data.startTime,
            position: assignedPosition,
            appointmentId: appointment.id,
          }
        });

        // 6. Record status history
        await tx.appointmentStatusHistory.create({
          data: {
            appointmentId: appointment.id,
            status: "PENDING",
            notes: "Initial appointment request submitted by patient via online portal.",
            changedById: null,
          }
        });

        return appointment;
      });

      // Send notifications (outbox pattern - isolated from transaction)
      if (result.email) {
        await sendNotification("EMAIL", "APPOINTMENT_REQUEST_RECEIVED", {
          to: result.email,
          subject: `Appointment Request Received: ${result.bookingReference}`,
          text: `Dear ${result.patientName},\n\nWe have received your appointment request (Ref: ${result.bookingReference}).\nOur hospital administrator will review and confirm your slot shortly.\n\nThank you,\nHospital`
        });
      }

      const adminEmail = env.APPOINTMENT_ADMIN_EMAIL;
      if (adminEmail) {
        await sendNotification("EMAIL", "APPOINTMENT_REQUEST_ADMIN_ALERT", {
          to: adminEmail,
          subject: `New Appointment Request: ${result.bookingReference}`,
          text: `Booking Reference: ${result.bookingReference}\nPatient: ${result.patientName}\nMobile: ${result.mobileNumber}\nDoctor ID: ${result.doctorId}\nRequested Date: ${data.appointmentDate} at ${data.startTime}\nType: ${result.patientType}`
        });
      }

      return { success: true, bookingReference: result.bookingReference };
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "SLOT_CAPACITY_EXCEEDED") {
        return { success: false, error: "That appointment slot is no longer available. Please choose another time." };
      }

      if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
        const meta = (error as { meta?: { target?: string[] | string } }).meta;
        const target = Array.isArray(meta?.target) ? meta.target : (typeof meta?.target === "string" ? [meta.target] : []);
        
        // On P2002 collision, the whole transaction rolled back cleanly.
        // Retry with a fresh transaction to re-read current reservations and pick another position if capacity allows.
        if (attempt < MAX_SLOT_RETRIES) {
          console.warn(`Concurrent constraint collision on attempt ${attempt} (target: ${target.join(",")}), retrying in fresh transaction...`);
          continue;
        }

        return { success: false, error: "That appointment slot is no longer available. Please choose another time." };
      }

      console.error("Booking transaction failed:", error);
      return { success: false, error: "An unexpected error occurred while saving the appointment." };
    }
  }

  return { success: false, error: "An unexpected error occurred while saving the appointment." };
}

// 7. Central Transactional Status Transition Service
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "RESCHEDULED" | "CANCELLED" | "REJECTED" | "COMPLETED" | "NO_SHOW";

export const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "RESCHEDULED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["RESCHEDULED", "CANCELLED", "COMPLETED", "NO_SHOW"],
  RESCHEDULED: ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
} as const;

export interface StatusTransitionOptions {
  appointmentId: string;
  targetStatus: AppointmentStatus;
  expectedCurrentStatus?: AppointmentStatus;
  expectedVersion?: number;
  newDate?: string;
  newTime?: string;
  notes?: string;
  changedById?: string | null;
  notifyPatient?: boolean;
}

export async function transitionAppointmentStatus(options: StatusTransitionOptions): Promise<{
  success: boolean;
  error?: string;
  appointment?: {
    id: string;
    bookingReference: string;
    status: AppointmentStatus;
    activeSlotKey: string | null;
    appointmentDate: Date;
    startTime: string;
  };
}> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current appointment inside transaction for concurrency safety
      const current = await tx.appointment.findUnique({
        where: { id: options.appointmentId },
        include: { doctor: true }
      });

      if (!current) {
        throw new Error("APPOINTMENT_NOT_FOUND");
      }

      // 2. Concurrency check: verify status or version hasn't been modified concurrently
      if (options.expectedCurrentStatus && current.status !== options.expectedCurrentStatus) {
        throw new Error("CONCURRENT_MODIFICATION");
      }
      if (options.expectedVersion !== undefined && current.version !== options.expectedVersion) {
        throw new Error("CONCURRENT_MODIFICATION");
      }

      // 3. Status Transition Matrix Validation
      const currentStatus = current.status as AppointmentStatus;
      const allowedTargets = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedTargets.includes(options.targetStatus)) {
        throw new Error(`INVALID_TRANSITION:${currentStatus}->${options.targetStatus}`);
      }

      let newActiveSlotKey: string | null = null;
      let newDateObj = current.appointmentDate;
      let newTimeStr = current.startTime;

      switch (options.targetStatus) {
        case "CONFIRMED": {
          const dateStr = current.appointmentDate.toISOString().split("T")[0];
          newActiveSlotKey = formatActiveSlotKey(current.doctorId, dateStr, current.startTime);
          break;
        }
        case "RESCHEDULED": {
          if (!options.newDate || !options.newTime) {
            throw new Error("RESCHEDULE_PARAMS_MISSING");
          }
          
          const isAvailable = await validateRequestedSlot(current.doctorId, options.newDate, options.newTime);
          if (!isAvailable) {
            throw new Error("SLOT_UNAVAILABLE");
          }

          newDateObj = new Date(options.newDate);
          newTimeStr = options.newTime;
          newActiveSlotKey = formatActiveSlotKey(current.doctorId, options.newDate, options.newTime);

          // Explicitly delete previous SlotReservation
          await tx.slotReservation.deleteMany({
            where: { appointmentId: options.appointmentId }
          });

          const newDayOfWeek = newDateObj.getUTCDay();
          const avail = await tx.doctorAvailability.findFirst({
            where: { doctorId: current.doctorId, dayOfWeek: newDayOfWeek }
          });
          const slotCapacity = avail?.capacity || avail?.maxBookings || 1;

          const existingReservations = await tx.slotReservation.findMany({
            where: {
              doctorId: current.doctorId,
              appointmentDate: newDateObj,
              startTime: newTimeStr,
            },
            select: { position: true }
          });

          if (existingReservations.length >= slotCapacity) {
            throw new Error("SLOT_CAPACITY_EXCEEDED");
          }

          const takenPositions = new Set(existingReservations.map(r => r.position));
          let assignedPosition = 1;
          for (let p = 1; p <= slotCapacity; p++) {
            if (!takenPositions.has(p)) {
              assignedPosition = p;
              break;
            }
          }

          await tx.slotReservation.create({
            data: {
              doctorId: current.doctorId,
              appointmentDate: newDateObj,
              startTime: newTimeStr,
              position: assignedPosition,
              appointmentId: options.appointmentId,
            }
          });
          break;
        }
        case "CANCELLED":
        case "REJECTED":
        case "COMPLETED":
        case "NO_SHOW": {
          newActiveSlotKey = null; // Released
          // Explicitly delete SlotReservation within transaction
          await tx.slotReservation.deleteMany({
            where: { appointmentId: options.appointmentId }
          });
          break;
        }
        case "PENDING": {
          const dateStr = current.appointmentDate.toISOString().split("T")[0];
          newActiveSlotKey = formatActiveSlotKey(current.doctorId, dateStr, current.startTime);
          break;
        }
      }

      // 4. Update appointment
      const updated = await tx.appointment.update({
        where: { id: options.appointmentId },
        data: {
          status: options.targetStatus,
          activeSlotKey: newActiveSlotKey,
          appointmentDate: newDateObj,
          startTime: newTimeStr,
          endTime: newTimeStr,
          confirmedByAdminId: options.changedById || undefined,
          version: { increment: 1 }
        },
        include: { doctor: true }
      });

      // 5. Create AppointmentStatusHistory
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: current.id,
          status: options.targetStatus,
          notes: options.notes || `Status changed from ${current.status} to ${options.targetStatus}`,
          changedById: options.changedById || null
        }
      });

      // 6. Create AuditLog (if admin identity exists)
      if (options.changedById) {
        await tx.auditLog.create({
          data: {
            adminUserId: options.changedById,
            action: `APPOINTMENT_${options.targetStatus}`,
            resourceType: "APPOINTMENT",
            resourceId: current.id,
            metadata: JSON.stringify({
              previousStatus: current.status,
              newStatus: options.targetStatus,
              bookingReference: current.bookingReference,
              appointmentDate: newDateObj.toISOString().split("T")[0],
              startTime: newTimeStr
            })
          }
        });
      }

      return { updated, current, newDateObj, newTimeStr };
    });

    // 7. Notification dispatch (isolated outside transaction)
    if (options.notifyPatient !== false && result.current.email) {
      if (options.targetStatus === "CONFIRMED") {
        await sendNotification("EMAIL", "APPOINTMENT_CONFIRMED", {
          to: result.current.email,
          subject: `Appointment Confirmed: ${result.current.bookingReference}`,
          text: `Dear ${result.current.patientName},\n\nYour appointment (Ref: ${result.current.bookingReference}) with ${result.current.doctor.name} on ${result.newDateObj.toISOString().split("T")[0]} at ${result.newTimeStr} has been CONFIRMED.\n\nThank you,\nHospital`
        });
      } else if (options.targetStatus === "RESCHEDULED") {
        await sendNotification("EMAIL", "APPOINTMENT_RESCHEDULED", {
          to: result.current.email,
          subject: `Appointment Rescheduled: ${result.current.bookingReference}`,
          text: `Dear ${result.current.patientName},\n\nYour appointment (Ref: ${result.current.bookingReference}) has been RESCHEDULED to ${result.newDateObj.toISOString().split("T")[0]} at ${result.newTimeStr}.\n\nThank you,\nHospital`
        });
      } else if (options.targetStatus === "CANCELLED" || options.targetStatus === "REJECTED") {
        await sendNotification("EMAIL", "APPOINTMENT_CANCELLED", {
          to: result.current.email,
          subject: `Appointment Update: ${result.current.bookingReference}`,
          text: `Dear ${result.current.patientName},\n\nYour appointment (Ref: ${result.current.bookingReference}) has been ${options.targetStatus.toLowerCase()}.\n\nReason/Notes: ${options.notes || "Not specified"}\n\nThank you,\nHospital`
        });
      }
    }

    return {
      success: true,
      appointment: {
        id: result.updated.id,
        bookingReference: result.updated.bookingReference,
        status: result.updated.status as AppointmentStatus,
        activeSlotKey: result.updated.activeSlotKey,
        appointmentDate: result.updated.appointmentDate,
        startTime: result.updated.startTime,
      }
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "APPOINTMENT_NOT_FOUND") {
        return { success: false, error: "Appointment not found." };
      }
      if (error.message === "CONCURRENT_MODIFICATION") {
        return { success: false, error: "The appointment was modified by another administrator. Please refresh and try again." };
      }
      if (error.message.startsWith("INVALID_TRANSITION")) {
        return { success: false, error: "Invalid status transition requested." };
      }
      if (error.message === "RESCHEDULE_PARAMS_MISSING") {
        return { success: false, error: "New appointment date and time are required for rescheduling." };
      }
      if (error.message === "SLOT_UNAVAILABLE") {
        return { success: false, error: "The selected rescheduling slot is no longer available." };
      }
    }

    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return { success: false, error: "The new time slot is no longer available. Please select another time." };
    }

    console.error("Status transition failed:", error);
    return { success: false, error: "An unexpected error occurred while updating the appointment status." };
  }
}

// 8. Secure Tracking with Mobile Verification and Rate Limiting
export type TrackingResult = {
  success: boolean;
  error?: string;
  data?: {
    bookingReference: string;
    status: string;
    doctorName: string;
    appointmentDate: string;
    startTime: string;
    history: { status: string; createdAt: Date }[];
  };
};

export async function trackAppointmentStatus(
  rawBookingRef: string,
  rawMobile: string
): Promise<TrackingResult> {
  const rateLimit = await checkRateLimit("appointment_tracking", 10, 15, { keyType: "ip" });
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many tracking attempts. Please wait 15 minutes before trying again."
    };
  }

  const bookingReference = rawBookingRef.trim().toUpperCase();
  const mobileNumber = rawMobile.trim().replace(/\s+/g, "");

  if (!bookingReference || !mobileNumber) {
    return {
      success: false,
      error: "Invalid booking reference or mobile number. Please check your details and try again."
    };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      bookingReference,
      mobileNumber
    },
    include: {
      doctor: {
        select: { name: true }
      },
      history: {
        select: { status: true, createdAt: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!appointment) {
    return {
      success: false,
      error: "Invalid booking reference or mobile number. Please check your details and try again."
    };
  }

  return {
    success: true,
    data: {
      bookingReference: appointment.bookingReference,
      status: appointment.status,
      doctorName: appointment.doctor.name,
      appointmentDate: appointment.appointmentDate.toISOString().split("T")[0],
      startTime: appointment.startTime,
      history: appointment.history
    }
  };
}
