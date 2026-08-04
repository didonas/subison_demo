import { getPublicTreatments } from "@/lib/public/treatments";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function TreatmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const treatments = await getPublicTreatments();

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <FadeUp>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              Specialized Interventions & Surgery
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Treatments & Procedures</h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Advanced neurosurgical, microscopic, and minimally invasive procedures designed for patient safety and expedited recovery.
            </p>
          </div>
        </FadeUp>

        {treatments.length === 0 ? (
          <EmptyState
            title="Procedures Being Updated"
            description="Clinical treatment descriptions and surgical protocols are currently being reviewed by our medical board."
            actionLabel="Contact Care Desk"
            actionHref={`/${locale}/contact`}
          />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {treatments.map((t) => {
              const title = locale === "ta" && t.titleTa ? t.titleTa : t.titleEn;
              const desc = locale === "ta" && t.contentTa ? t.contentTa : t.contentEn;
              const previewText = (desc || "").substring(0, 150) + "...";

              return (
                <StaggerItem key={t.id}>
                  <Link href={`/${locale}/treatments/${t.slug}`} className="group block h-full">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-elevation-sm card-hover h-full flex flex-col justify-between">
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900 group-hover:scale-105 transition-transform">
                          <Activity className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2.5 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {title}
                          </h2>
                          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                            {previewText}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-xs sm:text-sm pt-2 group-hover:gap-3 transition-all border-t border-slate-100 dark:border-slate-800 mt-2">
                        Procedure Overview & Recovery <ArrowRight className="w-4 h-4" />
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
