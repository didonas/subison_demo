import { getPublicArticles } from "@/lib/public/articles";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen, ArrowRight, UserCheck, Stethoscope } from "lucide-react";
import Link from "next/link";

export default async function PatientResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const articles = await getPublicArticles();

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <FadeUp>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              Neurology Health Library
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Patient Education & Resources
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Clinically verified guides and information to help you understand neurological health conditions and treatments.
            </p>
          </div>
        </FadeUp>

        {articles.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Educational Guides in Preparation"
            description="Our neurology specialists are reviewing and preparing patient health guides. In the meantime, explore our clinical specialities."
            actionLabel="Explore Specialities"
            actionHref={`/${locale}/specialities`}
            actionIcon={Stethoscope}
          />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {articles.map((article) => {
              const title = locale === "ta" && article.titleTa ? article.titleTa : article.titleEn;
              const summary = locale === "ta" && article.summaryTa ? article.summaryTa : article.summaryEn;

              return (
                <StaggerItem key={article.id}>
                  <Link href={`/${locale}/patient-resources/${article.slug}`} className="block group h-full focus-ring rounded-2xl">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-subtle border border-slate-200/80 dark:border-slate-800 card-hover h-full flex flex-col">
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                          {article.category}
                        </span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug">{title}</h2>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">{summary || "Read more about this condition and clinical guidance."}</p>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        {article.isMedicalReviewed && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <UserCheck className="w-3.5 h-3.5" /> Medically Reviewed
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400 group-hover:gap-2 transition-all ml-auto">
                          Read Guide <ArrowRight className="w-3.5 h-3.5" />
                        </span>
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
