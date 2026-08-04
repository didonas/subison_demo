import { getSiteSettings } from "@/lib/settings";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Globe } from "lucide-react";

interface FooterProps {
  locale: string;
}

export async function Footer({ locale }: FooterProps) {
  const settings = await getSiteSettings();
  
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-200 pt-16 pb-10 border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 mb-12">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-bold text-lg">SNC</span>
              </div>
              <span className="font-bold text-xl text-white block">{settings.hospitalName}</span>
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Specialist neurosurgical consultations, minimally invasive spine surgery, stroke interventions, and dedicated neuro-rehabilitation.
            </p>
            <div className="flex gap-3">
              {settings.socialLinks?.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-colors focus-ring" aria-label="Facebook">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks?.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-colors focus-ring" aria-label="Instagram">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks?.twitter && (
                <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-colors focus-ring" aria-label="Twitter">
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 mb-5">Clinical Services</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><Link href={`/${locale}/about`} className="text-slate-400 hover:text-white transition-colors">About the Centre</Link></li>
              <li><Link href={`/${locale}/doctor`} className="text-slate-400 hover:text-white transition-colors">Consultant Neurosurgeon</Link></li>
              <li><Link href={`/${locale}/specialities`} className="text-slate-400 hover:text-white transition-colors">Specialities & Care</Link></li>
              <li><Link href={`/${locale}/treatments`} className="text-slate-400 hover:text-white transition-colors">Surgical Procedures</Link></li>
              <li><Link href={`/${locale}/facilities`} className="text-slate-400 hover:text-white transition-colors">Hospital Infrastructure</Link></li>
              <li><Link href={`/${locale}/patient-resources`} className="text-slate-400 hover:text-white transition-colors">Patient Guidance Library</Link></li>
              <li><Link href={`/${locale}/testimonials`} className="text-slate-400 hover:text-white transition-colors">Patient Testimonials</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 mb-5">Hospital Location</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-3 text-slate-400">
                <MapPin className="w-5 h-5 shrink-0 text-teal-400 mt-0.5" />
                <span className="text-sm leading-relaxed">{settings.address}</span>
              </li>
              {settings.phone && (
                <li className="flex items-center gap-3 text-slate-400">
                  <Phone className="w-5 h-5 shrink-0 text-teal-400" />
                  <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="text-sm hover:text-white transition-colors font-medium">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li className="flex items-center gap-3 text-slate-400">
                  <Mail className="w-5 h-5 shrink-0 text-teal-400" />
                  <a href={`mailto:${settings.email}`} className="text-sm hover:text-white transition-colors">
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Timings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 mb-5">OPD Timings</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-3 text-slate-400">
                <Clock className="w-5 h-5 shrink-0 text-teal-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Outpatient Clinic</p>
                  <p className="text-sm text-slate-400 whitespace-pre-line leading-relaxed">{settings.consultationHours}</p>
                </div>
              </li>
              <li className="mt-2 bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl">
                <p className="text-xs text-slate-400 font-medium mb-1">Standard Consultation Fee</p>
                <p className="font-bold text-lg text-teal-400">{settings.appointmentFee}</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {currentYear} {settings.hospitalName}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href={`/${locale}/faqs`} className="hover:text-slate-400 transition-colors">FAQs</Link>
            <Link href={`/${locale}/privacy`} className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
            <Link href={`/${locale}/terms`} className="hover:text-slate-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
