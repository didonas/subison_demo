import { prisma } from "@/lib/prisma";
import { FadeUp, SlideIn, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/empty-state";
import { Award, GraduationCap, CalendarCheck, ShieldCheck, UserCheck, Stethoscope, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function DoctorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  const doctor = await prisma.doctor.findFirst({
    include: { profile: true, department: true }
  });

  if (!doctor) {
    return (
      <div className="py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <EmptyState
            title="Specialist Profile Under Review"
            description="Clinical certifications and doctor credentials are currently being verified by the medical director."
            actionLabel="Book Consultation Desk"
            actionHref={`/${locale}/appointments/book`}
          />
        </div>
      </div>
    );
  }

  const qualifications = doctor.profile?.qualifications || doctor.qualifications;
  const registration = doctor.profile?.registrationNumber || doctor.registration;
  const experience = doctor.profile?.experienceYears 
    ? `${doctor.profile.experienceYears}+ Years Clinical Neurosurgery`
    : doctor.experience;
  
  const bio = locale === "ta" && doctor.profile?.bioTa 
    ? doctor.profile.bioTa 
    : (doctor.profile?.bioEn || doctor.bio);

  const specialisation = doctor.department?.name || doctor.specialisation;

  return (
    <div className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <FadeUp>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
              Consultant Medical Faculty
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Lead Neurosurgeon</h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Excellence in microscopic cranial interventions, minimally invasive spine surgery, and neurological care.
            </p>
          </div>
        </FadeUp>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-elevation-md border border-slate-200/80 dark:border-slate-800 overflow-hidden mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3">
            
            {/* Image & Quick Actions Side */}
            <SlideIn direction="left" className="bg-slate-50 dark:bg-slate-800/40 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800">
              <div className="w-44 h-44 rounded-full bg-teal-50 dark:bg-teal-950/60 border-4 border-white dark:border-slate-800 shadow-md flex items-center justify-center mb-6 overflow-hidden">
                <Stethoscope className="w-16 h-16 text-teal-600 dark:text-teal-400" />
              </div>

              {doctor.profile?.isVerified && (
                <div className="flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800 mb-6">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Medical Council Verified
                </div>
              )}

              <Link
                href={`/${locale}/appointments/book`}
                className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-center py-3.5 px-4 rounded-xl font-bold transition focus-ring shadow-medical-teal flex items-center justify-center gap-2 text-sm"
              >
                <CalendarCheck className="w-4 h-4" />
                Book Consultation
              </Link>
            </SlideIn>
            
            {/* Detailed Credentials Side */}
            <div className="md:col-span-2 p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <FadeUp>
                  <div className="mb-6">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">{doctor.name}</h2>
                    <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-semibold mb-1">{qualifications}</p>
                    <p className="text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider text-xs">{specialisation}</p>
                  </div>
                </FadeUp>
                
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                  <StaggerItem>
                    <div className="flex gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <GraduationCap className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Experience</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-xs">{experience || "Accredited specialist."}</p>
                      </div>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="flex gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <Award className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Registration ID</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-xs font-mono">{registration || "TNMC Verified"}</p>
                      </div>
                    </div>
                  </StaggerItem>
                </StaggerContainer>

                <FadeUp delay={0.1}>
                  <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Clinical Biography & Special Interests
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {bio || "Specialist in microscopic neurosurgery, complex spine fixations, minimally invasive disc surgeries, endoscopic skull base procedures, and emergency neurotrauma management."}
                    </p>
                  </div>
                </FadeUp>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-teal-600" /> Full-Time Consultant</span>
                <span>Subison Neuro Centre</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
