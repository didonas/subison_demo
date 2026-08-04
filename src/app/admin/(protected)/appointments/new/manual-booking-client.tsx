"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Stethoscope,
  Building,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createManualBookingAction } from "@/lib/admin/actions";
import { BookingChannel } from "@/generated/prisma/client";

interface ManualBookingClientProps {
  doctors: {
    id: string;
    name: string;
    departmentId: string;
    department: { name: string };
    specialisation: string;
  }[];
  departments: { id: string; name: string }[];
}

export function ManualBookingClient({ doctors, departments }: ManualBookingClientProps) {
  const [patientName, setPatientName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternativeNumber, setAlternativeNumber] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || "");
  const [departmentId, setDepartmentId] = useState(doctors[0]?.departmentId || departments[0]?.id || "");
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState("10:00");
  const [bookingChannel, setBookingChannel] = useState<BookingChannel>("PHONE");
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  const handleDoctorChange = (docId: string) => {
    setDoctorId(docId);
    const doc = doctors.find((d) => d.id === docId);
    if (doc) {
      setDepartmentId(doc.departmentId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createManualBookingAction({
        patientName: patientName.trim(),
        mobileNumber: mobileNumber.trim(),
        alternativeNumber: alternativeNumber.trim() || undefined,
        email: email.trim() || undefined,
        age: age.trim() || undefined,
        gender: gender || undefined,
        doctorId,
        departmentId,
        appointmentDate,
        startTime,
        bookingChannel,
        reasonForVisit: reasonForVisit.trim() || undefined,
        internalNote: internalNote.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to create manual booking.");
      } else {
        setSuccessRef(res.appointment?.bookingReference || "SUCCESS");
      }
    } catch {
      setError("An unexpected error occurred while creating booking.");
    } finally {
      setLoading(false);
    }
  };

  if (successRef) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Manual Booking Created!</h1>
        <p className="text-slate-400 text-sm">
          The appointment has been confirmed and registered under reference:
        </p>
        <div className="p-4 bg-slate-900 border border-indigo-500/40 rounded-2xl font-mono text-xl font-bold text-indigo-400">
          {successRef}
        </div>
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => {
              setSuccessRef(null);
              setPatientName("");
              setMobileNumber("");
              setAlternativeNumber("");
              setEmail("");
              setAge("");
              setReasonForVisit("");
              setInternalNote("");
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Create Another Booking
          </button>
          <Link
            href="/admin/appointments"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            View Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/appointments"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Back to appointments list"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manual Booking Registration</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Register a walk-in, phone, or direct receptionist booking.
          </p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Demographic Information */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            Patient Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Patient Name *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alternative Contact (Optional)
              </label>
              <input
                type="tel"
                value={alternativeNumber}
                onChange={(e) => setAlternativeNumber(e.target.value)}
                placeholder="Alternative phone"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Age
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age in years"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointment & Clinical Consultation Details */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-indigo-400" />
            Doctor &amp; Time Slot Selection
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Consulting Doctor *
              </label>
              <select
                required
                value={doctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.department.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Department
              </label>
              <div className="px-3.5 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-300 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" />
                {selectedDoctor?.department.name || "General"}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Appointment Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Time (HH:MM) *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Booking Channel *
              </label>
              <select
                value={bookingChannel}
                onChange={(e) => setBookingChannel(e.target.value as BookingChannel)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="PHONE">Phone Booking</option>
                <option value="WALK_IN">Walk-in Patient</option>
                <option value="ADMIN">Administrative Desk</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reason for Visit / Clinical Notes
            </label>
            <textarea
              rows={2}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="Chief symptoms or reason for consulting doctor..."
              className="w-full p-3 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Initial Internal Staff Note (Optional)
            </label>
            <textarea
              rows={2}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Staff notes (e.g. VIP patient, previous MRI pending)..."
              className="w-full p-3 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/appointments"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reserving Slot &amp; Creating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Confirm &amp; Register Booking
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
