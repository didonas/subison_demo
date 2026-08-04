import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { prisma } from "@/lib/prisma";
import { ManualBookingClient } from "./manual-booking-client";

export default async function AdminNewAppointmentPage() {
  await requirePermission(ADMIN_PERMISSIONS.CREATE_MANUAL_BOOKINGS);

  const [doctors, departments] = await Promise.all([
    prisma.doctor.findMany({
      include: {
        department: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const sanitizedDoctors = doctors.map((d) => ({
    id: d.id,
    name: d.name,
    departmentId: d.departmentId,
    department: { name: d.department.name },
    specialisation: d.specialisation,
  }));

  const sanitizedDepartments = departments.map((dep) => ({
    id: dep.id,
    name: dep.name,
  }));

  return (
    <ManualBookingClient
      doctors={sanitizedDoctors}
      departments={sanitizedDepartments}
    />
  );
}
