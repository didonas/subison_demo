import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ShieldCheck } from "lucide-react";

export default async function GalleryAdminPage() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
            <Link href="/admin/cms" className="hover:underline">CMS</Link>
            <span>/</span>
            <span>Gallery</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Media & Photo Gallery</h1>
          <p className="text-sm text-slate-400">
            Validated hospital facility photographs, clinical technology imagery, and bilingual alt-text.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">English Alt Text</th>
                <th className="py-3.5 px-4">Consent</th>
                <th className="py-3.5 px-4">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No media assets uploaded yet.
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono text-xs text-indigo-300 font-semibold">{a.fileName}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{a.mimeType}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{(a.fileSize / 1024).toFixed(1)} KB</td>
                    <td className="py-3.5 px-4 text-white text-xs">{a.altTextEn || "—"}</td>
                    <td className="py-3.5 px-4">
                      {a.consentConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Not Applicable</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</td>
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
