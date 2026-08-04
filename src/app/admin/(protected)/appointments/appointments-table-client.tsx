"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Download,
  Calendar,
  UserCheck,
  Eye,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  AdminAppointmentListItem,
  GetAdminAppointmentsParams,
} from "@/lib/appointments/admin-service";
import { checkInAppointmentAction, exportAppointmentsCsvAction } from "@/lib/admin/actions";
import { AppointmentStatus, BookingChannel } from "@/generated/prisma/client";

interface AppointmentsTableClientProps {
  initialData: {
    items: AdminAppointmentListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  doctors: { id: string; name: string }[];
  canExport: boolean;
  canManage: boolean;
}

export function AppointmentsTableClient({
  initialData,
  doctors,
  canExport,
  canManage,
}: AppointmentsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [doctorId, setDoctorId] = useState(searchParams.get("doctorId") || "");
  const [channel, setChannel] = useState(searchParams.get("channel") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");

  const [exporting, setExporting] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyFilters = (overrides?: Record<string, string>) => {
    const params = new URLSearchParams();
    const current = {
      search,
      status,
      doctorId,
      channel,
      dateFrom,
      dateTo,
      page: "1",
      limit: String(initialData.limit),
      ...overrides,
    };

    Object.entries(current).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });

    router.push(`/admin/appointments?${params.toString()}`);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      setError(null);
      const filterObj: GetAdminAppointmentsParams = {
        status: status ? (status as AppointmentStatus) : undefined,
        doctorId: doctorId || undefined,
        bookingChannel: channel ? (channel as BookingChannel) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const res = await exportAppointmentsCsvAction(filterObj);
      const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointments_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setError("Failed to generate CSV export. Please check permissions.");
    } finally {
      setExporting(false);
    }
  };

  const handleQuickCheckIn = async (appointmentId: string) => {
    try {
      setCheckingInId(appointmentId);
      setError(null);
      const res = await checkInAppointmentAction(appointmentId);
      if (!res.success) {
        setError(res.error || "Check-in failed");
      } else {
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during patient check-in.");
    } finally {
      setCheckingInId(null);
    }
  };

  const getStatusBadge = (st: AppointmentStatus) => {
    switch (st) {
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "CONFIRMED":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "RESCHEDULED":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "NO_SHOW":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "CANCELLED":
      case "REJECTED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, patient name, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => applyFilters()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
            >
              Filter
            </button>
            <button
              onClick={() => {
                setSearch("");
                setStatus("");
                setDoctorId("");
                setChannel("");
                setDateFrom("");
                setDateTo("");
                router.push("/admin/appointments");
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Reset
            </button>
            {canExport && (
              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              applyFilters({ status: e.target.value });
            }}
            className="bg-slate-950/60 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="NO_SHOW">No-Show</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              applyFilters({ doctorId: e.target.value });
            }}
            className="bg-slate-950/60 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value);
              applyFilters({ channel: e.target.value });
            }}
            className="bg-slate-950/60 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">All Channels</option>
            <option value="ONLINE">Online (Web)</option>
            <option value="PHONE">Phone</option>
            <option value="WALK_IN">Walk-in</option>
            <option value="ADMIN">Admin Desk</option>
          </select>

          <input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              applyFilters({ dateFrom: e.target.value });
            }}
            className="bg-slate-950/60 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />

          <input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              applyFilters({ dateTo: e.target.value });
            }}
            className="bg-slate-950/60 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
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

      {/* Appointments Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-4">Booking Ref</th>
                <th className="py-4 px-4">Patient Name</th>
                <th className="py-4 px-4">Mobile</th>
                <th className="py-4 px-4">Doctor</th>
                <th className="py-4 px-4">Date &amp; Time</th>
                <th className="py-4 px-4">Channel</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Check-in</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {initialData.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No appointments match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                initialData.items.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-300">
                      {app.bookingReference}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">{app.patientName}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      {app.maskedMobile}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">{app.doctorName}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {app.appointmentDate}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {app.startTime} - {app.endTime}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                        {app.bookingChannel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {app.checkedIn ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                          <UserCheck className="w-3.5 h-3.5" />
                          Checked In
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {canManage &&
                        !app.checkedIn &&
                        (app.status === "CONFIRMED" || app.status === "RESCHEDULED") && (
                          <button
                            onClick={() => handleQuickCheckIn(app.id)}
                            disabled={checkingInId === app.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold transition"
                          >
                            {checkingInId === app.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Check In"
                            )}
                          </button>
                        )}
                      <Link
                        href={`/admin/appointments/${app.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {initialData.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page {initialData.page} of {initialData.totalPages} ({initialData.total}{" "}
              total records)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={initialData.page <= 1}
                onClick={() => applyFilters({ page: String(initialData.page - 1) })}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={initialData.page >= initialData.totalPages}
                onClick={() => applyFilters({ page: String(initialData.page + 1) })}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
