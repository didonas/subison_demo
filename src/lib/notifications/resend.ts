import { Resend } from "resend";
import { NotificationMessage, NotificationResult, NotificationProvider } from "./types";
import { env } from "@/lib/env";

export class ResendProvider implements NotificationProvider {
  channel = "EMAIL" as const;
  private resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY && env.EMAIL_NOTIFICATIONS_ENABLED) {
      this.resend = new Resend(env.RESEND_API_KEY);
    }
  }

  async send(message: NotificationMessage): Promise<NotificationResult> {
    if (!this.resend) {
      console.warn(`[ResendProvider] Skipping email to ${message.to} (RESEND_API_KEY missing or notifications disabled).`);
      return { success: false, error: "Email provider not configured." };
    }

    if (!env.RESEND_FROM_EMAIL) {
        return { success: false, error: "RESEND_FROM_EMAIL is not configured." };
    }

    try {
      const response = await this.resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: message.to,
        subject: message.subject || "Notification from Subison Neuro Centre",
        text: message.text,
        html: message.html,
      });

      if (response.error) {
        console.error("[ResendProvider] Error sending email:", response.error);
        return { success: false, error: response.error.message };
      }

      return { success: true, providerId: response.data?.id };
    } catch (error: unknown) {
      console.error("[ResendProvider] Exception sending email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error sending email" };
    }
  }
}
