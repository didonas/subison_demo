import "server-only";
import { prisma } from "../prisma";

export interface DoctorScheduleInput {
  doctorId: string;
  dayOfWeek: number; // 0..6
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDuration: number; // e.g. 15, 30
  capacity: number; // e.g. 1, 2
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  breaks: {
    name: string;
    startTime: string;
    endTime: string;
  }[];
  adminId: string;
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export async function checkAffectedAppointmentsForScheduleChange(
  doctorId: string,
  dayOfWeek: number,
  newStartTime: string,
  newEndTime: string,
  newBreaks: { startTime: string; endTime: string }[]
) {
  const today = new Date();
  const startMins = timeToMinutes(newStartTime);
  const endMins = timeToMinutes(newEndTime);

  // Find future active appointments for this doctor
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: { gte: today },
      status: { in: ["PENDING", "CONFIRMED", "RESCHEDULED"] }
    },
    select: {
      id: true,
      bookingReference: true,
      patientName: true,
      appointmentDate: true,
      startTime: true,
      status: true,
    }
  });

  const affected = appointments.filter(app => {
    const appDay = app.appointmentDate.getUTCDay();
    if (appDay !== dayOfWeek) return false;

    const appMins = timeToMinutes(app.startTime);
    // Outside working hours
    if (appMins < startMins || appMins >= endMins) return true;

    // Inside any break interval
    for (const b of newBreaks) {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      if (appMins >= bStart && appMins < bEnd) return true;
    }

    return false;
  });

  return affected;
}

export async function updateDoctorSchedule(input: DoctorScheduleInput) {
  const startMins = timeToMinutes(input.startTime);
  const endMins = timeToMinutes(input.endTime);

  if (startMins >= endMins) {
    return { success: false, error: "Schedule start time must be earlier than end time." };
  }

  if (input.slotDuration <= 0 || input.slotDuration > 120) {
    return { success: false, error: "Slot duration must be between 5 and 120 minutes." };
  }

  if (input.capacity <= 0 || input.capacity > 10) {
    return { success: false, error: "Slot capacity must be between 1 and 10." };
  }

  // Validate breaks
  for (let i = 0; i < input.breaks.length; i++) {
    const b = input.breaks[i];
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);

    if (bStart >= bEnd) {
      return { success: false, error: `Break "${b.name}" start time must be before end time.` };
    }

    if (bStart < startMins || bEnd > endMins) {
      return { success: false, error: `Break "${b.name}" must fall within working hours (${input.startTime} - ${input.endTime}).` };
    }

    // Check overlap with other breaks
    for (let j = i + 1; j < input.breaks.length; j++) {
      const b2 = input.breaks[j];
      const b2Start = timeToMinutes(b2.startTime);
      const b2End = timeToMinutes(b2.endTime);

      if (Math.max(bStart, b2Start) < Math.min(bEnd, b2End)) {
        return { success: false, error: `Breaks "${b.name}" and "${b2.name}" overlap.` };
      }
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Delete existing availability for this day
    const existing = await tx.doctorAvailability.findFirst({
      where: { doctorId: input.doctorId, dayOfWeek: input.dayOfWeek }
    });

    if (existing) {
      await tx.doctorBreak.deleteMany({ where: { doctorAvailabilityId: existing.id } });
      await tx.doctorAvailability.delete({ where: { id: existing.id } });
    }

    const created = await tx.doctorAvailability.create({
      data: {
        doctorId: input.doctorId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        slotDuration: input.slotDuration,
        maxBookings: input.capacity,
        capacity: input.capacity,
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
        breaks: {
          create: input.breaks.map(b => ({
            name: b.name,
            startTime: b.startTime,
            endTime: b.endTime,
          }))
        }
      },
      include: { breaks: true }
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        adminUserId: input.adminId,
        action: "UPDATE_DOCTOR_SCHEDULE",
        resourceType: "SCHEDULE",
        resourceId: created.id,
        metadata: JSON.stringify({
          doctorId: input.doctorId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          slotDuration: input.slotDuration,
          capacity: input.capacity,
        })
      }
    });

    return created;
  });

  return { success: true, schedule: result };
}

// 2. Doctor Leave Management
export async function getDoctorLeaves(doctorId: string) {
  return prisma.doctorLeave.findMany({
    where: { doctorId },
    orderBy: { startDate: "asc" }
  });
}

export async function addDoctorLeave(
  doctorId: string,
  startDate: string,
  endDate: string,
  reason: string,
  adminId: string
) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return { success: false, error: "Leave start date cannot be after end date." };
  }

  const leave = await prisma.$transaction(async (tx) => {
    const created = await tx.doctorLeave.create({
      data: {
        doctorId,
        startDate: start,
        endDate: end,
        reason: reason.trim(),
        createdByAdminId: adminId,
      }
    });

    await tx.auditLog.create({
      data: {
        adminUserId: adminId,
        action: "ADD_DOCTOR_LEAVE",
        resourceType: "DOCTOR_LEAVE",
        resourceId: created.id,
        metadata: JSON.stringify({ doctorId, startDate, endDate })
      }
    });

    return created;
  });

  return { success: true, leave };
}

export async function deleteDoctorLeave(leaveId: string, adminId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.doctorLeave.delete({ where: { id: leaveId } });
    await tx.auditLog.create({
      data: {
        adminUserId: adminId,
        action: "DELETE_DOCTOR_LEAVE",
        resourceType: "DOCTOR_LEAVE",
        resourceId: leaveId,
      }
    });
  });

  return { success: true };
}

// 3. Hospital Holidays Management
export async function getHospitalHolidays() {
  return prisma.hospitalHoliday.findMany({
    orderBy: { date: "asc" }
  });
}

export async function addHospitalHoliday(
  name: string,
  dateStr: string,
  description: string,
  adminId: string
) {
  const date = new Date(dateStr);

  const existing = await prisma.hospitalHoliday.findFirst({ where: { date } });
  if (existing) {
    return { success: false, error: "A hospital holiday is already configured for this date." };
  }

  const holiday = await prisma.$transaction(async (tx) => {
    const created = await tx.hospitalHoliday.create({
      data: {
        name: name.trim(),
        date,
        description: description.trim(),
        createdByAdminId: adminId,
      }
    });

    await tx.auditLog.create({
      data: {
        adminUserId: adminId,
        action: "ADD_HOSPITAL_HOLIDAY",
        resourceType: "HOSPITAL_HOLIDAY",
        resourceId: created.id,
        metadata: JSON.stringify({ name, date: dateStr })
      }
    });

    return created;
  });

  return { success: true, holiday };
}

export async function deleteHospitalHoliday(holidayId: string, adminId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.hospitalHoliday.delete({ where: { id: holidayId } });
    await tx.auditLog.create({
      data: {
        adminUserId: adminId,
        action: "DELETE_HOSPITAL_HOLIDAY",
        resourceType: "HOSPITAL_HOLIDAY",
        resourceId: holidayId,
      }
    });
  });

  return { success: true };
}
