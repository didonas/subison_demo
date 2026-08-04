"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  UserPlus,
  CalendarRange,
  Palmtree,
  MessageSquareQuote,
  BellRing,
  ShieldCheck,
  Users,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Stethoscope,
  Sparkles,
  Building2,
  UserCheck,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Video,
  Settings,
} from "lucide-react";
import { ClientPermissionFlags, SerializedAdminUser } from "@/lib/admin/permissions.shared";

interface AdminShellClientProps {
  admin: SerializedAdminUser;
  permissions: ClientPermissionFlags;
  children: React.ReactNode;
}

export function AdminShellClient({ admin, permissions, children }: AdminShellClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      show: true,
      exact: true,
    },
    // Appointment & Operations
    {
      label: "Appointments",
      href: "/admin/appointments",
      icon: CalendarDays,
      show: permissions.canViewAppointments,
      exact: true,
    },
    {
      label: "Calendar View",
      href: "/admin/appointments/calendar",
      icon: Clock,
      show: permissions.canViewAppointments,
    },
    {
      label: "Manual Booking",
      href: "/admin/appointments/new",
      icon: UserPlus,
      show: permissions.canCreateManualBookings,
    },
    {
      label: "Doctor Schedules",
      href: "/admin/schedules",
      icon: CalendarRange,
      show: permissions.canManageSchedules,
      exact: true,
    },
    {
      label: "Hospital Holidays",
      href: "/admin/schedules/holidays",
      icon: Palmtree,
      show: permissions.canManageSchedules,
    },
    {
      label: "Patient Enquiries",
      href: "/admin/enquiries",
      icon: MessageSquareQuote,
      show: permissions.canManageEnquiries,
    },
    {
      label: "Notification Center",
      href: "/admin/notifications",
      icon: BellRing,
      show: permissions.canRetryNotifications,
    },
    // Phase 5 CMS Navigation
    {
      label: "CMS Overview",
      href: "/admin/cms",
      icon: LayoutDashboard,
      show: permissions.canViewCms,
      exact: true,
    },
    {
      label: "Specialities",
      href: "/admin/cms/specialities",
      icon: Stethoscope,
      show: permissions.canViewCms,
    },
    {
      label: "Treatments",
      href: "/admin/cms/treatments",
      icon: Sparkles,
      show: permissions.canViewCms,
    },
    {
      label: "Facilities",
      href: "/admin/cms/facilities",
      icon: Building2,
      show: permissions.canViewCms,
    },
    {
      label: "Doctor Profiles",
      href: "/admin/cms/doctors",
      icon: UserCheck,
      show: permissions.canManageDoctorContent,
    },
    {
      label: "Testimonials",
      href: "/admin/cms/testimonials",
      icon: MessageSquareQuote,
      show: permissions.canManageTestimonials,
    },
    {
      label: "Articles & Advice",
      href: "/admin/cms/articles",
      icon: FileText,
      show: permissions.canViewCms,
    },
    {
      label: "FAQs",
      href: "/admin/cms/faqs",
      icon: HelpCircle,
      show: permissions.canViewCms,
    },
    {
      label: "Media & Gallery",
      href: "/admin/cms/gallery",
      icon: ImageIcon,
      show: permissions.canManageMedia,
    },
    {
      label: "Videos",
      href: "/admin/cms/videos",
      icon: Video,
      show: permissions.canViewCms,
    },
    {
      label: "Site Settings",
      href: "/admin/cms/site-settings",
      icon: Settings,
      show: permissions.canManageSiteSettings,
    },
    // Admin Management
    {
      label: "Audit Logs",
      href: "/admin/audit-logs",
      icon: ShieldCheck,
      show: permissions.canViewAuditLogs,
    },
    {
      label: "Staff Users",
      href: "/admin/users",
      icon: Users,
      show: permissions.canManageUsers,
    },
  ].filter((item) => item.show);

  const isActiveRoute = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "HOSPITAL_ADMIN":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "CONTENT_EDITOR":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "RECEPTIONIST":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Hospital Branding Header */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-slate-800/80">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight">Subison Neuro</div>
              <div className="text-[11px] text-slate-400">Operations & CMS</div>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5" aria-label="Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-4 h-4 text-indigo-200" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">{admin.name}</div>
              <div className="text-xs text-slate-400 truncate">{admin.email}</div>
            </div>
            <span
              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getRoleBadgeColor(
                admin.role
              )}`}
            >
              {admin.role.replace("_", " ")}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-xs font-medium border border-slate-700/50 hover:border-rose-500/30 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Bar Header */}
        <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-slate-200 capitalize font-medium">
                {pathname === "/admin"
                  ? "Dashboard"
                  : pathname.split("/").filter(Boolean).slice(1).join(" / ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{admin.name}</div>
              <div className="text-[11px] text-indigo-400 font-mono">
                {admin.role.replace("_", " ")}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
              {admin.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
