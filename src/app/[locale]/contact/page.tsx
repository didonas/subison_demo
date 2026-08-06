import { getSiteSettings } from "@/lib/settings";
import { getTranslations } from "next-intl/server";
import { FadeUp, SlideIn } from "@/components/ui/animations";
import { MapPin, Phone, Mail, Clock, AlertTriangle } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { env } from "@/lib/env";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });
  const settings = await getSiteSettings(locale);

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-12">
          {/* Contact Details Side */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <SlideIn direction="left">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-elevation-sm border border-slate-200/80 dark:border-slate-800 h-full">
                
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 p-4 rounded-2xl mb-8 flex items-start gap-3" role="alert">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <p className="text-xs sm:text-sm font-semibold leading-snug">
                    {t("emergencyNotice")}
                  </p>
                </div>

                <ul className="flex flex-col gap-7">
                  <li className="flex gap-4">
                    <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm sm:text-base">{t("addressTitle")}</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm whitespace-pre-line leading-relaxed">{settings.address}</p>
                      {settings.latitude && settings.longitude && (
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${settings.latitude},${settings.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-teal-600 dark:text-teal-400 font-semibold text-xs sm:text-sm hover:underline"
                        >
                          {t("getDirections")}
                        </a>
                      )}
                    </div>
                  </li>
                  
                  {settings.phone && (
                    <li className="flex gap-4">
                      <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm sm:text-base">{t("phoneTitle")}</h3>
                        <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm hover:text-teal-600 transition-colors block mb-1">
                          {settings.phone}
                        </a>
                        {settings.whatsapp && (
                          <a href={`https://wa.me/${settings.whatsapp.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm hover:underline">
                            {t("whatsappMsg")}
                          </a>
                        )}
                      </div>
                    </li>
                  )}
                  
                  {settings.email && (
                    <li className="flex gap-4">
                      <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm sm:text-base">{t("emailTitle")}</h3>
                        <a href={`mailto:${settings.email}`} className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm hover:text-teal-600 transition-colors">
                          {settings.email}
                        </a>
                      </div>
                    </li>
                  )}
                  
                  <li className="flex gap-4">
                    <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm sm:text-base">{t("timingsTitle")}</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm whitespace-pre-line leading-relaxed">{settings.consultationHours}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </SlideIn>

            {/* Google Map */}
            {settings.latitude && settings.longitude ? (
              <SlideIn direction="left" delay={0.2}>
                <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-elevation-sm border border-slate-200/80 dark:border-slate-800 aspect-video relative">
                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-1 text-sm sm:text-base">{t("mapTitle")}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Coordinates: {settings.latitude}, {settings.longitude}</p>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${settings.latitude},${settings.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition focus-ring shadow-sm"
                    >
                      {t("openMaps")}
                    </a>
                  </div>
                </div>
              </SlideIn>
            ) : null}
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3">
            <SlideIn direction="right">
              <ContactForm siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
            </SlideIn>
          </div>
        </div>
      </div>
    </div>
  );
}
