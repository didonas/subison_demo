"use client";

import { useState, useRef } from "react";
import { submitContactForm } from "@/app/[locale]/contact/actions";
import { Turnstile } from "@marsidev/react-turnstile";
import { Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { SuccessTransition } from "@/components/ui/animations";
import { useToast } from "@/components/ui/toast-context";

export function ContactForm({ siteKey }: { siteKey: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    
    setStatus("submitting");
    setMessage("");

    const formData = new FormData(formRef.current);
    
    const result = await submitContactForm(formData);
    
    if (result.success) {
      setStatus("success");
      setMessage(result.message || "Your message has been sent successfully. Our care team will respond shortly.");
      showSuccessToast("Enquiry submitted successfully!", "Our care team will contact you soon.");
      formRef.current.reset();
    } else {
      setStatus("error");
      setMessage(result.error || "An error occurred while submitting your enquiry.");
      showErrorToast("Submission Failed", result.error || "Failed to submit enquiry. Please check your inputs.");
    }
  }

  if (status === "success") {
    return (
      <SuccessTransition className="bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 p-8 sm:p-10 rounded-3xl flex flex-col items-center text-center border border-emerald-200 dark:border-emerald-900/60 shadow-elevation-sm">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-950/50">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Message Received</h3>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md">{message}</p>
        <button 
          onClick={() => setStatus("idle")} 
          className="mt-6 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-semibold transition focus-ring text-sm"
        >
          Send Another Message
        </button>
      </SuccessTransition>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl shadow-elevation-sm border border-slate-200/80 dark:border-slate-800 flex flex-col gap-6">
      
      {status === "error" && (
        <div className="bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 p-4 rounded-2xl flex items-start gap-3 border border-red-200 dark:border-red-900/50 text-sm" role="alert">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="font-medium">{message}</p>
        </div>
      )}

      {/* Honeypot field (hidden from screen readers and visual layout) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="_company">Company</label>
        <input type="text" id="_company" name="_company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
          <input required minLength={2} maxLength={100} type="text" id="name" name="name" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring text-sm" placeholder="e.g. Priya Sundaram" />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mobileNumber" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile Number *</label>
          <input required minLength={10} maxLength={15} type="tel" id="mobileNumber" name="mobileNumber" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring text-sm" placeholder="e.g. 9876543210" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address (Optional)</label>
          <input type="email" id="email" name="email" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring text-sm" placeholder="priya@example.com" />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="enquiryType" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Enquiry Nature *</label>
          <select required id="enquiryType" name="enquiryType" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring text-sm">
            <option value="GENERAL">General Clinical Enquiry</option>
            <option value="APPOINTMENT">Appointment Information</option>
            <option value="MEDICAL">Medical Condition Guidance</option>
            <option value="FEEDBACK">Patient Feedback</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Your Message *</label>
        <textarea required minLength={10} maxLength={2000} id="message" name="message" rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring text-sm resize-none" placeholder="Please describe how we can assist you with your neurological care enquiry..."></textarea>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="preferredContact" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Preferred Contact Channel</label>
        <select id="preferredContact" name="preferredContact" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring text-sm">
          <option value="PHONE">Direct Phone Call</option>
          <option value="WHATSAPP">WhatsApp Message</option>
          <option value="EMAIL">Email Message</option>
        </select>
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <input required type="checkbox" id="consent" name="consent" className="mt-1 w-4 h-4 text-teal-600 rounded focus-ring" />
        <label htmlFor="consent" className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer">
          I consent to Subison Neuro Centre collecting and storing my details strictly to process and respond to this enquiry as per the hospital privacy policy.
        </label>
      </div>

      <div className="flex justify-center py-1">
        <Turnstile siteKey={siteKey} options={{ size: "normal" }} />
      </div>

      <button 
        type="submit" 
        disabled={status === "submitting"}
        className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white py-3.5 rounded-xl font-bold text-base transition focus-ring shadow-medical-teal disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Sending Message...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Submit Clinical Enquiry
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Protected by Turnstile. Cloudflare Privacy Policy and Terms apply.
      </p>
    </form>
  );
}
