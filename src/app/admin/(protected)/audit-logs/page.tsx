import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { getAuditLogs } from "@/lib/audit/service";
import { AuditLogsClient } from "./audit-logs-client";

interface AuditLogsPageProps {
  searchParams: Promise<{
    action?: string;
    page?: string;
  }>;
}

export default async function AdminAuditLogsPage({ searchParams }: AuditLogsPageProps) {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS);
  const resolved = await searchParams;

  const page = parseInt(resolved.page || "1", 10);
  const logsData = await getAuditLogs({ action: resolved.action, page, limit: 30 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Logs</h1>
        <p className="text-sm text-slate-400 mt-1">
          Immutable, append-only operational history of all administrative actions, status transitions, and patient record modifications.
        </p>
      </div>

      <AuditLogsClient initialData={logsData} />
    </div>
  );
}
