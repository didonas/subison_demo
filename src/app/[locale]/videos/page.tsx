import { getPublicVideos } from "@/lib/public/videos";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/empty-state";
import { Video, BookOpen } from "lucide-react";

export default async function VideosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const videos = await getPublicVideos();

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <FadeUp>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              Clinical Media & Education
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Patient Health Videos & Doctor Talks
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Watch informative video explanations on stroke prevention, headache management, epilepsy awareness, and neurological wellness.
            </p>
          </div>
        </FadeUp>

        {videos.length === 0 ? (
          <EmptyState
            icon={Video}
            title="Educational Videos Coming Soon"
            description="Our neurologists are recording clinical guidance videos for patient education. In the meantime, explore our written patient health guides."
            actionLabel="Read Patient Guides"
            actionHref={`/${locale}/patient-resources`}
            actionIcon={BookOpen}
          />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {videos.map((vid) => {
              const title = locale === "ta" && vid.titleTa ? vid.titleTa : vid.titleEn;
              const caption = locale === "ta" && vid.captionTa ? vid.captionTa : vid.captionEn;

              return (
                <StaggerItem key={vid.id}>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-subtle border border-slate-200/80 dark:border-slate-800 card-hover flex flex-col h-full">
                    <div className="aspect-video w-full bg-slate-900 overflow-hidden">
                      <iframe
                        src={vid.embedUrl}
                        title={title || "Educational Video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                    {(title || caption) && (
                      <div className="p-5 sm:p-6 flex flex-col flex-1">
                        {title && <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">{title}</h2>}
                        {caption && <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{caption}</p>}
                      </div>
                    )}
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
