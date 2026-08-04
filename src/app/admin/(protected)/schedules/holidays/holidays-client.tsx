"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Palmtree,
  Plus,
  Trash2,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  addHospitalHolidayAction,
  deleteHospitalHolidayAction,
} from "@/lib/admin/actions";

interface HospitalHolidayItem {
  id: string;
  name: string;
  date: string;
  description: string;
}

interface HolidaysClientProps {
  initialHolidays: HospitalHolidayItem[];
}

export function HolidaysClient({ initialHolidays }: HolidaysClientProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await addHospitalHolidayAction(
        name.trim(),
        date,
        description.trim() || name.trim()
      );

      if (!res.success) {
        setError(res.error || "Failed to add hospital holiday.");
      } else {
        setName("");
        setDate("");
        setDescription("");
        setSuccessMsg("Hospital holiday registered successfully.");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred while adding holiday.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      setSaving(true);
      setError(null);
      const res = await deleteHospitalHolidayAction(holidayId);
      if (!res.success) {
        setError("Failed to delete holiday.");
      } else {
        setSuccessMsg("Hospital holiday removed.");
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
        {/* Add Holiday Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            Add Hospital Holiday
          </h2>
          <p className="text-xs text-slate-400">
            Full-day clinic closure across all departments and doctors.
          </p>

          <form onSubmit={handleAddHoliday} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Holiday Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Independence Day"
                className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Notice
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional hospital notice..."
                className="w-full p-2.5 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Palmtree className="w-3.5 h-3.5" />
              )}
              Register Holiday
            </button>
          </form>
        </div>

        {/* Existing Holidays List */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Configured Hospital Holidays ({initialHolidays.length})
          </h2>

          <div className="space-y-3">
            {initialHolidays.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">
                No hospital holidays configured yet.
              </div>
            ) : (
              initialHolidays.map((h) => (
                <div
                  key={h.id}
                  className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white text-sm flex items-center gap-2">
                      <span className="font-mono text-indigo-400 text-xs">{h.date}</span>
                      <span>—</span>
                      <span>{h.name}</span>
                    </div>
                    {h.description && (
                      <div className="text-xs text-slate-400 mt-1">{h.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                    aria-label="Delete holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
