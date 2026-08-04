"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema, AppointmentFormData } from "@/lib/validation/appointment";
import { getAvailableDatesAction, getAvailableSlotsAction, submitAppointmentForm } from "@/app/[locale]/appointments/book/actions";
import { Turnstile } from "@marsidev/react-turnstile";
import { useRouter } from "next/navigation";
import { env } from "@/lib/env";
import { SkeletonSlotGrid } from "@/components/ui/skeleton";
import { Check, User, Calendar as CalendarIcon, Clock, FileText, ShieldCheck, ChevronRight, ChevronLeft, Loader2, AlertCircle } from "lucide-react";

interface DoctorOption {
  id: string;
  name: string;
  specialisation: string;
}

interface SpecialityOption {
  id: string;
  titleEn: string;
}

interface FeeSettings {
  hasFee: boolean;
  amount: number;
}

interface BookingFormProps {
  doctors: DoctorOption[];
  specialities: SpecialityOption[];
  locale: string;
  feeSettings: FeeSettings;
}

const STEPS = [
  { id: 1, name: "Doctor", icon: User },
  { id: 2, name: "Schedule", icon: CalendarIcon },
  { id: 3, name: "Details", icon: FileText },
  { id: 4, name: "Consent", icon: ShieldCheck },
  { id: 5, name: "Review", icon: Check },
];

export function BookingForm({ doctors, specialities, locale, feeSettings }: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      preferredLanguage: "EN",
      patientType: "NEW",
      privacyConsent: false,
      communicationConsent: false,
    }
  });

  const selectedDoctor = useWatch({ control: form.control, name: "doctorId" });
  const selectedDate = useWatch({ control: form.control, name: "appointmentDate" });
  const selectedStartTime = useWatch({ control: form.control, name: "startTime" });

  useEffect(() => {
    let isCancelled = false;
    if (selectedDoctor) {
      form.setValue("appointmentDate", "");
      form.setValue("startTime", "");
      
      const fetchDates = async () => {
        setIsLoadingDates(true);
        try {
          const dates = await getAvailableDatesAction(selectedDoctor);
          if (!isCancelled) {
            setAvailableDates(dates);
          }
        } catch {
          if (!isCancelled) {
            setAvailableDates([]);
          }
        } finally {
          if (!isCancelled) {
            setIsLoadingDates(false);
          }
        }
      };

      fetchDates();
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedDoctor, form]);

  useEffect(() => {
    let isCancelled = false;
    if (selectedDoctor && selectedDate) {
      form.setValue("startTime", "");

      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        try {
          const slots = await getAvailableSlotsAction(selectedDoctor, selectedDate);
          if (!isCancelled) {
            setAvailableSlots(slots);
          }
        } catch {
          if (!isCancelled) {
            setAvailableSlots([]);
          }
        } finally {
          if (!isCancelled) {
            setIsLoadingSlots(false);
          }
        }
      };

      fetchSlots();
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedDoctor, selectedDate, form]);

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    setServerError("");
    const result = await submitAppointmentForm(data);
    
    if (result.success) {
      router.push(`/${locale}/appointments/success?ref=${result.bookingReference}`);
    } else {
      setServerError(result.error || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await form.trigger(["doctorId", "specialityId"]);
    if (step === 2) isValid = await form.trigger(["appointmentDate", "startTime"]);
    if (step === 3) isValid = await form.trigger(["patientName", "mobileNumber", "alternativeNumber", "email", "ageGroup", "gender", "patientType", "preferredLanguage", "reasonForVisit"]);
    if (step === 4) isValid = await form.trigger(["privacyConsent", "communicationConsent"]);
    
    if (isValid) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 100, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((s) => s - 1);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-elevation-sm border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10">
      {/* Visual Step Indicator */}
      <div className="mb-8 sm:mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-teal-600 dark:bg-teal-400 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((s) => {
            const isDone = step > s.id;
            const isCurrent = step === s.id;
            const StepIcon = s.icon;

            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (s.id < step) setStep(s.id);
                  }}
                  disabled={s.id > step}
                  aria-label={`Step ${s.id}: ${s.name}`}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all focus-ring ${
                    isDone
                      ? "bg-teal-600 text-white shadow-sm hover:bg-teal-700"
                      : isCurrent
                      ? "bg-slate-900 dark:bg-teal-500 text-white ring-4 ring-teal-100 dark:ring-teal-950/80 shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                <span className={`text-xs mt-2 hidden sm:block font-medium ${isCurrent ? "text-slate-900 dark:text-white font-semibold" : "text-slate-500 dark:text-slate-400"}`}>
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 p-4 rounded-2xl mb-6 text-sm border border-red-200 dark:border-red-900/50 flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <div>{serverError}</div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Step 1: Choose Your Consultant</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Select the specialist doctor you wish to consult with.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Consultant Doctor *</label>
              <select {...form.register("doctorId")} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring">
                <option value="">Select a Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialisation})</option>
                ))}
              </select>
              {form.formState.errors.doctorId && <p className="text-red-500 text-xs mt-1.5">{form.formState.errors.doctorId.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Clinical Speciality (Optional)</label>
              <select {...form.register("specialityId")} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring">
                <option value="">Select Speciality (Optional)</option>
                {specialities.map((s) => (
                  <option key={s.id} value={s.id}>{s.titleEn}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Step 2: Select Date & Time</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Choose an available consultation date and slot.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Available Dates *</label>
              {isLoadingDates ? (
                <SkeletonSlotGrid />
              ) : availableDates.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                  No upcoming dates available for this doctor currently. Please contact the clinic for urgent requests.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {availableDates.map(date => {
                    const isSelected = selectedDate === date;
                    const dateObj = new Date(date);
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => form.setValue("appointmentDate", date)}
                        className={`p-3 rounded-xl border text-left transition-all focus-ring ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-200 dark:ring-teal-900"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-500 card-hover"
                        }`}
                      >
                        <div className="text-xs font-semibold uppercase opacity-75">
                          {dateObj.toLocaleDateString(locale, { weekday: "short" })}
                        </div>
                        <div className="text-sm font-bold mt-0.5">
                          {dateObj.toLocaleDateString(locale, { month: "short", day: "numeric" })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <input type="hidden" {...form.register("appointmentDate")} />
              {form.formState.errors.appointmentDate && <p className="text-red-500 text-xs mt-1.5">{form.formState.errors.appointmentDate.message}</p>}
            </div>

            {selectedDate && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Available Time Slots *</label>
                {isLoadingSlots ? (
                  <SkeletonSlotGrid />
                ) : availableSlots.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                    All slots are booked for this date. Please select another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {availableSlots.map(time => {
                      const isSelected = selectedStartTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => form.setValue("startTime", time)}
                          className={`p-2.5 rounded-xl border text-center text-sm font-medium transition-all focus-ring flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? "bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-200 dark:ring-teal-900 font-bold"
                              : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-500 card-hover"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
                <input type="hidden" {...form.register("startTime")} />
                {form.formState.errors.startTime && <p className="text-red-500 text-xs mt-1.5">{form.formState.errors.startTime.message}</p>}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Step 3: Patient Information</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Provide contact details for the consultation.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                <input {...form.register("patientName")} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring" placeholder="e.g. Ananth Raman" />
                {form.formState.errors.patientName && <p className="text-red-500 text-xs mt-1.5">{form.formState.errors.patientName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mobile Number *</label>
                <input {...form.register("mobileNumber")} type="tel" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring" placeholder="e.g. 9876543210" />
                {form.formState.errors.mobileNumber && <p className="text-red-500 text-xs mt-1.5">{form.formState.errors.mobileNumber.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email (Optional)</label>
                <input {...form.register("email")} type="email" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring" placeholder="patient@example.com" />
                {form.formState.errors.email && <p className="text-red-500 text-xs mt-1.5">{form.formState.errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Alternative Contact (Optional)</label>
                <input {...form.register("alternativeNumber")} type="tel" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring" placeholder="e.g. 9444123456" />
                {form.formState.errors.alternativeNumber && <p className="text-red-500 text-xs mt-1.5">{form.formState.errors.alternativeNumber.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Age Group</label>
                <select {...form.register("ageGroup")} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring">
                  <option value="">Select Age</option>
                  <option value="0-18">0-18 Years</option>
                  <option value="19-35">19-35 Years</option>
                  <option value="36-50">36-50 Years</option>
                  <option value="51-65">51-65 Years</option>
                  <option value="65+">65+ Years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
                <select {...form.register("gender")} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring">
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Brief Reason for Visit (Optional)</label>
              <textarea {...form.register("reasonForVisit")} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus-ring" rows={3} placeholder="Please summarize your symptoms (e.g., headache for 2 weeks, tremors, etc.)" />
              {form.formState.errors.reasonForVisit && <p className="text-red-500 text-xs mt-1.5">{form.formState.errors.reasonForVisit.message}</p>}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Step 4: Clinical Consent & Terms</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Please confirm patient privacy and communication consents.</p>
            </div>
            
            <div className="flex items-start gap-3.5 p-4 sm:p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <input type="checkbox" id="privacyConsent" {...form.register("privacyConsent")} className="mt-1 w-4 h-4 rounded text-teal-600 focus-ring" />
              <div>
                <label htmlFor="privacyConsent" className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer">Privacy & Health Data Consent *</label>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">I consent to the collection and processing of my health information strictly for clinical care in accordance with the hospital privacy policy.</p>
                {form.formState.errors.privacyConsent && <p className="text-red-500 text-xs mt-1">{form.formState.errors.privacyConsent.message}</p>}
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 sm:p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <input type="checkbox" id="communicationConsent" {...form.register("communicationConsent")} className="mt-1 w-4 h-4 rounded text-teal-600 focus-ring" />
              <div>
                <label htmlFor="communicationConsent" className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer">Appointment Communication Consent *</label>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">I agree to receive SMS, WhatsApp, and email communications regarding my appointment status, schedule changes, and reminders.</p>
                {form.formState.errors.communicationConsent && <p className="text-red-500 text-xs mt-1">{form.formState.errors.communicationConsent.message}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Step 5: Review & Confirm Request</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Please verify your appointment details prior to submission.</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl space-y-3.5 text-sm">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <span className="text-slate-500 dark:text-slate-400">Patient Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{form.getValues("patientName")}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <span className="text-slate-500 dark:text-slate-400">Mobile Number:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{form.getValues("mobileNumber")}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <span className="text-slate-500 dark:text-slate-400">Appointment Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{form.getValues("appointmentDate")}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <span className="text-slate-500 dark:text-slate-400">Slot Time:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{form.getValues("startTime")}</span>
              </div>
              
              {feeSettings.hasFee && (
                <div className="mt-4 p-4 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 rounded-xl border border-teal-200 dark:border-teal-900/60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Estimated Consultation Fee:</span>
                    <span className="font-bold text-base">₹{feeSettings.amount}</span>
                  </div>
                  <p className="text-xs text-teal-800 dark:text-teal-300 mt-1.5 leading-relaxed">
                    Submitting this form sends an appointment request. Your appointment is pending until confirmed by hospital staff. The consultation fee is payable directly at the hospital reception.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center py-2">
              <Turnstile 
                siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => form.setValue("turnstileToken", token)}
              />
            </div>
            {form.formState.errors.turnstileToken && <p className="text-red-500 text-xs text-center">{form.formState.errors.turnstileToken.message}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition focus-ring"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          
          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-sm font-semibold transition focus-ring shadow-sm"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-sm font-bold transition focus-ring shadow-medical-teal disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Submit Appointment Request
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
