"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Palmtree,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  updateDoctorScheduleAction,
  addDoctorLeaveAction,
  deleteDoctorLeaveAction,
} from "@/lib/admin/actions";

interface BreakItem {
  name: string;
  startTime: string;
  endTime: string;
}

interface DoctorAvailabilityData {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  capacity: number;
  breaks: BreakItem[];
}

interface DoctorLeaveData {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface DoctorWithSchedule {
  id: string;
  name: string;
  departmentName: string;
  availabilities: DoctorAvailabilityData[];
  leaves: DoctorLeaveData[];
}

interface SchedulesClientProps {
  doctors: DoctorWithSchedule[];
}

export function SchedulesClient({ doctors }: SchedulesClientProps) {
  const router = useRouter();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || "");
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday

  const doctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  const currentAvailability = doctor?.availabilities.find((a) => a.dayOfWeek === selectedDay);

  // Form State
  const [startTime, setStartTime] = useState(currentAvailability?.startTime || "09:00");
  const [endTime, setEndTime] = useState(currentAvailability?.endTime || "17:00");
  const [slotDuration, setSlotDuration] = useState(currentAvailability?.slotDuration || 30);
  const [capacity, setCapacity] = useState(currentAvailability?.capacity || 1);
  const [breaks, setBreaks] = useState<BreakItem[]>(currentAvailability?.breaks || []);

  // Leave Form State
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const handleDaySelect = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    const av = doctor?.availabilities.find((a) => a.dayOfWeek === dayIndex);
    setStartTime(av?.startTime || "09:00");
    setEndTime(av?.endTime || "17:00");
    setSlotDuration(av?.slotDuration || 30);
    setCapacity(av?.capacity || 1);
    setBreaks(av?.breaks || []);
    setError(null);
    setSuccessMsg(null);
  };

  const handleAddBreak = () => {
    setBreaks([...breaks, { name: "Lunch Break", startTime: "13:00", endTime: "14:00" }]);
  };

  const handleRemoveBreak = (idx: number) => {
    setBreaks(breaks.filter((_, i) => i !== idx));
  };

  const handleBreakChange = (idx: number, field: keyof BreakItem, value: string) => {
    const updated = [...breaks];
    updated[idx] = { ...updated[idx], [field]: value };
    setBreaks(updated);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await updateDoctorScheduleAction({
        doctorId: doctor.id,
        dayOfWeek: selectedDay,
        startTime,
        endTime,
        slotDuration: Number(slotDuration),
        capacity: Number(capacity),
        breaks,
      });

      if (!res.success) {
        setError(res.error || "Failed to update schedule.");
      } else {
        setSuccessMsg(`Schedule updated for ${daysOfWeek[selectedDay]}.`);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred while saving schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor || !leaveStart || !leaveEnd) return;

    try {
      setSaving(true);
      setError(null);
      const res = await addDoctorLeaveAction(
        doctor.id,
        leaveStart,
        leaveEnd,
        leaveReason || "Leave"
      );

      if (!res.success) {
        setError(res.error || "Failed to record doctor leave.");
      } else {
        setLeaveStart("");
        setLeaveEnd("");
        setLeaveReason("");
        setSuccessMsg("Doctor leave recorded successfully.");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred while adding leave.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    try {
      setSaving(true);
      setError(null);
      const res = await deleteDoctorLeaveAction(leaveId);
      if (!res.success) {
        setError("Failed to delete leave.");
      } else {
        setSuccessMsg("Leave record removed.");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Doctor Picker Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Select Doctor
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[240px]"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.departmentName})
              </option>
            ))}
          </select>
        </div>

        {/* Day of Week Selector Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {daysOfWeek.map((dayName, idx) => {
            const hasSchedule = doctor?.availabilities.some((a) => a.dayOfWeek === idx);
            const isSelected = selectedDay === idx;
            return (
              <button
                key={dayName}
                onClick={() => handleDaySelect(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : hasSchedule
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-950/40 border border-slate-800/80 text-slate-500 hover:text-slate-300"
                }`}
              >
                {dayName.slice(0, 3)}
              </button>
            );
          })}
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

      {successMsg && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Working Hours & Breaks Form */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSaveSchedule}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  {daysOfWeek[selectedDay]} Schedule Configuration
                </h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  Consultation timings for {doctor?.name}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Start Time (HH:MM)
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  End Time (HH:MM)
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Slot Duration (Minutes)
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm"
                >
                  <option value="15">15 Minutes</option>
                  <option value="20">20 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Slot Capacity (Max Patients / Slot)
                </label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm"
                >
                  <option value="1">1 Patient (Standard)</option>
                  <option value="2">2 Patients</option>
                  <option value="3">3 Patients</option>
                  <option value="4">4 Patients</option>
                </select>
              </div>
            </div>

            {/* Breaks Manager */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Doctor Breaks &amp; Recesses
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Slots falling in break windows will not be offered to patients.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddBreak}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Break
                </button>
              </div>

              {breaks.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center bg-slate-950/30 rounded-xl border border-slate-800/50">
                  No breaks configured for this day.
                </div>
              ) : (
                <div className="space-y-2">
                  {breaks.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl"
                    >
                      <input
                        type="text"
                        placeholder="Break Name (e.g. Lunch)"
                        value={b.name}
                        onChange={(e) => handleBreakChange(idx, "name", e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <input
                        type="time"
                        value={b.startTime}
                        onChange={(e) => handleBreakChange(idx, "startTime", e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <span className="text-slate-500 text-xs">to</span>
                      <input
                        type="time"
                        value={b.endTime}
                        onChange={(e) => handleBreakChange(idx, "endTime", e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBreak(idx)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save {daysOfWeek[selectedDay]} Schedule
              </button>
            </div>
          </form>
        </div>

        {/* Doctor Leave Management Card */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Palmtree className="w-4 h-4 text-indigo-400" />
              Doctor Leaves
            </h2>
            <p className="text-xs text-slate-400">
              Block bookings for {doctor?.name} across date ranges.
            </p>

            <form onSubmit={handleAddLeave} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">From Date</label>
                <input
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">To Date</label>
                <input
                  type="date"
                  required
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Medical Conference"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Leave Record
              </button>
            </form>

            <div className="space-y-2 pt-3 border-t border-slate-800">
              {doctor?.leaves.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-3">
                  No upcoming leaves scheduled.
                </div>
              ) : (
                doctor?.leaves.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                        {l.startDate} to {l.endDate}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{l.reason}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteLeave(l.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                      aria-label="Delete leave"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
