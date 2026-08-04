import { FadeUp } from "@/components/ui/animations";
import { ShieldCheck, Lock, FileText } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <FadeUp>
          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              Data Protection & Confidentiality
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              How {settings.hospitalName} protects your health information and respects patient privacy.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-elevation-sm space-y-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" /> 1. Commitment to Patient Privacy
              </h2>
              <p>
                At {settings.hospitalName}, we consider the confidentiality of medical records and patient data of paramount importance. All medical records, clinical notes, and appointment details are handled strictly under Indian healthcare standards and applicable medical council ethics.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-600 dark:text-teal-400" /> 2. Collection of Information
              </h2>
              <p>
                When you book an appointment or submit a contact enquiry, we collect essential identifying details including patient name, phone number, email address, and optional symptom descriptions. This information is utilized exclusively for clinical scheduling and direct healthcare communication.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" /> 3. Data Sharing & Security
              </h2>
              <p>
                We do not sell, lease, or monetize your contact or medical information. Your health data is accessible only by authorized hospital clinical staff and reception personnel involved in your healthcare delivery.
              </p>
            </section>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
