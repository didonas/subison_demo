import { getPublicTestimonials } from "@/lib/public/testimonials";
import { getTranslations } from "next-intl/server";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/empty-state";
import { Quote, UserCheck, HeartHandshake, Calendar } from "lucide-react";

export default async function TestimonialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TestimonialsPage" });
  const testimonials = await getPublicTestimonials();

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl">
        <FadeUp>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {t("title")}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </FadeUp>

        {testimonials.length === 0 ? (
          <EmptyState
            icon={HeartHandshake}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
            actionLabel={t("emptyAction")}
            actionHref={`/${locale}/appointments/book`}
            actionIcon={Calendar}
          />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {testimonials.map((item) => (
              <StaggerItem key={item.id}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-subtle border border-slate-200/80 dark:border-slate-800 card-hover flex flex-col justify-between h-full relative overflow-hidden">
                  <Quote className="w-10 h-10 text-teal-600/10 dark:text-teal-400/10 absolute top-6 right-6" />
                  
                  <div className="mb-6">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic text-sm sm:text-base">&ldquo;{item.text}&rdquo;</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{item.patientName}</h2>
                      {item.location && <p className="text-xs text-slate-500 dark:text-slate-400">{item.location}</p>}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <UserCheck className="w-3.5 h-3.5" /> {t("verifiedConsent")}
                    </span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
