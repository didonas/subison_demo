import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { prisma } from "@/lib/prisma";
import { SchedulesClient } from "./schedules-client";

export default async function AdminSchedulesPage() {
  await requirePermission(ADMIN_PERMISSIONS.MANAGE_SCHEDULES);

  const doctors = await prisma.doctor.findMany({
    include: {
      department: true,
      availabilities: {
        include: { breaks: true },
        orderBy: { dayOfWeek: "asc" },
      },
      leaves: {
        orderBy: { startDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const sanitized = doctors.map((doc) => ({
    id: doc.id,
    name: doc.name,
    departmentName: doc.department.name,
    availabilities: doc.availabilities.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      slotDuration: a.slotDuration,
      capacity: a.capacity || a.maxBookings || 1,
      breaks: a.breaks.map((b) => ({
        name: b.name,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    })),
    leaves: doc.leaves.map((l) => ({
      id: l.id,
      startDate: l.startDate.toISOString().split("T")[0],
      endDate: l.endDate.toISOString().split("T")[0],
      reason: l.reason || "",
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Doctor Schedules &amp; Hours</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure weekly clinic consultation slots, break intervals, and individual doctor leaves.
        </p>
      </div>

      <SchedulesClient doctors={sanitized} />
    </div>
  );
}
