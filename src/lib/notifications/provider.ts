import { NotificationMessage, NotificationResult, NotificationProvider } from "./types";
import { ResendProvider } from "./resend";

class NotificationFactory {
  getProvider(channel: "EMAIL" | "SMS" | "WHATSAPP"): NotificationProvider {
    switch (channel) {
      case "EMAIL":
        return new ResendProvider();
      case "SMS":
      case "WHATSAPP":
        return {
          channel,
          send: async (msg: NotificationMessage): Promise<NotificationResult> => {
            console.log(`[STUB] Sending ${channel} to ${msg.to}: ${msg.text}`);
            return { success: true, providerId: `stub_${Date.now()}` };
          }
        };
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }
}

export const notificationFactory = new NotificationFactory();
