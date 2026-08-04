"use server";

import { validateContactInput, verifySpamProtection, checkContactRateLimit, createPatientEnquiry } from "@/lib/contact";
import { prisma } from "@/lib/prisma";

export async function submitContactForm(formData: FormData) {
  try {
    // 1. Validate Input
    const rawData = Object.fromEntries(formData.entries());
    const validated = validateContactInput({
      ...rawData,
      consent: rawData.consent === "on" || rawData.consent === "true" ? true : undefined,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, mobileNumber, email, enquiryType, message, preferredContact, _company, turnstileToken } = validated.data;

    // 2. IP Rate Limiting Check
    const rateLimit = await checkContactRateLimit();
    if (!rateLimit.success) {
      return { success: false, error: rateLimit.error };
    }

    // 3. Spam Protection (Honeypot & Turnstile)
    const spamCheck = await verifySpamProtection(_company, turnstileToken);
    if (!spamCheck.success) {
      if (spamCheck.error === "Invalid submission") {
        // Honeypot tripped, silently reject
        return { success: true, message: "Thank you. Your message has been sent." };
      }
      return { success: false, error: spamCheck.error };
    }

    // 4. Check duplicate mobile submissions in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const duplicate = await prisma.patientEnquiry.findFirst({
      where: {
        mobileNumber,
        createdAt: { gte: oneHourAgo }
      }
    });

    if (duplicate) {
      return { success: false, error: "An enquiry from this mobile number was recently submitted." };
    }

    // 5. Database Insertion
    const dbRes = await createPatientEnquiry({
      name, mobileNumber, email, enquiryType, message, preferredContact, consent: true
    });

    if (!dbRes.success) {
      return { success: false, error: dbRes.error };
    }

    return { success: true, message: "Thank you. Your enquiry has been received successfully." };

  } catch (error) {
    console.error("Form submission error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
