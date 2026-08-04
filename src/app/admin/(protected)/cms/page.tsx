import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Stethoscope,
  Sparkles,
  Building2,
  UserCheck,
  MessageSquareQuote,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Settings,
  ExternalLink,
} from "lucide-react";

export default async function CmsOverviewPage() {
  // Load counts safely
  const [
    specialityCount,
    treatmentCount,
    facilityCount,
    doctorCount,
    testimonialPendingCount,
    articleCount,
    faqCount,
    mediaCount,
  ] = await Promise.all([
    prisma.speciality.count(),
    prisma.treatment.count(),
    prisma.facility.count(),
    prisma.doctor.count(),
    prisma.testimonial.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.article.count(),
    prisma.fAQ.count(),
    prisma.mediaAsset.count(),
  ]);

  const cards = [
    {
      title: "Specialities",
      count: specialityCount,
      description: "Medical departments, clinical scope & symptom guides",
      href: "/admin/cms/specialities",
      icon: Stethoscope,
      color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400",
    },
    {
      title: "Treatments",
      count: treatmentCount,
      description: "Procedures, surgical pathways & recovery timelines",
      href: "/admin/cms/treatments",
      icon: Sparkles,
      color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400",
    },
    {
      title: "Facilities & Tech",
      count: facilityCount,
      description: "ICU, diagnostics, neuro-navigation & equipment",
      href: "/admin/cms/facilities",
      icon: Building2,
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400",
    },
    {
      title: "Doctor Profiles",
      count: doctorCount,
      description: "Qualifications, registration, fee & clinical expertise",
      href: "/admin/cms/doctors",
      icon: UserCheck,
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
    },
    {
      title: "Testimonials",
      count: testimonialPendingCount,
      badge: testimonialPendingCount > 0 ? `${testimonialPendingCount} Pending Review` : "All Approved",
      badgeColor: testimonialPendingCount > 0 ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      description: "Patient experiences with consent compliance & review",
      href: "/admin/cms/testimonials",
      icon: MessageSquareQuote,
      color: "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-400",
    },
    {
      title: "Health Articles",
      count: articleCount,
      description: "Educational blog posts with medical disclaimers",
      href: "/admin/cms/articles",
      icon: FileText,
      color: "from-cyan-500/20 to-sky-500/20 border-cyan-500/30 text-cyan-400",
    },
    {
      title: "Patient FAQs",
      count: faqCount,
      description: "Bilingual categorized answers to common questions",
      href: "/admin/cms/faqs",
      icon: HelpCircle,
      color: "from-violet-500/20 to-indigo-500/20 border-violet-500/30 text-violet-400",
    },
    {
      title: "Media & Gallery",
      count: mediaCount,
      description: "Validated image assets with bilingual alt-text",
      href: "/admin/cms/gallery",
      icon: ImageIcon,
      color: "from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-400",
    },
    {
      title: "Site Settings & SEO",
      count: "Global",
      description: "Hospital identity, phone numbers, emergency banner & SEO",
      href: "/admin/cms/site-settings",
      icon: Settings,
      color: "from-slate-500/20 to-zinc-500/20 border-slate-500/30 text-slate-300",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Content Management System</h1>
          <p className="text-sm text-slate-400 mt-1">
            Bilingual (English & Tamil) content publishing, medical compliance and media management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/en"
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Site
          </Link>
        </div>
      </div>

      {/* Grid of CMS Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} border flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{card.count}</span>
                    {card.badge && (
                      <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                        {card.badge}
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="text-base font-semibold text-white group-hover:text-indigo-300 transition">
                  {card.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-indigo-400 transition">
                <span>Manage records</span>
                <span>&rarr;</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
