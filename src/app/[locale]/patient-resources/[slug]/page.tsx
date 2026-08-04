import { notFound } from "next/navigation";
import { getPublicArticleBySlug } from "@/lib/public/articles";
import { FadeUp } from "@/components/ui/animations";
import { ArrowLeft, UserCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface StructuredBlock {
  heading?: string;
  body?: string;
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = await getPublicArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const title = locale === "ta" && article.titleTa ? article.titleTa : article.titleEn;
  const summary = locale === "ta" && article.summaryTa ? article.summaryTa : article.summaryEn;
  const content = locale === "ta" && article.contentTa ? article.contentTa : article.contentEn;

  return (
    <div className="py-16 sm:py-20 bg-white dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <FadeUp>
          <div className="mb-8">
            <Link
              href={`/${locale}/patient-resources`}
              className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold text-sm mb-6 focus-ring rounded-lg p-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Patient Resources
            </Link>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs font-semibold px-3 py-1 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
                {article.category}
              </span>
              {article.isMedicalReviewed && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <UserCheck className="w-3.5 h-3.5" />
                  Reviewed by {article.reviewedByDoctorName || "Consultant Neurologist"}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              {title}
            </h1>

            {summary && (
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed border-l-4 border-teal-500 pl-4 my-6 bg-slate-50 dark:bg-slate-900/60 py-3 rounded-r-xl">
                {summary}
              </p>
            )}
          </div>

          <article className="prose prose-slate dark:prose-invert max-w-none mb-12 text-slate-800 dark:text-slate-200">
            {typeof content === "string" ? (
              <div dangerouslySetInnerHTML={{ __html: content }} />
            ) : content && Array.isArray(content) ? (
              <div className="space-y-6">
                {(content as StructuredBlock[]).map((block, idx) => (
                  <div key={idx}>
                    {block.heading && <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-3">{block.heading}</h2>}
                    {block.body && <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">{block.body}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">Detailed educational guidance on this condition is available at Subison Neuro Centre.</p>
            )}
          </article>

          {/* Statutory Medical Disclaimer */}
          <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-6 flex items-start gap-4 text-amber-900 dark:text-amber-200 text-xs md:text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-1">Medical Educational Disclaimer</h3>
              <p className="leading-relaxed text-amber-800 dark:text-amber-300">
                The information provided in this guide is for general educational and awareness purposes only and does not constitute individual medical diagnosis or treatment. Always consult a qualified medical professional for diagnosis and tailored clinical management.
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
