"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, FileJson } from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  timestamp: string;
  adminName: string;
  adminEmail: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
}

interface AuditLogsClientProps {
  initialData: {
    items: AuditLogItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function AuditLogsClient({ initialData }: AuditLogsClientProps) {
  const router = useRouter();
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("CONFIRMED"))
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    if (action.includes("CANCEL") || action.includes("REJECT") || action.includes("DELETE"))
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (action.includes("UPDATE") || action.includes("RESCHEDULE"))
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-4">Action</th>
                <th className="py-4 px-4">Staff Operator</th>
                <th className="py-4 px-4">Resource</th>
                <th className="py-4 px-4">Timestamp (IST)</th>
                <th className="py-4 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {initialData.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No security audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                initialData.items.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-white">{log.adminName}</div>
                      {log.adminEmail && (
                        <div className="text-[11px] text-slate-500">{log.adminEmail}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      {log.resourceType} {log.resourceId ? `(${log.resourceId.slice(0, 8)}...)` : ""}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {log.metadata && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <FileJson className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {initialData.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page {initialData.page} of {initialData.totalPages} ({initialData.total} records)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={initialData.page <= 1}
                onClick={() => router.push(`/admin/audit-logs?page=${initialData.page - 1}`)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={initialData.page >= initialData.totalPages}
                onClick={() => router.push(`/admin/audit-logs?page=${initialData.page + 1}`)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Audit Log Metadata</h3>
              <span className="font-mono text-xs text-slate-400">{selectedLog.action}</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-60">
              {JSON.stringify(selectedLog.metadata, null, 2)}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
