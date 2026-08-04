import { getPublicTreatmentBySlug } from "@/lib/public/treatments";
import { FadeUp, SlideIn } from "@/components/ui/animations";
import { Activity, ArrowLeft, CalendarCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TreatmentDetailPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const { locale, slug } = await params;
  
  const treatment = await getPublicTreatmentBySlug(slug);

  if (!treatment) {
    notFound();
  }

  const title = locale === "ta" && treatment.titleTa ? treatment.titleTa : treatment.titleEn;
  const content = locale === "ta" && treatment.contentTa ? treatment.contentTa : treatment.contentEn;

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <FadeUp>
          <Link
            href={`/${locale}/treatments`}
            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-8 font-semibold text-sm focus-ring rounded-lg p-1 -m-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Treatments
          </Link>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Surgical Procedure</span>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{title}</h1>
            </div>
          </div>
        </FadeUp>

        <SlideIn direction="left">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-elevation-sm mb-12">
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </div>
        </SlideIn>

        <FadeUp delay={0.1}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-elevation-sm">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm mb-2">
              <ShieldAlert className="w-4 h-4" /> Medical Disclaimer & Patient Notice
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
              The clinical details provided here are educational and illustrative of neurosurgical protocols. Every patient requires thorough physical examination and radiological assessment (MRI/CT) to decide surgical eligibility.
            </p>
            <Link
              href={`/${locale}/appointments/book`}
              className="inline-flex bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-6 py-3 rounded-xl font-bold transition focus-ring shadow-medical-teal items-center gap-2 text-sm"
            >
              <CalendarCheck className="w-4 h-4" /> Schedule Clinical Evaluation
            </Link>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
