import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { getAdminNotifications } from "@/lib/notifications/admin-service";
import { NotificationsClient } from "./notifications-client";

interface NotificationsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

export default async function AdminNotificationsPage({ searchParams }: NotificationsPageProps) {
  await requirePermission(ADMIN_PERMISSIONS.RETRY_NOTIFICATIONS);
  const resolved = await searchParams;

  const status = resolved.status || undefined;
  const page = parseInt(resolved.page || "1", 10);

  const notificationsData = await getAdminNotifications({ status, page, limit: 30 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Notification Center &amp; Outbox</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor email and SMS delivery dispatches, inspect failure logs, and manually retry failed notices.
        </p>
      </div>

      <NotificationsClient initialData={notificationsData} selectedStatus={status} />
    </div>
  );
}
