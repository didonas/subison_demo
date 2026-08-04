import "server-only";
import { prisma } from "../prisma";
import { AppointmentStatus, BookingChannel, Prisma } from "@/generated/prisma/client";
import { generateBookingReference, getTodayKolkata } from "./service";

// Helper for phone masking in tables
export function maskMobileNumber(mobile: string): string {
  if (!mobile || mobile.length < 4) return "••••••••••";
  const clean = mobile.replace(/\s+/g, "");
  const last4 = clean.slice(-4);
  return `••••••${last4}`;
}

// 1. Dashboard Metrics Aggregator
export interface DashboardMetrics {
  timestamp: string;
  todayTotal: number;
  todayPending: number;
  todayConfirmed: number;
  todayCheckedIn: number;
  todayCompleted: number;
  todayNoShow: number;
  todayCancelled: number;
  unreadEnquiries: number;
  failedNotifications: number;
  doctorUtilization: {
    doctorId: string;
    doctorName: string;
    departmentName: string;
    bookedCount: number;
    completedCount: number;
  }[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const todayStr = getTodayKolkata();
  const todayDate = new Date(todayStr);

  const [
    todayAppointments,
    unreadEnquiriesCount,
    failedNotificationsCount,
    doctors
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        appointmentDate: todayDate,
      },
      select: {
        id: true,
        status: true,
        doctorId: true,
        checkedInAt: true,
      }
    }),
    prisma.patientEnquiry.count({
      where: { status: "UNREAD" }
    }),
    prisma.notification.count({
      where: { status: "FAILED" }
    }),
    prisma.doctor.findMany({
      select: {
        id: true,
        name: true,
        department: { select: { name: true } },
      }
    })
  ]);

  let todayPending = 0;
  let todayConfirmed = 0;
  let todayCheckedIn = 0;
  let todayCompleted = 0;
  let todayNoShow = 0;
  let todayCancelled = 0;

  const doctorCounts = new Map<string, { booked: number; completed: number }>();
  doctors.forEach(d => doctorCounts.set(d.id, { booked: 0, completed: 0 }));

  todayAppointments.forEach(app => {
    if (app.status === "PENDING") todayPending++;
    if (app.status === "CONFIRMED" || app.status === "RESCHEDULED") {
      todayConfirmed++;
      if (app.checkedInAt) todayCheckedIn++;
    }
    if (app.status === "COMPLETED") todayCompleted++;
    if (app.status === "NO_SHOW") todayNoShow++;
    if (app.status === "CANCELLED" || app.status === "REJECTED") todayCancelled++;

    const doc = doctorCounts.get(app.doctorId);
    if (doc) {
      if (app.status !== "CANCELLED" && app.status !== "REJECTED") {
        doc.booked++;
      }
      if (app.status === "COMPLETED") {
        doc.completed++;
      }
    }
  });

  const doctorUtilization = doctors.map(doc => ({
    doctorId: doc.id,
    doctorName: doc.name,
    departmentName: doc.department.name,
    bookedCount: doctorCounts.get(doc.id)?.booked || 0,
    completedCount: doctorCounts.get(doc.id)?.completed || 0,
  }));

  return {
    timestamp: new Date().toISOString(),
    todayTotal: todayAppointments.length,
    todayPending,
    todayConfirmed,
    todayCheckedIn,
    todayCompleted,
    todayNoShow,
    todayCancelled,
    unreadEnquiries: unreadEnquiriesCount,
    failedNotifications: failedNotificationsCount,
    doctorUtilization,
  };
}

// 2. Filtered & Paginated Appointments List
export interface GetAdminAppointmentsParams {
  page?: number;
  limit?: number;
  status?: AppointmentStatus;
  doctorId?: string;
  bookingChannel?: BookingChannel;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: "appointmentDate" | "createdAt" | "patientName" | "status";
  sortOrder?: "asc" | "desc";
}

export interface AdminAppointmentListItem {
  id: string;
  bookingReference: string;
  patientName: string;
  maskedMobile: string;
  doctorName: string;
  departmentName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  bookingChannel: BookingChannel;
  checkedIn: boolean;
  checkedInAt?: string | null;
  version: number;
  createdAt: string;
}

export async function getAdminAppointments(params: GetAdminAppointmentsParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(10, params.limit || 25));
  const skip = (page - 1) * limit;

  const where: Prisma.AppointmentWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.doctorId) {
    where.doctorId = params.doctorId;
  }

  if (params.bookingChannel) {
    where.bookingChannel = params.bookingChannel;
  }

  if (params.dateFrom || params.dateTo) {
    where.appointmentDate = {};
    if (params.dateFrom) where.appointmentDate.gte = new Date(params.dateFrom);
    if (params.dateTo) where.appointmentDate.lte = new Date(params.dateTo);
  }

  if (params.search && params.search.trim()) {
    const term = params.search.trim();
    where.OR = [
      { bookingReference: { contains: term, mode: "insensitive" } },
      { patientName: { contains: term, mode: "insensitive" } },
      { mobileNumber: { contains: term } },
    ];
  }

  const allowedSortFields = ["appointmentDate", "createdAt", "patientName", "status"] as const;
  const sortBy = allowedSortFields.includes(params.sortBy as (typeof allowedSortFields)[number])
    ? params.sortBy!
    : "appointmentDate";
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";

  const [total, items] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { [sortBy]: sortOrder },
        { startTime: "asc" }
      ],
      include: {
        doctor: { select: { name: true } },
        department: { select: { name: true } },
      }
    })
  ]);

  const sanitized: AdminAppointmentListItem[] = items.map(app => ({
    id: app.id,
    bookingReference: app.bookingReference,
    patientName: app.patientName,
    maskedMobile: maskMobileNumber(app.mobileNumber),
    doctorName: app.doctor.name,
    departmentName: app.department.name,
    appointmentDate: app.appointmentDate.toISOString().split("T")[0],
    startTime: app.startTime,
    endTime: app.endTime,
    status: app.status,
    bookingChannel: app.bookingChannel,
    checkedIn: !!app.checkedInAt,
    checkedInAt: app.checkedInAt?.toISOString() || null,
    version: app.version,
    createdAt: app.createdAt.toISOString(),
  }));

  return {
    items: sanitized,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// 3. Authoritative Appointment Detail
export async function getAdminAppointmentDetail(id: string) {
  const app = await prisma.appointment.findUnique({
    where: { id },
    include: {
      doctor: true,
      department: true,
      speciality: true,
      checkedInByAdmin: { select: { id: true, name: true, email: true } },
      createdByAdmin: { select: { id: true, name: true, email: true } },
      confirmedByAdmin: { select: { id: true, name: true, email: true } },
      history: {
        orderBy: { createdAt: "desc" }
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          authorAdmin: { select: { id: true, name: true } }
        }
      },
      slotReservation: true,
    }
  });

  if (!app) return null;

  return {
    ...app,
    appointmentDate: app.appointmentDate.toISOString().split("T")[0],
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    checkedInAt: app.checkedInAt?.toISOString() || null,
  };
}

// 4. Manual Booking Service (Receptionist / Phone / Walk-in)
export interface CreateManualBookingInput {
  patientName: string;
  mobileNumber: string;
  alternativeNumber?: string;
  email?: string;
  age?: string;
  gender?: string;
  doctorId: string;
  departmentId: string;
  specialityId?: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string;
  bookingChannel: BookingChannel;
  reasonForVisit?: string;
  internalNote?: string;
  adminId: string;
}

export async function createManualBooking(input: CreateManualBookingInput) {
  const dateObj = new Date(input.appointmentDate);
  const dayOfWeek = dateObj.getUTCDay();

  // Validate doctor availability
  const availability = await prisma.doctorAvailability.findFirst({
    where: {
      doctorId: input.doctorId,
      dayOfWeek,
    },
    include: { breaks: true }
  });

  if (!availability) {
    return { success: false, error: "Doctor is not scheduled on this day of the week." };
  }

  // Calculate endTime if not provided
  let endTime = input.endTime;
  if (!endTime) {
    const [sh, sm] = input.startTime.split(":").map(Number);
    const totalMins = sh * 60 + sm + availability.slotDuration;
    const eh = Math.floor(totalMins / 60).toString().padStart(2, "0");
    const em = (totalMins % 60).toString().padStart(2, "0");
    endTime = `${eh}:${em}`;
  }

  const slotCapacity = availability.capacity || availability.maxBookings || 1;

  // Execute atomic booking transaction
  const result = await prisma.$transaction(async (tx) => {
    // Check existing active reservations for capacity position
    const existingReservations = await tx.slotReservation.findMany({
      where: {
        doctorId: input.doctorId,
        appointmentDate: dateObj,
        startTime: input.startTime,
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

    // Generate unique SNC reference
    let bookingReference = generateBookingReference();
    let collision = await tx.appointment.findUnique({ where: { bookingReference } });
    let retries = 0;
    while (collision && retries < 5) {
      bookingReference = generateBookingReference();
      collision = await tx.appointment.findUnique({ where: { bookingReference } });
      retries++;
    }

    if (collision) {
      throw new Error("REFERENCE_GENERATION_FAILED");
    }

    const appointment = await tx.appointment.create({
      data: {
        bookingReference,
        patientName: input.patientName.trim(),
        mobileNumber: input.mobileNumber.trim(),
        alternativeNumber: input.alternativeNumber?.trim() || null,
        email: input.email?.trim() || null,
        age: input.age?.trim() || null,
        gender: input.gender || null,
        doctorId: input.doctorId,
        departmentId: input.departmentId,
        specialityId: input.specialityId || null,
        appointmentDate: dateObj,
        startTime: input.startTime,
        endTime,
        bookingChannel: input.bookingChannel,
        status: "CONFIRMED", // Manual staff bookings start as confirmed
        reasonForVisit: input.reasonForVisit?.trim() || null,
        activeSlotKey: null,
        createdByAdminId: input.adminId,
        confirmedByAdminId: input.adminId,
      }
    });

    // Create slot reservation
    await tx.slotReservation.create({
      data: {
        doctorId: input.doctorId,
        appointmentDate: dateObj,
        startTime: input.startTime,
        position: assignedPosition,
        appointmentId: appointment.id,
      }
    });

    // Initial status history
    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId: appointment.id,
        status: "CONFIRMED",
        notes: `Manual booking created via ${input.bookingChannel} by staff`,
        changedById: input.adminId,
      }
    });

    // Add internal note if provided
    if (input.internalNote && input.internalNote.trim()) {
      await tx.appointmentNote.create({
        data: {
          appointmentId: appointment.id,
          authorAdminId: input.adminId,
          content: input.internalNote.trim(),
        }
      });
    }

    // Security audit log
    await tx.auditLog.create({
      data: {
        adminUserId: input.adminId,
        action: "CREATE_MANUAL_BOOKING",
        resourceType: "APPOINTMENT",
        resourceId: appointment.id,
        metadata: JSON.stringify({
          bookingReference,
          channel: input.bookingChannel,
          doctorId: input.doctorId,
          date: input.appointmentDate,
          time: input.startTime,
        })
      }
    });

    return appointment;
  });

  return { success: true, appointment: result };
}

// 5. Check-in Operation (Idempotent & Audited)
export async function checkInAppointment(appointmentId: string, adminId: string) {
  const app = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, status: true, checkedInAt: true, bookingReference: true }
  });

  if (!app) {
    return { success: false, error: "Appointment not found." };
  }

  if (app.status !== "CONFIRMED" && app.status !== "RESCHEDULED") {
    return {
      success: false,
      error: `Only confirmed or rescheduled appointments can be checked in. Current status: ${app.status}`
    };
  }

  // Idempotent: already checked in
  if (app.checkedInAt) {
    return {
      success: true,
      message: "Patient is already checked in.",
      checkedInAt: app.checkedInAt.toISOString()
    };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        checkedInAt: now,
        checkedInByAdminId: adminId,
        version: { increment: 1 }
      }
    });

    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId,
        status: app.status,
        notes: "Patient checked in at hospital reception.",
        changedById: adminId,
      }
    });

    await tx.auditLog.create({
      data: {
        adminUserId: adminId,
        action: "PATIENT_CHECKED_IN",
        resourceType: "APPOINTMENT",
        resourceId: appointmentId,
        metadata: JSON.stringify({
          bookingReference: app.bookingReference,
          checkedInAt: now.toISOString(),
        })
      }
    });
  });

  return { success: true, checkedInAt: now.toISOString() };
}

// 6. Append-Only Internal Note Creation
export async function addAppointmentNote(appointmentId: string, adminId: string, content: string) {
  const cleanContent = content.trim();
  if (!cleanContent) {
    return { success: false, error: "Note content cannot be empty." };
  }

  const app = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, bookingReference: true }
  });

  if (!app) {
    return { success: false, error: "Appointment not found." };
  }

  const note = await prisma.$transaction(async (tx) => {
    const createdNote = await tx.appointmentNote.create({
      data: {
        appointmentId,
        authorAdminId: adminId,
        content: cleanContent,
      },
      include: {
        authorAdmin: { select: { id: true, name: true } }
      }
    });

    // Audited without copying confidential note text into security log
    await tx.auditLog.create({
      data: {
        adminUserId: adminId,
        action: "ADD_APPOINTMENT_NOTE",
        resourceType: "APPOINTMENT",
        resourceId: appointmentId,
        metadata: JSON.stringify({
          bookingReference: app.bookingReference,
          noteId: createdNote.id,
        })
      }
    });

    return createdNote;
  });

  return { success: true, note };
}

// 7. Secure CSV Export with Formula Injection Neutralization
export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value).trim();

  // Neutralize CSV/Formula injection triggers: =, +, -, @, \t, \r, \n
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Quote if contains commas, quotes or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportAppointmentsCsv(
  params: GetAdminAppointmentsParams,
  adminId: string
): Promise<{ csvContent: string; rowCount: number }> {
  const where: Prisma.AppointmentWhereInput = {};

  if (params.status) where.status = params.status;
  if (params.doctorId) where.doctorId = params.doctorId;
  if (params.bookingChannel) where.bookingChannel = params.bookingChannel;
  if (params.dateFrom || params.dateTo) {
    where.appointmentDate = {};
    if (params.dateFrom) where.appointmentDate.gte = new Date(params.dateFrom);
    if (params.dateTo) where.appointmentDate.lte = new Date(params.dateTo);
  }

  const MAX_EXPORT_ROWS = 500;

  const appointments = await prisma.appointment.findMany({
    where,
    take: MAX_EXPORT_ROWS,
    orderBy: { appointmentDate: "desc" },
    include: {
      doctor: { select: { name: true } },
      department: { select: { name: true } },
    }
  });

  const headers = [
    "Booking Reference",
    "Patient Name",
    "Mobile Number",
    "Doctor",
    "Department",
    "Appointment Date",
    "Start Time",
    "Status",
    "Booking Channel",
    "Checked In",
    "Created At"
  ];

  const rows = appointments.map(app => [
    sanitizeCsvField(app.bookingReference),
    sanitizeCsvField(app.patientName),
    sanitizeCsvField(app.mobileNumber),
    sanitizeCsvField(app.doctor.name),
    sanitizeCsvField(app.department.name),
    sanitizeCsvField(app.appointmentDate.toISOString().split("T")[0]),
    sanitizeCsvField(app.startTime),
    sanitizeCsvField(app.status),
    sanitizeCsvField(app.bookingChannel),
    sanitizeCsvField(app.checkedInAt ? "YES" : "NO"),
    sanitizeCsvField(app.createdAt.toISOString())
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\n");

  // Log export in security audit log
  await prisma.auditLog.create({
    data: {
      adminUserId: adminId,
      action: "EXPORT_APPOINTMENTS_CSV",
      resourceType: "APPOINTMENT",
      metadata: JSON.stringify({
        rowsExported: rows.length,
        filters: {
          status: params.status || "ALL",
          doctorId: params.doctorId || "ALL",
          dateFrom: params.dateFrom || null,
          dateTo: params.dateTo || null,
        }
      })
    }
  });

  return { csvContent, rowCount: rows.length };
}
