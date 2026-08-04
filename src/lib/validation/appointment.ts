import { z } from "zod";

export const appointmentSchema = z.object({
  patientName: z.string().min(2, "Name must be at least 2 characters").max(100),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Invalid 10-digit mobile number"),
  alternativeNumber: z.string().regex(/^[0-9]{10}$/, "Invalid 10-digit alternative number").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  ageGroup: z.enum(["0-18", "19-35", "36-50", "51-65", "65+"]).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  patientType: z.enum(["NEW", "RETURNING"]),
  preferredLanguage: z.enum(["EN", "TA"]),

  doctorId: z.string().uuid("Invalid doctor selection"),
  specialityId: z.string().uuid("Invalid speciality selection").optional().or(z.literal("")),
  
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  
  reasonForVisit: z.string().max(500, "Brief reason must be under 500 characters").optional(),
  
  privacyConsent: z.boolean().refine(val => val === true, {
    message: "You must accept the privacy policy",
  }),
  communicationConsent: z.boolean().refine(val => val === true, {
    message: "You must accept communication terms",
  }),

  turnstileToken: z.string().min(1, "Spam protection required")
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
