"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Send,
  Loader2,
  AlertCircle,
  Stethoscope,
} from "lucide-react";
import {
  transitionAppointmentStatusAction,
  checkInAppointmentAction,
  addAppointmentNoteAction,
} from "@/lib/admin/actions";
import { AppointmentStatus } from "@/generated/prisma/client";

interface AppointmentDetailClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appointment: any;
  canManage: boolean;
  canAddNotes: boolean;
}

export function AppointmentDetailClient({
  appointment,
  canManage,
  canAddNotes,
}: AppointmentDetailClientProps) {
  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Transition Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<AppointmentStatus | null>(null);
  const [transitionNotes, setTransitionNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  // Add Note State
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const openTransitionModal = (st: AppointmentStatus) => {
    setTargetStatus(st);
    setTransitionNotes("");
    setRescheduleDate("");
    setRescheduleTime("");
    setError(null);
    setModalOpen(true);
  };

  const handleExecuteTransition = async () => {
    if (!targetStatus) return;

    // Validate reason notes for cancellations / rejections
    if ((targetStatus === "CANCELLED" || targetStatus === "REJECTED") && !transitionNotes.trim()) {
      setError("Please provide a reason note for cancellation or rejection.");
      return;
    }

    if (targetStatus === "RESCHEDULED" && (!rescheduleDate || !rescheduleTime)) {
      setError("Please provide both a new date and time for rescheduling.");
      return;
    }

    try {
      setLoadingAction("transition");
      setError(null);

      const res = await transitionAppointmentStatusAction({
        appointmentId: appointment.id,
        targetStatus,
        expectedVersion: appointment.version,
        notes: transitionNotes.trim() || undefined,
        newDate: rescheduleDate || undefined,
        newTime: rescheduleTime || undefined,
        notifyPatient: true,
      });

      if (!res.success) {
        setError(res.error || "Status update failed.");
      } else {
        setSuccessMsg(`Status successfully updated to ${targetStatus}.`);
        setModalOpen(false);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during status transition.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCheckIn = async () => {
    try {
      setLoadingAction("checkin");
      setError(null);
      const res = await checkInAppointmentAction(appointment.id);
      if (!res.success) {
        setError(res.error || "Check-in failed.");
      } else {
        setSuccessMsg("Patient checked in successfully.");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during patient check-in.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setSubmittingNote(true);
      setError(null);
      const res = await addAppointmentNoteAction(appointment.id, newNote);
      if (!res.success) {
        setError(res.error || "Failed to add internal note.");
      } else {
        setNewNote("");
        setSuccessMsg("Internal note appended.");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred while saving note.");
    } finally {
      setSubmittingNote(false);
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

  const isTerminal =
    appointment.status === "COMPLETED" ||
    appointment.status === "CANCELLED" ||
    appointment.status === "REJECTED" ||
    appointment.status === "NO_SHOW";

  return (
    <div className="space-y-6">
      {/* Back Link & Top Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/appointments"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Back to appointments list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white font-mono">
                {appointment.bookingReference}
              </h1>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                  appointment.status
                )}`}
              >
                {appointment.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Created on {new Date(appointment.createdAt).toLocaleString("en-IN")} via{" "}
              <strong className="text-slate-300">{appointment.bookingChannel}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {canManage && !isTerminal && (
          <div className="flex flex-wrap items-center gap-2">
            {!appointment.checkedInAt &&
              (appointment.status === "CONFIRMED" || appointment.status === "RESCHEDULED") && (
                <button
                  onClick={handleCheckIn}
                  disabled={loadingAction === "checkin"}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {loadingAction === "checkin" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  Check In Patient
                </button>
              )}

            {appointment.status === "PENDING" && (
              <button
                onClick={() => openTransitionModal("CONFIRMED")}
                className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Booking
              </button>
            )}

            {(appointment.status === "CONFIRMED" || appointment.status === "RESCHEDULED") && (
              <button
                onClick={() => openTransitionModal("COMPLETED")}
                className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Completed
              </button>
            )}

            {(appointment.status === "CONFIRMED" || appointment.status === "RESCHEDULED") && (
              <button
                onClick={() => openTransitionModal("NO_SHOW")}
                className="px-3 py-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Mark No-Show
              </button>
            )}

            <button
              onClick={() => openTransitionModal("RESCHEDULED")}
              className="px-3 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reschedule
            </button>

            {appointment.status === "PENDING" ? (
              <button
                onClick={() => openTransitionModal("REJECTED")}
                className="px-3 py-2 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            ) : (
              <button
                onClick={() => openTransitionModal("CANCELLED")}
                className="px-3 py-2 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </div>
        )}
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

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient & Slot Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Profile Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Patient Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Full Name</span>
                <span className="font-semibold text-white">{appointment.patientName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Mobile Number</span>
                <span className="font-mono text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {appointment.mobileNumber}
                </span>
              </div>
              {appointment.alternativeNumber && (
                <div>
                  <span className="text-xs text-slate-400 block">Alternative Mobile</span>
                  <span className="font-mono text-slate-200">{appointment.alternativeNumber}</span>
                </div>
              )}
              {appointment.email && (
                <div>
                  <span className="text-xs text-slate-400 block">Email Address</span>
                  <span className="text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {appointment.email}
                  </span>
                </div>
              )}
              <div>
                <span className="text-xs text-slate-400 block">Age / Gender</span>
                <span className="text-slate-200">
                  {appointment.age ? `${appointment.age} yrs` : "N/A"} /{" "}
                  {appointment.gender || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Check-in Status</span>
                <span className="text-slate-200">
                  {appointment.checkedInAt ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <UserCheck className="w-4 h-4" />
                      Checked in at {new Date(appointment.checkedInAt).toLocaleTimeString("en-IN")}
                    </span>
                  ) : (
                    "Not checked in"
                  )}
                </span>
              </div>
            </div>

            {appointment.reasonForVisit && (
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">Reason for Visit / Symptoms</span>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-xs leading-relaxed">
                  {appointment.reasonForVisit}
                </div>
              </div>
            )}
          </div>

          {/* Clinical & Doctor Appointment Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-indigo-400" />
              Clinical Consultation Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Doctor</span>
                <span className="font-semibold text-white">{appointment.doctor.name}</span>
                <span className="text-xs text-indigo-400 block">
                  {appointment.doctor.designation}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Department</span>
                <span className="text-slate-200 font-medium">{appointment.department.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Scheduled Date</span>
                <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {appointment.appointmentDate}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Time Slot</span>
                <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {appointment.startTime} - {appointment.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* Status Timeline History */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Status Transition Timeline
            </h2>

            <div className="space-y-4 relative pl-4 border-l-2 border-slate-800">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {appointment.history.map((h: any) => (
                <div key={h.id} className="relative group">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 tracking-wide">
                      {h.status}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(h.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {h.notes && (
                    <div className="text-xs text-slate-400 mt-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                      {h.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Internal Staff Notes */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Internal Staff Notes
            </h2>
            <p className="text-xs text-slate-400">
              Append-only communication notes between clinical and administrative staff.
            </p>

            {canAddNotes && (
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter internal note (visible to staff only)..."
                  className="w-full p-3 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {submittingNote ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Add Note
                </button>
              </form>
            )}

            <div className="space-y-3 pt-3 border-t border-slate-800">
              {appointment.notes.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">
                  No internal notes recorded yet.
                </div>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                appointment.notes.map((n: any) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300">
                        {n.authorAdmin?.name || "Staff"}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {new Date(n.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="text-slate-300 leading-relaxed">{n.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Transition Modal */}
      {modalOpen && targetStatus && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Confirm Status Transition: <span className="text-indigo-400">{targetStatus}</span>
            </h3>

            {targetStatus === "RESCHEDULED" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {targetStatus === "CANCELLED" || targetStatus === "REJECTED"
                  ? "Reason Note (Required)"
                  : "Transition Note (Optional)"}
              </label>
              <textarea
                rows={3}
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                placeholder="Reason or operational context..."
                className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteTransition}
                disabled={loadingAction === "transition"}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {loadingAction === "transition" && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
