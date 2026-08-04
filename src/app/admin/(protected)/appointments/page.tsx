import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { getAdminAppointments } from "@/lib/appointments/admin-service";
import { prisma } from "@/lib/prisma";
import { AppointmentsTableClient } from "./appointments-table-client";
import { AppointmentStatus, BookingChannel } from "@/generated/prisma/client";

interface AppointmentsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    doctorId?: string;
    channel?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }>;
}

export default async function AdminAppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.VIEW_APPOINTMENTS);
  const resolvedParams = await searchParams;

  const page = parseInt(resolvedParams.page || "1", 10);
  const limit = parseInt(resolvedParams.limit || "25", 10);

  const [appointmentsData, doctors] = await Promise.all([
    getAdminAppointments({
      page,
      limit,
      status: resolvedParams.status ? (resolvedParams.status as AppointmentStatus) : undefined,
      doctorId: resolvedParams.doctorId || undefined,
      bookingChannel: resolvedParams.channel
        ? (resolvedParams.channel as BookingChannel)
        : undefined,
      dateFrom: resolvedParams.dateFrom || undefined,
      dateTo: resolvedParams.dateTo || undefined,
      search: resolvedParams.search || undefined,
    }),
    prisma.doctor.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const canExport = admin.permissions.includes(ADMIN_PERMISSIONS.EXPORT_APPOINTMENTS);
  const canManage = admin.permissions.includes(ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Appointments Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, filter, and manage patient bookings across all channels.
          </p>
        </div>
      </div>

      <AppointmentsTableClient
        initialData={appointmentsData}
        doctors={doctors}
        canExport={canExport}
        canManage={canManage}
      />
    </div>
  );
}
