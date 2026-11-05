"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Menu, X, Globe, Phone, CalendarCheck, ChevronDown, BookOpen, MessageSquare, HelpCircle, Image as ImageIcon, Video, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderClientProps {
  hospitalName: string;
  phone: string;
  locale: string;
}

export function HeaderClient({ hospitalName, phone, locale }: HeaderClientProps) {
  const t = useTranslations("Navigation");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle mobile menu body scroll lock and escape key
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          buttonRef.current?.focus();
        }
        setIsMoreDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle language switch using next-intl
  const switchLocale = (newLocale: string) => {
    const qs = searchParams.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    router.replace(href as Parameters<typeof router.replace>[0], { locale: newLocale });
  };

  const mainNavLinks = [
    { href: `/`, label: t("home"), priority: "all" },
    { href: `/about`, label: t("about"), priority: "all" },
    { href: `/doctor`, label: t("doctor"), priority: "all" },
    { href: `/specialities`, label: t("specialities"), priority: "all" },
    { href: `/treatments`, label: t("treatments"), priority: "all" },
    { href: `/facilities`, label: t("facilities"), priority: "2xl" },
    { href: `/contact`, label: t("contact"), priority: "2xl" },
  ];

  const moreLinks = [
    { href: `/facilities`, label: t("facilities"), icon: Building2, showOnlyBelow2xl: true },
    { href: `/contact`, label: t("contact"), icon: Phone, showOnlyBelow2xl: true },
    { href: `/patient-resources`, label: t("patientResources"), icon: BookOpen },
    { href: `/testimonials`, label: t("testimonials"), icon: MessageSquare },
    { href: `/faqs`, label: t("faqs"), icon: HelpCircle },
    { href: `/gallery`, label: t("gallery"), icon: ImageIcon },
    { href: `/videos`, label: t("videos"), icon: Video },
  ];

  return (
    <>
      <header
        className={`sticky top-0 w-full z-40 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-elevation-sm border-b border-slate-200/80 dark:border-slate-800 py-2.5" 
            : "bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 py-3.5"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          {/* Desktop Grid Layout: grid-cols-[minmax(210px,260px)_minmax(0,1fr)_auto] */}
          <div className="grid grid-cols-[minmax(210px,260px)_minmax(0,1fr)_auto] items-center gap-4">
            
            {/* 1. Brand Section */}
            <div className="flex shrink-0 items-center min-w-0">
              <Link href={`/`} className="flex items-center gap-3 focus-ring rounded-xl p-1 -m-1 max-w-[260px] min-w-0">
                <div className="w-10 h-10 bg-teal-600 dark:bg-teal-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-lg">
                  <span>H</span>
                </div>
                <div className="min-w-0 overflow-hidden">
                  <span className="font-bold text-base xl:text-lg text-slate-900 dark:text-white leading-tight block whitespace-nowrap truncate">
                    {hospitalName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap truncate hidden 2xl:block">
                    {t("subtitle")}
                  </span>
                </div>
              </Link>
            </div>

            {/* 2. Desktop Navigation (Shown at 1280px and above) */}
            <nav className="hidden xl:flex min-w-0 items-center justify-center gap-2 xl:gap-3 2xl:gap-5 overflow-visible">
              {mainNavLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== `/` && pathname.startsWith(link.href));
                const is2xlOnly = link.priority === "2xl";
                return (
                  <Link
                    key={link.href}
                    href={link.href as Parameters<typeof Link>[0]["href"]}
                    className={`shrink-0 whitespace-nowrap text-sm 2xl:text-base font-semibold px-2.5 py-1.5 2xl:px-3.5 2xl:py-2 rounded-xl transition-colors focus-ring leading-none ${
                      is2xlOnly ? "hidden 2xl:inline-flex" : "inline-flex"
                    } ${
                      isActive 
                        ? "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60" 
                        : "text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* More dropdown */}
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                  className="shrink-0 whitespace-nowrap text-sm 2xl:text-base font-semibold px-2.5 py-1.5 2xl:px-3.5 2xl:py-2 rounded-xl transition-colors focus-ring text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-900 inline-flex items-center gap-1 leading-none"
                  aria-expanded={isMoreDropdownOpen}
                >
                  {t("more")} <ChevronDown className={`w-3.5 h-3.5 2xl:w-4 2xl:h-4 transition-transform duration-200 ${isMoreDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isMoreDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-elevation-md border border-slate-200/80 dark:border-slate-800 p-2 z-50"
                    >
                      {moreLinks.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href as Parameters<typeof Link>[0]["href"]}
                            onClick={() => setIsMoreDropdownOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                              item.showOnlyBelow2xl ? "2xl:hidden" : ""
                            } ${
                              isActive 
                                ? "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 font-semibold" 
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* 3. Actions & Controls (Non-shrinking group) */}
            <div className="flex shrink-0 items-center justify-end gap-2.5 xl:gap-3">
              {/* Language Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-full p-1 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                <button
                  type="button"
                  onClick={() => switchLocale("en")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all focus-ring ${
                    locale === "en" ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => switchLocale("ta")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all focus-ring ${
                    locale === "ta" ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  தமிழ்
                </button>
              </div>

              {/* Quick Actions (Desktop) */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                    className="hidden 2xl:flex p-2 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus-ring shrink-0"
                    aria-label={t("callHospital")}
                    title={t("callHospital")}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                <Link
                  href={`/appointments/book`}
                  className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-3.5 py-2 xl:px-4 xl:py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 xl:gap-2 transition focus-ring shadow-medical-teal whitespace-nowrap shrink-0"
                >
                  <CalendarCheck className="w-4 h-4 shrink-0" />
                  <span>{t("bookAppt")}</span>
                </Link>
              </div>

              {/* Mobile Menu Toggle (Below 1280px) */}
              <button
                ref={buttonRef}
                className="xl:hidden p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl focus-ring shrink-0"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay (Below 1280px) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-[65px] z-30 bg-white dark:bg-slate-950 xl:hidden overflow-y-auto border-t border-slate-200 dark:border-slate-800"
            ref={menuRef}
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-6 max-w-lg">
              {/* Mobile Lang Switcher */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400"/> {t("language")} / மொழி
                </span>
                <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 rounded-full p-1">
                  <button
                    onClick={() => { switchLocale("en"); setIsMobileMenuOpen(false); }}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${locale === "en" ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { switchLocale("ta"); setIsMobileMenuOpen(false); }}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${locale === "ta" ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    தமிழ்
                  </button>
                </div>
              </div>

              {/* Mobile Primary Nav Links */}
              <nav className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">{t("navigation")}</span>
                {mainNavLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== `/` && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href as Parameters<typeof Link>[0]["href"]}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-base font-semibold px-3.5 py-2.5 rounded-xl transition-colors ${
                        isActive 
                          ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400" 
                          : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mt-4 mb-1">{t("resourcesAndMedia")}</span>
                {moreLinks.filter(item => !item.showOnlyBelow2xl).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href as Parameters<typeof Link>[0]["href"]}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 text-base font-semibold px-3.5 py-2.5 rounded-xl transition-colors ${
                        isActive 
                          ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400" 
                          : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Actions */}
              <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Link
                  href={`/appointments/book`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white py-3.5 rounded-xl text-center font-bold text-base w-full flex justify-center items-center gap-2 shadow-medical-teal"
                >
                  <CalendarCheck className="w-5 h-5" /> {t("bookConsultation")}
                </Link>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-3.5 rounded-xl text-center font-bold text-base w-full flex justify-center items-center gap-2"
                  >
                    <Phone className="w-5 h-5" /> {t("callHospital")} ({phone})
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
