import { getSiteSettings } from "@/lib/settings";
import { getPublicSpecialities } from "@/lib/public/specialities";
import { getPublicFacilities } from "@/lib/public/facilities";
import { getPublicDoctor } from "@/lib/public/doctor";
import { getPublicTestimonials } from "@/lib/public/testimonials";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, Activity, Brain, UserCheck, ShieldCheck, PhoneCall, HeartPulse, Clock, MapPin } from "lucide-react";
import { FadeIn, FadeUp, SlideIn, StaggerContainer, StaggerItem } from "@/components/ui/animations";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const settings = await getSiteSettings(locale);

  // Fetch verified active content via public services
  const specialities = await getPublicSpecialities(4);
  const facilities = await getPublicFacilities(4);
  const mainDoctor = await getPublicDoctor(locale);
  const testimonials = await getPublicTestimonials(3);

  const journeySteps = [
    { step: "1", title: t("step1Title"), desc: t("step1Desc") },
    { step: "2", title: t("step2Title"), desc: t("step2Desc") },
    { step: "3", title: t("step3Title"), desc: t("step3Desc") },
    { step: "4", title: t("step4Title"), desc: t("step4Desc") }
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      
      {/* 1. Hero Section */}
      <section className="relative w-full bg-primary pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <FadeUp>
              <h1 className={`font-bold text-white mb-6 ${
                locale === "ta" 
                  ? "text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl leading-[1.3] max-w-3xl" 
                  : "text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl leading-[1.15] max-w-3xl"
              }`}>
                {t("heroTitle")}
              </h1>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl leading-relaxed">
                {t("heroSubtitle", { hospitalName: settings.hospitalName })}
              </p>
            </FadeUp>
            <FadeUp delay={0.4} className="flex flex-wrap gap-4">
              <Link href={`/${locale}/contact`} className="bg-accent text-accent-foreground px-8 py-3 rounded-full font-bold hover:bg-accent/90 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-white">
                {t("bookAppointment")}
              </Link>
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-3 rounded-full font-bold hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
                  {t("callHospital")}
                </a>
              )}
              {settings.latitude && settings.longitude && (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${settings.latitude},${settings.longitude}`} target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-3 rounded-full font-bold hover:bg-white/20 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white">
                  <MapPin className="w-4 h-4" /> {t("directions")}
                </a>
              )}
            </FadeUp>
          </div>
        </div>
      </section>

      {/* 2. Quick Info Cards (Overlapping Hero) */}
      <section className="relative z-20 -mt-16 mb-20 container mx-auto px-4">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StaggerItem>
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 h-full flex flex-col items-start justify-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t("consultationHours")}</h3>
              <p className="text-gray-600 text-sm whitespace-pre-line">{settings.consultationHours}</p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 h-full flex flex-col items-start justify-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t("location")}</h3>
              <p className="text-gray-600 text-sm">{settings.address}</p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 h-full flex flex-col items-start justify-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4 text-destructive">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t("emergency")}</h3>
              <p className="text-gray-600 text-sm mb-2">{t("emergencySubtext")}</p>
              {settings.emergency && <p className="font-bold text-destructive text-xl">{settings.emergency}</p>}
            </div>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* 3. About Preview & 4. Why Choose */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <SlideIn direction="left">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">{t("aboutTitle")}</h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {t("aboutDesc", { hospitalName: settings.hospitalName })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="flex gap-3">
                <ShieldCheck className="w-6 h-6 text-accent shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900">{t("expertCare")}</h4>
                  <p className="text-sm text-gray-600">{t("expertCareSub")}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <UserCheck className="w-6 h-6 text-accent shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900">{t("patientCentric")}</h4>
                  <p className="text-sm text-gray-600">{t("patientCentricSub")}</p>
                </div>
              </div>
            </div>
            <Link href={`/${locale}/about`} className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors">
              {t("learnMore")} <ArrowRight className="w-4 h-4" />
            </Link>
          </SlideIn>
          <SlideIn direction="right">
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-200 shadow-xl flex items-center justify-center">
              <p className="text-gray-500 font-medium">{settings.hospitalName}</p>
            </div>
          </SlideIn>
        </div>
      </section>

      {/* 5. Doctor Introduction */}
      {mainDoctor && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <FadeIn>
              <div className="bg-primary text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Brain className="w-64 h-64" />
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                  <div className="md:col-span-1 aspect-square bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                    <p className="text-white/60 font-medium text-sm text-center px-4">{mainDoctor.name}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-accent font-bold tracking-wider uppercase text-sm mb-2 block">{t("specialistBadge")}</span>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{mainDoctor.name}</h2>
                    <p className="text-white/80 mb-2 font-medium">{mainDoctor.qualifications}</p>
                    <p className="text-white/80 mb-6">{mainDoctor.specialisation}</p>
                    <Link href={`/${locale}/doctor`} className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors">
                      {t("viewProfile")} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* 6. Specialities */}
      {specialities.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <FadeUp>
              <div className="text-center mb-16">
                <span className="text-accent font-bold tracking-wider uppercase text-sm mb-2 block">{t("specialitiesBadge")}</span>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">{t("specialitiesTitle")}</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">{t("specialitiesSub")}</p>
              </div>
            </FadeUp>
            
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {specialities.map((spec) => (
                <StaggerItem key={spec.id}>
                  <Link href={`/${locale}/specialities/${spec.slug}`} className="block group h-full">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                      <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Activity className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-3">{locale === 'ta' && spec.titleTa ? spec.titleTa : spec.titleEn}</h3>
                      <div className="mt-auto flex items-center gap-2 text-secondary font-semibold text-sm group-hover:gap-3 transition-all">
                        {t("explore")} <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
            
            <div className="text-center mt-12">
              <Link href={`/${locale}/specialities`} className="inline-flex bg-white border border-gray-200 text-primary px-8 py-3 rounded-full font-bold hover:bg-gray-50 transition-colors shadow-sm">
                {t("viewAllSpecialities")}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 7. Facilities */}
      {facilities.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <FadeUp>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-12 text-center">{t("facilitiesTitle")}</h2>
            </FadeUp>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {facilities.map((fac) => (
                <StaggerItem key={fac.id}>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center h-full flex flex-col items-center justify-center">
                    <HeartPulse className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold text-gray-900">{locale === 'ta' && fac.titleTa ? fac.titleTa : fac.titleEn}</h3>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* 8. Patient Journey */}
      <section className="py-20 bg-primary text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <FadeUp>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("journeyTitle")}</h2>
              <p className="text-white/80 max-w-2xl mx-auto">{t("journeySub", { hospitalName: settings.hospitalName })}</p>
            </div>
          </FadeUp>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-white/20 -translate-y-1/2 z-0"></div>
            
            {journeySteps.map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-xl ring-8 ring-primary">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-white/70 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Testimonials (Conditional) */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <FadeUp>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-12 text-center">{t("testimonialsTitle")}</h2>
            </FadeUp>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map(item => (
                <StaggerItem key={item.id}>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-gray-600 italic mb-6">&quot;{item.text}&quot;</p>
                    <div className="font-bold text-primary">{item.patientName}</div>
                    {item.location && <div className="text-sm text-gray-500">{item.location}</div>}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="bg-secondary rounded-3xl p-10 text-center shadow-xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{t("ctaTitle")}</h2>
              <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
                {t("ctaSub")}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href={`/${locale}/contact`} className="bg-white text-secondary px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg">
                  {t("ctaBook")}
                </Link>
                {settings.phone && (
                  <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="bg-secondary text-white border-2 border-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-colors">
                    {t("ctaCall", { phone: settings.phone })}
                  </a>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
