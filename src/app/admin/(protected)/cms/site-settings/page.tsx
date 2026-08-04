import Link from "next/link";
import { getSiteSettings } from "@/lib/cms/service";
import { MapPin, AlertTriangle } from "lucide-react";

export default async function SiteSettingsAdminPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
            <Link href="/admin/cms" className="hover:underline">CMS</Link>
            <span>/</span>
            <span>Site Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Hospital Site Settings & Emergency Banner</h1>
          <p className="text-sm text-slate-400">
            Global phone numbers, consultation hours, emergency announcements, and search engine metadata.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hospital Identity */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Contact & Location</h2>
              <p className="text-xs text-slate-400">Public clinic coordinates</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/40">
              <span className="text-slate-400">Hospital Name:</span>
              <span className="text-white font-medium">{settings?.hospitalName || "Subison Neuro Centre"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/40">
              <span className="text-slate-400">Emergency Phone:</span>
              <span className="text-emerald-400 font-mono font-medium">{settings?.emergencyPhone || "+91 94431 52622"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/40">
              <span className="text-slate-400">Reception Phone:</span>
              <span className="text-white font-mono font-medium">{settings?.receptionPhone || "+91 4652 227777"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Email:</span>
              <span className="text-white font-mono">{settings?.hospitalEmail || "subisonneuro@gmail.com"}</span>
            </div>
          </div>
        </div>

        {/* Emergency Banner */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Emergency Announcement Banner</h2>
              <p className="text-xs text-slate-400">Site-wide critical alert configuration</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40">
              <span className="text-slate-400">Banner Enabled:</span>
              <span className={`font-semibold ${settings?.emergencyBannerEnabled ? "text-emerald-400" : "text-slate-500"}`}>
                {settings?.emergencyBannerEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <div className="py-1">
              <span className="text-slate-400 block mb-1">English Message:</span>
              <p className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
                {settings?.emergencyMessageEn || "24/7 Acute Stroke & Trauma Emergency Care Available."}
              </p>
            </div>
            <div className="py-1">
              <span className="text-slate-400 block mb-1">Tamil Message:</span>
              <p className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
                {settings?.emergencyMessageTa || "24/7 பக்கவாதம் மற்றும் தீவிர நரம்பியல் அவசர சிகிச்சை பிரிவு செயல்படுகிறது."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
