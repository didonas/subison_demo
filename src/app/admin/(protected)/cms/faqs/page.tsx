import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function FaqsAdminPage() {
  const faqs = await prisma.fAQ.findMany({
    include: { translations: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
            <Link href="/admin/cms" className="hover:underline">CMS</Link>
            <span>/</span>
            <span>FAQs</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Patient Frequently Asked Questions</h1>
          <p className="text-sm text-slate-400">
            Categorized questions and answers for appointments, emergency care, admission, and neurological treatments.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">English Question</th>
                <th className="py-3.5 px-4">Tamil Question</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No FAQs found.
                  </td>
                </tr>
              ) : (
                faqs.map((item) => {
                  const enTrans = item.translations.find((t) => t.locale === "en");
                  const taTrans = item.translations.find((t) => t.locale === "ta");

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{item.displayOrder}</td>
                      <td className="py-3.5 px-4 text-xs text-indigo-300 font-semibold">{item.category}</td>
                      <td className="py-3.5 px-4 text-white font-medium">{enTrans?.question || "—"}</td>
                      <td className="py-3.5 px-4 text-slate-300">{taTrans?.question || <span className="text-slate-500 italic">Not translated</span>}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            item.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
