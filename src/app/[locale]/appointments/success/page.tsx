import { CheckCircle, Calendar, Home, Search } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SuccessTransition, FadeUp } from "@/components/ui/animations";

export default async function BookingSuccessPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  const { ref } = await searchParams;

  if (!ref) {
    return notFound();
  }

  const appointment = await prisma.appointment.findUnique({
    where: { bookingReference: ref },
    include: { doctor: { include: { department: true } } }
  });

  if (!appointment) {
    return notFound();
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-16 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-elevation-md text-center">
        <SuccessTransition className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 rounded-full flex items-center justify-center ring-8 ring-emerald-100 dark:ring-emerald-950/40">
            <CheckCircle className="text-emerald-600 dark:text-emerald-400 w-10 h-10" />
          </div>
        </SuccessTransition>
        
        <FadeUp>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">Request Submitted!</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
            Your appointment request has been recorded. It is currently <span className="font-bold text-amber-600 dark:text-amber-400">PENDING</span> confirmation from our reception care team.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-6 mb-8 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-slate-700/60 pb-3.5">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Booking Reference</span>
              <span className="font-mono font-bold text-sm sm:text-base text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-lg border border-teal-200 dark:border-teal-900">
                {appointment.bookingReference}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-slate-700/60 pb-3.5">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Patient Name</span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{appointment.patientName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-slate-700/60 pb-3.5">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Consultant Doctor</span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{appointment.doctor.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Date & Time</span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {appointment.appointmentDate.toLocaleDateString(locale, { dateStyle: "medium" })} at {appointment.startTime}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Please save your booking reference. You can use it to track status updates or request a reschedule. If provided, an SMS notification will also be dispatched.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <Link
              href={`/${locale}/appointments/track?ref=${appointment.bookingReference}&mobile=${appointment.mobileNumber}`}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-xl transition focus-ring shadow-medical-teal inline-flex justify-center items-center gap-2 text-sm"
            >
              <Search className="w-4 h-4" /> Track Appointment Status
            </Link>
            <Link
              href={`/${locale}`}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition focus-ring inline-flex justify-center items-center gap-2 text-sm"
            >
              <Home className="w-4 h-4" /> Return Home
            </Link>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
