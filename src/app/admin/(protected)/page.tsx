import Link from "next/link";
import { getDashboardMetrics } from "@/lib/appointments/admin-service";
import { requireAdmin } from "@/lib/admin/permissions.server";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  XCircle,
  MessageSquareQuote,
  BellRing,
  UserPlus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const metrics = await getDashboardMetrics();

  const formattedTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const kpis = [
    {
      title: "Today's Total Bookings",
      value: metrics.todayTotal,
      icon: CalendarDays,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Pending Approval",
      value: metrics.todayPending,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Confirmed Visits",
      value: metrics.todayConfirmed,
      icon: CheckCircle2,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Checked-in Patients",
      value: metrics.todayCheckedIn,
      icon: UserCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Completed Visits",
      value: metrics.todayCompleted,
      icon: TrendingUp,
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/20",
    },
    {
      title: "No-Shows",
      value: metrics.todayNoShow,
      icon: AlertCircle,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Cancellations / Rejected",
      value: metrics.todayCancelled,
      icon: XCircle,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Unread Enquiries",
      value: metrics.unreadEnquiries,
      icon: MessageSquareQuote,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      href: "/admin/enquiries",
    },
    {
      title: "Failed Notifications",
      value: metrics.failedNotifications,
      icon: BellRing,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      href: "/admin/notifications",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Welcome & Refresh Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, <span className="text-slate-200 font-semibold">{admin.name}</span>.
            Real-time hospital clinic status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-lg">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>As of {formattedTime} (IST)</span>
          </div>
          <Link
            href="/admin/appointments/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-md transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            New Booking
          </Link>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const CardContent = (
            <div
              className={`p-5 rounded-2xl border ${kpi.bg} backdrop-blur flex items-center justify-between transition hover:border-slate-700`}
            >
              <div>
                <div className="text-xs font-medium text-slate-400">{kpi.title}</div>
                <div className="text-2xl font-bold text-white mt-1">{kpi.value}</div>
              </div>
              <div className={`p-3 rounded-xl bg-slate-950/50 ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );

          if (kpi.href) {
            return (
              <Link key={idx} href={kpi.href} className="block group">
                {CardContent}
              </Link>
            );
          }
          return <div key={idx}>{CardContent}</div>;
        })}
      </div>

      {/* Doctor Utilization Breakdown */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          Today&apos;s Doctor Workload &amp; Utilization
        </h2>

        {metrics.doctorUtilization.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            No doctors configured in system.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.doctorUtilization.map((doc) => (
              <div
                key={doc.doctorId}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-200 text-sm">{doc.doctorName}</div>
                  <div className="text-xs text-indigo-400">{doc.departmentName}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Active Bookings: <strong className="text-white">{doc.bookedCount}</strong>
                  </span>
                  <span className="text-emerald-400">
                    Completed: <strong>{doc.completedCount}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
