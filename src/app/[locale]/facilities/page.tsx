import { getPublicFacilities } from "@/lib/public/facilities";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, HeartPulse, Sparkles } from "lucide-react";

export default async function FacilitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const facilities = await getPublicFacilities();

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <FadeUp>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              Infrastructure & Technology
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Hospital Facilities</h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Purpose-built neuro-intensive care, laminar airflow operating theatres, high-precision surgical microscopes, and dedicated rehabilitation units.
            </p>
          </div>
        </FadeUp>

        {facilities.length === 0 ? (
          <EmptyState
            title="Facility Details Under Review"
            description="Our medical infrastructure, diagnostic suites, and neuro-ICU specifications are currently being updated."
            actionLabel="Inquire with Front Desk"
            actionHref={`/${locale}/contact`}
          />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {facilities.map((fac) => {
              const title = locale === "ta" && fac.titleTa ? fac.titleTa : fac.titleEn;
              const desc = locale === "ta" && fac.contentTa ? fac.contentTa : fac.contentEn;

              return (
                <StaggerItem key={fac.id}>
                  <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-elevation-sm card-hover border border-slate-200/80 dark:border-slate-800 h-full flex flex-col">
                    <div className="aspect-video bg-teal-50/50 dark:bg-slate-800/60 flex items-center justify-center p-4 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <Building2 className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <HeartPulse className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{desc}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center text-xs font-semibold text-teal-600 dark:text-teal-400">
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Hospital Standard
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
