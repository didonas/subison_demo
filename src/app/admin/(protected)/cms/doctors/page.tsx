import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DoctorsAdminPage() {
  const doctors = await prisma.doctor.findMany({
    include: { profile: true, department: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
            <Link href="/admin/cms" className="hover:underline">CMS</Link>
            <span>/</span>
            <span>Doctors</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Doctor Profiles & Credentials</h1>
          <p className="text-sm text-slate-400">
            Medical council registrations, qualifications, experience, consultation fees, and verification status.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Doctor Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Qualifications</th>
                <th className="py-3.5 px-4">Registration</th>
                <th className="py-3.5 px-4">Fee (₹)</th>
                <th className="py-3.5 px-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No doctors found.
                  </td>
                </tr>
              ) : (
                doctors.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">{item.name}</td>
                      <td className="py-3.5 px-4 text-indigo-300">{item.department.name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{item.profile?.qualifications || item.qualifications}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        {item.profile?.registrationNumber || item.registration || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">
                        ₹{item.consultationFee.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            item.profile?.isVerified
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {item.profile?.isVerified ? "VERIFIED" : "UNVERIFIED"}
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
