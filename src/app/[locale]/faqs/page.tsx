import { getPublicFaqs } from "@/lib/public/faqs";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpCircle, ChevronDown, MessageSquare } from "lucide-react";

export default async function FaqsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const faqs = await getPublicFaqs();

  // Group by category
  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <FadeUp>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              Patient Knowledge Base
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Find answers to common questions about consultations, diagnostic procedures, treatments, and appointments.
            </p>
          </div>
        </FadeUp>

        {faqs.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="Knowledge Base Updating"
            description="Our clinical team is updating frequently asked questions. Have an immediate question? Feel free to reach out directly."
            actionLabel="Contact Clinic"
            actionHref={`/${locale}/contact`}
            actionIcon={MessageSquare}
          />
        ) : (
          <div className="space-y-12">
            {categories.map((cat) => {
              const catFaqs = faqs.filter((f) => f.category === cat);
              return (
                <div key={cat} className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
                    {cat}
                  </h2>
                  <StaggerContainer className="space-y-3.5">
                    {catFaqs.map((faq) => {
                      const question = locale === "ta" && faq.questionTa ? faq.questionTa : faq.questionEn;
                      const answer = locale === "ta" && faq.answerTa ? faq.answerTa : faq.answerEn;

                      return (
                        <StaggerItem key={faq.id}>
                          <details className="group bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-subtle border border-slate-200/80 dark:border-slate-800 open:shadow-elevation-sm transition-all">
                            <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900 dark:text-white text-base sm:text-lg select-none list-none focus-ring rounded-xl p-1">
                              <span className="flex items-center gap-3 pr-4">
                                <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                                {question}
                              </span>
                              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                            </summary>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                              {answer}
                            </div>
                          </details>
                        </StaggerItem>
                      );
                    })}
                  </StaggerContainer>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
