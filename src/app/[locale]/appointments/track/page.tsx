import { Search, ShieldCheck, Clock, Calendar, UserCheck } from "lucide-react";
import { trackAppointmentStatus, TrackingResult } from "@/lib/appointments/service";
import { getTranslations } from "next-intl/server";

export default async function TrackAppointmentPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; mobile?: string }>;
}) {
  const { locale } = await params;
  const { ref, mobile } = await searchParams;
  const t = await getTranslations({ locale, namespace: "AppointmentsPage" });

  let trackingResult: TrackingResult | null = null;

  if (ref && mobile) {
    trackingResult = await trackAppointmentStatus(ref, mobile);
  }

  async function handleTrack(formData: FormData) {
    "use server";
    const refId = (formData.get("refId") as string || "").trim().toUpperCase();
    const mobileNum = (formData.get("mobileNumber") as string || "").trim();
    if (!refId || !mobileNum) return;
    const { redirect } = await import("next/navigation");
    redirect(`/${locale}/appointments/track?ref=${encodeURIComponent(refId)}&mobile=${encodeURIComponent(mobileNum)}`);
  }

  return (
    <div className="min-h-[80vh] py-12 sm:py-16 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
            {t("trackBadge")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">{t("trackTitle")}</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {t("trackSubtitle")}
          </p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-elevation-sm border border-slate-200/80 dark:border-slate-800 mb-8">
          <form action={handleTrack} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Booking Reference *
                </label>
                <input 
                  type="text" 
                  name="refId"
                  defaultValue={ref || ""}
                  placeholder="e.g. SNC-20260802-A1B2C3D4"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring uppercase font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Registered Mobile Number *
                </label>
                <input 
                  type="tel" 
                  name="mobileNumber"
                  defaultValue={mobile || ""}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring text-sm"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl transition focus-ring shadow-medical-teal flex items-center justify-center gap-2 text-sm mt-2"
            >
              <Search size={18} />
              Check Status
            </button>
          </form>
        </div>

        {/* Error State */}
        {trackingResult && !trackingResult.success && (
          <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 text-center mb-8 text-sm">
            <p className="font-medium">
              {trackingResult.error || "Invalid booking reference or mobile number. Please check your details and try again."}
            </p>
          </div>
        )}

        {/* Result Details */}
        {trackingResult?.success && trackingResult.data && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-elevation-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Booking Reference</p>
                <p className="font-mono font-bold text-lg text-teal-700 dark:text-teal-400">{trackingResult.data.bookingReference}</p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                trackingResult.data.status === 'CONFIRMED' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                trackingResult.data.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                trackingResult.data.status === 'CANCELLED' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800' :
                'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
              }`}>
                {trackingResult.data.status}
              </div>
            </div>

            <div className="p-6 grid sm:grid-cols-3 gap-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <UserCheck className="text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Doctor</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{trackingResult.data.doctorName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Appointment Date</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{trackingResult.data.appointmentDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Slot Time</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{trackingResult.data.startTime}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck size={16} className="text-teal-600 dark:text-teal-400" />
                Status Timeline
              </h3>
              <div className="space-y-4">
                {trackingResult.data.history.map((hist, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== (trackingResult?.data?.history.length ?? 0) - 1 && (
                      <div className="absolute left-1.5 top-6 bottom-[-1rem] w-px bg-slate-200 dark:bg-slate-700" />
                    )}
                    <div className="w-3 h-3 rounded-full bg-teal-600 dark:bg-teal-400 mt-1.5 z-10 shrink-0 ring-4 ring-teal-100 dark:ring-teal-950" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{hist.status}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(hist.createdAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
