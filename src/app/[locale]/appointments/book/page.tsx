import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/booking/BookingForm";

export const metadata = {
  title: "Book an Appointment",
  description: "Request an appointment with our specialists at Subison Neuro Centre.",
  robots: { index: false, follow: false },
};

export default async function AppointmentBookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const doctors = await prisma.doctor.findMany({
    include: { department: true }
  });

  const specialitiesRaw = await prisma.speciality.findMany({
    where: { status: "PUBLISHED" },
    include: { translations: true },
    orderBy: { displayOrder: "asc" }
  });

  const specialities = specialitiesRaw.map((s) => ({
    id: s.id,
    titleEn: s.translations.find((t) => t.locale === "en")?.title || s.slug,
  }));

  return (
    <div className="min-h-screen py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full inline-block mb-3">
            Online Consultation Booking
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">Request an Appointment</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Fill out the form below to request an in-person clinical consultation. Our hospital care coordinator will confirm your slot.
          </p>
        </div>

        <BookingForm 
          doctors={doctors}
          specialities={specialities}
          locale={locale}
          feeSettings={{
            hasFee: true,
            amount: 200
          }}
        />
      </div>
    </div>
  );
}
