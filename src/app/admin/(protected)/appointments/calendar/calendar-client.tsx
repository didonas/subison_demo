"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppointmentStatus } from "@/generated/prisma/client";

interface CalendarAppointment {
  id: string;
  bookingReference: string;
  patientName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  doctorId: string;
  doctorName: string;
}

interface CalendarClientProps {
  initialAppointments: CalendarAppointment[];
  doctors: { id: string; name: string }[];
}

export function CalendarClient({ initialAppointments, doctors }: CalendarClientProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("ALL");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Format month and year
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Generate days for the month
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const filteredAppointments = initialAppointments.filter((app) => {
    if (selectedDoctorId !== "ALL" && app.doctorId !== selectedDoctorId) return false;
    const [y, m] = app.appointmentDate.split("-").map(Number);
    return y === currentYear && m === currentMonth + 1;
  });

  const getStatusBadge = (st: AppointmentStatus) => {
    switch (st) {
      case "PENDING":
        return "bg-amber-500/10 text-amber-300 border-amber-500/20";
      case "CONFIRMED":
        return "bg-sky-500/10 text-sky-300 border-sky-500/20";
      case "RESCHEDULED":
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      case "NO_SHOW":
        return "bg-purple-500/10 text-purple-300 border-purple-500/20";
      case "CANCELLED":
      case "REJECTED":
        return "bg-rose-500/10 text-rose-300 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }
  };

  const dayCells = [];
  // Empty padding cells before first day of month
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push({ dayNumber: null, key: `empty-${i}` });
  }
  // Days of month
  for (let d = 1; d <= totalDays; d++) {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayApps = filteredAppointments.filter((a) => a.appointmentDate === dStr);
    dayCells.push({ dayNumber: d, dateStr: dStr, apps: dayApps, key: `day-${d}` });
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header & Doctor Filter */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="text-xs text-slate-400">
              {filteredAppointments.length} total scheduled consultations
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="ALL">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-700/70 rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-950/80 border-b border-slate-800 text-center text-xs font-semibold text-slate-400 py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60 auto-rows-fr">
          {dayCells.map((cell) => {
            if (!cell.dayNumber) {
              return (
                <div
                  key={cell.key}
                  className="min-h-[120px] bg-slate-950/20 p-2 text-slate-600 text-xs"
                />
              );
            }

            const todayStr = new Date().toISOString().split("T")[0];
            const isToday = cell.dateStr === todayStr;

            return (
              <div
                key={cell.key}
                className={`min-h-[120px] p-2 transition flex flex-col justify-between ${
                  isToday ? "bg-indigo-950/20" : "bg-slate-900/40 hover:bg-slate-800/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                      isToday
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.apps && cell.apps.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {cell.apps.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[100px] pr-0.5">
                  {cell.apps &&
                    cell.apps.map((app) => (
                      <Link
                        key={app.id}
                        href={`/admin/appointments/${app.id}`}
                        className={`block p-1.5 rounded-lg border text-[11px] font-medium transition hover:scale-[1.02] ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span>{app.startTime}</span>
                          <span className="truncate max-w-[70px] text-slate-300">
                            {app.doctorName.split(" ")[1] || app.doctorName}
                          </span>
                        </div>
                        <div className="truncate font-semibold text-white mt-0.5">
                          {app.patientName}
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
