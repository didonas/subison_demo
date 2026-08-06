import { getPublicSpecialityBySlug } from "@/lib/public/specialities";
import { getTranslations } from "next-intl/server";
import { FadeUp, SlideIn } from "@/components/ui/animations";
import { Brain, ArrowLeft, CalendarCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SpecialityDetailPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "SpecialitiesPage" });
  
  const speciality = await getPublicSpecialityBySlug(slug);

  if (!speciality) {
    notFound();
  }

  const title = locale === "ta" && speciality.titleTa ? speciality.titleTa : speciality.titleEn;
  const content = locale === "ta" && speciality.contentTa ? speciality.contentTa : speciality.contentEn;

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <FadeUp>
          <Link
            href={`/${locale}/specialities`}
            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-8 font-semibold text-sm focus-ring rounded-lg p-1 -m-1"
          >
            <ArrowLeft className="w-4 h-4" /> {t("backLink")}
          </Link>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">{t("clinicalFocus")}</span>
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
          <div className="bg-teal-50/70 dark:bg-slate-900 border border-teal-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevation-sm">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" /> {t("consultSpecialist")}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                {t("consultSpecialistDesc")}
              </p>
            </div>
            <Link
              href={`/${locale}/appointments/book`}
              className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shrink-0 px-6 py-3 rounded-xl font-bold transition focus-ring shadow-medical-teal flex items-center gap-2 text-sm"
            >
              <CalendarCheck className="w-4 h-4" /> {t("bookConsultation")}
            </Link>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
