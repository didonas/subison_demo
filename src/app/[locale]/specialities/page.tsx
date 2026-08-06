import { getPublicSpecialities } from "@/lib/public/specialities";
import { getTranslations } from "next-intl/server";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRight, Brain } from "lucide-react";
import Link from "next/link";

export default async function SpecialitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SpecialitiesPage" });
  const specialities = await getPublicSpecialities();

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <FadeUp>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">{t("title")}</h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </FadeUp>

        {specialities.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDesc")}
            actionLabel={t("emptyAction")}
            actionHref={`/${locale}/contact`}
          />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {specialities.map((spec) => {
              const title = locale === "ta" && spec.titleTa ? spec.titleTa : spec.titleEn;
              const desc = locale === "ta" && spec.contentTa ? spec.contentTa : spec.contentEn;
              const previewText = (desc || "").substring(0, 130) + "...";

              return (
                <StaggerItem key={spec.id}>
                  <Link href={`/${locale}/specialities/${spec.slug}`} className="block group h-full">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-elevation-sm card-hover border border-slate-200/80 dark:border-slate-800 h-full flex flex-col justify-between">
                      <div>
                        <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mb-6 border border-teal-100 dark:border-teal-900 group-hover:scale-105 transition-transform">
                          <Brain className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{title}</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">{previewText}</p>
                      </div>
                      <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-xs sm:text-sm pt-3 border-t border-slate-100 dark:border-slate-800 group-hover:gap-3 transition-all">
                        {t("exploreDetails")} <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
