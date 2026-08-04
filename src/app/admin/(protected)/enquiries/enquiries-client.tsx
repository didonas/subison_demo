"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquareQuote,
  CheckCircle2,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { updateEnquiryStatusAction, addEnquiryNoteAction } from "@/lib/admin/actions";
import { EnquiryStatus } from "@/generated/prisma/client";

interface EnquiryListItem {
  id: string;
  name: string;
  maskedMobile: string;
  enquiryType: string;
  messageSummary: string;
  status: EnquiryStatus;
  preferredContact: string | null;
  assignedTo: string | null;
  createdAt: string;
}

interface EnquiriesClientProps {
  initialData: {
    items: EnquiryListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  selectedStatus?: EnquiryStatus;
}

export function EnquiriesClient({ initialData, selectedStatus }: EnquiriesClientProps) {
  const router = useRouter();

  const [activeEnquiry, setActiveEnquiry] = useState<EnquiryListItem | null>(
    initialData.items[0] || null
  );
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleStatusFilter = (st?: EnquiryStatus) => {
    if (st) {
      router.push(`/admin/enquiries?status=${st}`);
    } else {
      router.push("/admin/enquiries");
    }
  };

  const handleUpdateStatus = async (enquiryId: string, newStatus: EnquiryStatus) => {
    try {
      setLoading(true);
      setError(null);
      const res = await updateEnquiryStatusAction(enquiryId, newStatus);
      if (!res.success) {
        setError(res.error || "Failed to update enquiry status.");
      } else {
        setSuccessMsg(`Enquiry marked as ${newStatus}.`);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnquiry || !newNote.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await addEnquiryNoteAction(activeEnquiry.id, newNote);
      if (!res.success) {
        setError(res.error || "Failed to add note.");
      } else {
        setNewNote("");
        setSuccessMsg("Note recorded.");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (st: EnquiryStatus) => {
    switch (st) {
      case "UNREAD":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "IN_PROGRESS":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "RESOLVED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "ARCHIVED":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
        <button
          onClick={() => handleStatusFilter()}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            !selectedStatus
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          All Enquiries
        </button>
        <button
          onClick={() => handleStatusFilter("UNREAD")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedStatus === "UNREAD"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => handleStatusFilter("IN_PROGRESS")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedStatus === "IN_PROGRESS"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => handleStatusFilter("RESOLVED")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedStatus === "RESOLVED"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Resolved
        </button>
        <button
          onClick={() => handleStatusFilter("ARCHIVED")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedStatus === "ARCHIVED"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Archived
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enquiry List Column */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Inbox ({initialData.total})
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {initialData.items.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">
                No patient enquiries in this filter.
              </div>
            ) : (
              initialData.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveEnquiry(item)}
                  className={`w-full text-left p-3.5 rounded-xl border transition ${
                    activeEnquiry?.id === item.id
                      ? "bg-indigo-950/40 border-indigo-500/50 shadow-md"
                      : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs truncate max-w-[140px]">
                      {item.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-300 mt-1 font-medium">{item.enquiryType}</div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.messageSummary}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-mono">
                    {new Date(item.createdAt).toLocaleString("en-IN")}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Enquiry Detail & Action Panel */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-6">
          {activeEnquiry ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">{activeEnquiry.name}</h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                        activeEnquiry.status
                      )}`}
                    >
                      {activeEnquiry.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Category: <strong className="text-slate-200">{activeEnquiry.enquiryType}</strong> • Preferred Contact: {activeEnquiry.preferredContact}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeEnquiry.status !== "IN_PROGRESS" && (
                    <button
                      onClick={() => handleUpdateStatus(activeEnquiry.id, "IN_PROGRESS")}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 text-xs font-semibold transition"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {activeEnquiry.status !== "RESOLVED" && (
                    <button
                      onClick={() => handleUpdateStatus(activeEnquiry.id, "RESOLVED")}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {activeEnquiry.status !== "ARCHIVED" && (
                    <button
                      onClick={() => handleUpdateStatus(activeEnquiry.id, "ARCHIVED")}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Enquiry Message
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {activeEnquiry.messageSummary}
                </div>
              </div>

              {/* Staff Follow-up Note Form */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Internal Triage Notes
                </div>
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add operational notes or patient call notes..."
                    className="w-full p-3 bg-slate-950/60 border border-slate-700/70 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newNote.trim()}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Save Follow-up Note
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-500 text-sm">
              <MessageSquareQuote className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              Select an enquiry from the left to view message details and update status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
