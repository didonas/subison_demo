import { AlertTriangle, ArrowLeft, PhoneCall } from "lucide-react";
import Link from "next/link";

export default async function NotFoundPage() {
  // We don't have access to params dynamically in not-found, 
  // so we may just fall back to English if we can't reliably detect it. 
  // Wait, Next-intl uses a special trick for not-found if configured in i18n routing.
  // Actually, we can just use static generic text or attempt to use next-intl translations if available.
  
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white p-12 rounded-3xl border border-gray-100 shadow-sm">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Page Not Found</h1>
        <p className="text-xl text-slate-600 mb-8">
          The medical information or page you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
          >
            <ArrowLeft size={20} />
            Return to Homepage
          </Link>
          <Link
            href="/en/contact"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <PhoneCall size={20} />
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
