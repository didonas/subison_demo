import { getPublicGallery } from "@/lib/public/gallery";
import { FadeUp } from "@/components/ui/animations";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Camera } from "lucide-react";

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const items = await getPublicGallery();

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <FadeUp>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              Infrastructure & Technology
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Hospital Facility & Clinical Gallery
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Explore our modern neuro-diagnostic laboratories, EEG suites, patient consultation rooms, and specialized care infrastructure.
            </p>
          </div>
        </FadeUp>

        {items.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Facility Photographs Updating"
            description="Our clinical infrastructure gallery is currently being refreshed with high-resolution photography."
            actionLabel="View Medical Specialities"
            actionHref={`/${locale}/specialities`}
          />
        ) : (
          <GalleryLightbox items={items} locale={locale} />
        )}
      </div>
    </div>
  );
}
