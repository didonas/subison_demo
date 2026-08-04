import { FadeUp } from "@/components/ui/animations";
import { Scale, Clock, AlertTriangle } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

export default async function TermsOfServicePage() {
  const settings = await getSiteSettings();

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <FadeUp>
          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              Hospital Terms & Guidelines
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard clinical consultation guidelines, appointment policies, and emergency protocols.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-elevation-sm space-y-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" /> 1. Appointment Scheduling & Consultations
              </h2>
              <p>
                Appointment bookings made online represent requests for outpatient consultation slots. While we endeavor to adhere strictly to allocated schedules, emergency surgical cases may occasionally cause unexpected delays.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" /> 2. Emergency Medical Protocol
              </h2>
              <p>
                Online appointments and website contact forms are strictly for elective consultations and general enquiries. If you or a loved one is experiencing acute neurological symptoms (sudden weakness, speech loss, seizures, severe head injury), visit the hospital Emergency Room immediately or call emergency medical services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Scale className="w-5 h-5 text-teal-600 dark:text-teal-400" /> 3. Consultation Fees & Payment
              </h2>
              <p>
                Consultation charges ({settings.appointmentFee}) are payable directly at the hospital reception desk upon check-in. Payments for investigations, radiology, or surgical admissions are handled transparently as per hospital billing schedules.
              </p>
            </section>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
