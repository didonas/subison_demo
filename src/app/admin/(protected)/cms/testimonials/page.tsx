import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ShieldCheck } from "lucide-react";

export default async function TestimonialsAdminPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
            <Link href="/admin/cms" className="hover:underline">CMS</Link>
            <span>/</span>
            <span>Testimonials</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Patient Testimonials & Consent</h1>
          <p className="text-sm text-slate-400">
            Review patient experiences, verify consent compliance, and manage display order on the public site.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Excerpt</th>
                <th className="py-3.5 px-4">Consent</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {testimonials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No testimonials found.
                  </td>
                </tr>
              ) : (
                testimonials.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{t.displayOrder}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{t.patientDisplayName}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">{t.patientLocation || "—"}</td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">{t.content}</td>
                    <td className="py-3.5 px-4">
                      {t.hasConsent ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs text-rose-400 font-semibold">No Consent</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          t.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : t.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
