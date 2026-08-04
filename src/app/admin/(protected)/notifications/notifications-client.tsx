"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellRing,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Smartphone,
} from "lucide-react";
import { retryNotificationAction } from "@/lib/admin/actions";

interface NotificationItem {
  id: string;
  type: string;
  recipient: string;
  channel: string;
  status: string;
  retryCount: number;
  failureReason: string | null;
  lastAttemptAt: string | null;
  createdAt: string;
  sentAt: string | null;
}

interface NotificationsClientProps {
  initialData: {
    items: NotificationItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  selectedStatus?: string;
}

export function NotificationsClient({ initialData, selectedStatus }: NotificationsClientProps) {
  const router = useRouter();

  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFilter = (st?: string) => {
    if (st) {
      router.push(`/admin/notifications?status=${st}`);
    } else {
      router.push("/admin/notifications");
    }
  };

  const handleRetry = async (notificationId: string) => {
    try {
      setRetryingId(notificationId);
      setError(null);
      setSuccessMsg(null);

      const res = await retryNotificationAction(notificationId);
      if (!res.success) {
        setError(res.error || "Retry failed.");
      } else {
        setSuccessMsg(res.message || "Notification resent successfully.");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during retry.");
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "SENT":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "FAILED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => handleFilter()}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            !selectedStatus
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          All Outbox
        </button>
        <button
          onClick={() => handleFilter("FAILED")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedStatus === "FAILED"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Failed Delivery
        </button>
        <button
          onClick={() => handleFilter("PENDING")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedStatus === "PENDING"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => handleFilter("SENT")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedStatus === "SENT"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Successfully Delivered
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Notifications Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-4">Event Type</th>
                <th className="py-4 px-4">Channel</th>
                <th className="py-4 px-4">Recipient</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Retries</th>
                <th className="py-4 px-4">Last Attempt</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {initialData.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    <BellRing className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No notification logs found.
                  </td>
                </tr>
              ) : (
                initialData.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-indigo-300">
                      {item.type}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        {item.channel === "EMAIL" ? (
                          <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {item.channel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      {item.recipient}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {item.retryCount} / 5
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {item.lastAttemptAt
                        ? new Date(item.lastAttemptAt).toLocaleString("en-IN")
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === "FAILED" && item.retryCount < 5 && (
                        <button
                          onClick={() => handleRetry(item.id)}
                          disabled={retryingId === item.id}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold flex items-center gap-1.5 ml-auto transition disabled:opacity-50"
                        >
                          {retryingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
