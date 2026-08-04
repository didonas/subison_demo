import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { prisma } from "@/lib/prisma";
import { CalendarClient } from "./calendar-client";

export default async function AdminCalendarPage() {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_APPOINTMENTS);

  const [appointments, doctors] = await Promise.all([
    prisma.appointment.findMany({
      orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
      include: {
        doctor: { select: { name: true } },
      },
    }),
    prisma.doctor.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const sanitizedAppointments = appointments.map((app) => ({
    id: app.id,
    bookingReference: app.bookingReference,
    patientName: app.patientName,
    appointmentDate: app.appointmentDate.toISOString().split("T")[0],
    startTime: app.startTime,
    endTime: app.endTime,
    status: app.status,
    doctorId: app.doctorId,
    doctorName: app.doctor.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Consultation Calendar</h1>
        <p className="text-sm text-slate-400 mt-1">
          Visual schedule of all doctor appointments and clinic slot allocations.
        </p>
      </div>

      <CalendarClient
        initialAppointments={sanitizedAppointments}
        doctors={doctors}
      />
    </div>
  );
}
