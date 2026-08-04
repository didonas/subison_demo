import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingActionBar } from "@/components/layout/FloatingActionBar";
import { getSiteSettings } from "@/lib/settings";
import { Metadata } from "next";

import { ToastProvider } from "@/components/ui/toast-context";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as "en" | "ta")) {
    return {};
  }
  
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: `%s | ${t('title')}`,
      default: t('title'),
    },
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: siteUrl,
      siteName: t('title'),
      locale: locale,
      type: "website",
    },
    alternates: {
      canonical: '/',
      languages: {
        'en': '/en',
        'ta': '/ta',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as "en" | "ta")) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const settings = await getSiteSettings();

  return (
    <html lang={locale}>
      <head>
        {/* Force viewport to prevent zooming on mobile inputs */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <Header locale={locale} />
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <Footer locale={locale} />
            
            <FloatingActionBar 
              phone={settings.phone || undefined} 
              whatsapp={settings.whatsapp || undefined} 
              latitude={settings.latitude || undefined} 
              longitude={settings.longitude || undefined}
              locale={locale} 
            />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
