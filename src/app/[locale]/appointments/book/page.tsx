import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/booking/BookingForm";
import { getTranslations } from "next-intl/server";

export default async function AppointmentBookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AppointmentsPage" });

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
            {t("badge")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">{t("title")}</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            {t("subtitle")}
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
