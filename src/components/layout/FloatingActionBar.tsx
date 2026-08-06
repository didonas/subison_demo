"use client";

import { Phone, MessageCircle, MapPin, CalendarPlus } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface FloatingActionBarProps {
  phone?: string;
  whatsapp?: string;
  latitude?: string;
  longitude?: string;
  locale: string;
}

export function FloatingActionBar({ phone, whatsapp, latitude, longitude, locale }: FloatingActionBarProps) {
  const t = useTranslations("FloatingActionBar");
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when user scrolls past 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Do not render inside admin
  if (pathname.includes("/admin")) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <div 
      className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full border border-gray-100 flex items-center justify-center p-1.5 gap-1.5 backdrop-blur-md bg-white/90">
        
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex flex-col items-center justify-center w-[4.5rem] h-14 rounded-full text-white bg-blue-600 hover:opacity-90 active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
            aria-label={t("call")}
          >
            <Phone className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t("call")}</span>
          </a>
        )}

        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, I would like to book an appointment.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center w-[4.5rem] h-14 rounded-full text-white bg-green-500 hover:opacity-90 active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            aria-label={t("whatsapp")}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t("whatsapp")}</span>
          </a>
        )}

        {latitude && longitude && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center w-[4.5rem] h-14 rounded-full text-white bg-indigo-600 hover:opacity-90 active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
            aria-label={t("directions")}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t("directions")}</span>
          </a>
        )}

        <Link
          href={`/${locale}/appointments/book`}
          className="flex flex-col items-center justify-center w-[4.5rem] h-14 rounded-full text-white bg-red-600 hover:opacity-90 active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
          aria-label={t("book")}
        >
          <CalendarPlus className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">{t("book")}</span>
        </Link>
      </div>
    </div>
  );
}
