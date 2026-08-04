import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { getAdminAppointmentDetail } from "@/lib/appointments/admin-service";
import { AppointmentDetailClient } from "./appointment-detail-client";

interface AppointmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.VIEW_APPOINTMENTS);
  const { id } = await params;

  const appointment = await getAdminAppointmentDetail(id);

  if (!appointment) {
    notFound();
  }

  const canManage = admin.permissions.includes(ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS);
  const canAddNotes = admin.permissions.includes(ADMIN_PERMISSIONS.ADD_INTERNAL_NOTES);

  return (
    <AppointmentDetailClient
      appointment={appointment}
      canManage={canManage}
      canAddNotes={canAddNotes}
    />
  );
}
