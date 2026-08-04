import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  mobileNumber: z.string().regex(/^[0-9+\-\s()]{10,15}$/, "Invalid mobile number"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  enquiryType: z.enum(["GENERAL", "APPOINTMENT", "MEDICAL", "FEEDBACK"]),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000),
  preferredContact: z.enum(["PHONE", "EMAIL", "WHATSAPP"]).optional(),
  consent: z.boolean().refine(val => val === true, { message: "You must agree to the privacy policy" }),
  _company: z.string().optional(),
  turnstileToken: z.string().min(1, "Verification required"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export function validateContactInput(data: unknown) {
  return contactSchema.safeParse(data);
}

export async function verifySpamProtection(honeypot?: string, token?: string) {
  // Honeypot check
  if (honeypot && honeypot.length > 0) {
    return { success: false, error: "Invalid submission" };
  }

  // Turnstile check
  if (!token) {
    return { success: false, error: "Security token missing" };
  }

  if (env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === "1x00000000000000000000AA") {
    // Testing environment
    if (token === "1x00000000000000000000AA") return { success: true };
    if (token === "2x00000000000000000000AB") return { success: false, error: "Invalid token" };
    // For manual local tests, we might allow other test tokens to succeed if not specifically the reject token.
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", env.TURNSTILE_SECRET_KEY);
    formData.append("response", token);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) {
      return { success: false, error: "Security check failed. Please try again." };
    }

    const data = await res.json();
    if (!data.success) {
      return { success: false, error: "Security verification failed" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Security service unavailable" };
  }
}

export async function checkContactRateLimit() {
  return await checkRateLimit("contact_enquiry", 5, 15, { keyType: "ip" });
}

export async function createPatientEnquiry(data: Omit<ContactInput, "_company" | "turnstileToken" | "consent"> & { consent: boolean }) {
  try {
    await prisma.patientEnquiry.create({
      data: {
        name: data.name,
        mobileNumber: data.mobileNumber,
        email: data.email || null,
        enquiryType: data.enquiryType,
        message: data.message,
        preferredContact: data.preferredContact,
        consent: data.consent,
        status: "UNREAD"
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Database error saving enquiry:", error);
    return { success: false, error: "Failed to save enquiry" };
  }
}
