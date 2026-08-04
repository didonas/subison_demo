import { getSiteSettings } from "@/lib/settings";
import { FadeUp, SlideIn } from "@/components/ui/animations";
import { ShieldCheck, UserCheck, Stethoscope, Award, Sparkles, Building } from "lucide-react";

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              Institutional Heritage & Philosophy
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">About Subison Neuro Centre</h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Dedicated to compassionate, world-class neurological diagnosis, minimally invasive neurosurgery, and patient-centered recovery.
            </p>
          </div>
        </FadeUp>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center mb-20">
          <SlideIn direction="left">
            <div className="aspect-4/3 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-elevation-sm flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 border border-teal-100 dark:border-teal-900">
                <Building className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{settings.hospitalName}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Comprehensive Neuro, Spine, Trauma & Stroke Management Centre
              </p>
            </div>
          </SlideIn>
          
          <SlideIn direction="right" className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-elevation-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Our Mission
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                To deliver ethical, precise, and accessible brain and spine interventions. Through rigorous clinical protocols and modern microsurgical techniques, we ensure optimal restorative outcomes for each patient.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-elevation-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Our Vision
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                To establish a benchmark regional neurosciences institution recognised for patient trust, surgical safety, rapid acute stroke response, and transparent clinical care.
              </p>
            </div>
          </SlideIn>
        </div>

        {/* Core Values */}
        <FadeUp>
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-elevation-md mb-12 border border-slate-800">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-white">Our Guiding Clinical Values</h2>
            <p className="text-slate-400 text-sm text-center max-w-md mx-auto mb-10">Principles that guide every surgical decision and consultation</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">Clinical Excellence</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Continuous adherence to international neurosurgical and patient safety benchmarks.</p>
              </div>
              
              <div className="text-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">Compassionate Care</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Empathetic listening and personalized guidance for patients and families throughout recovery.</p>
              </div>
              
              <div className="text-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">Ethical Integrity</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Evidence-based advice, clear surgical indications, and transparent fee communication.</p>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
