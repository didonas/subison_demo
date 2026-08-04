export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP";

export type NotificationEvent = 
  | "APPOINTMENT_REQUEST_RECEIVED"
  | "APPOINTMENT_REQUEST_ADMIN_ALERT"
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_RESCHEDULED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_REMINDER";

export interface NotificationMessage {
  to: string;
  subject?: string; // Primarily for email
  text: string;
  html?: string;
  event?: NotificationEvent;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  providerId?: string;
  error?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  send(message: NotificationMessage): Promise<NotificationResult>;
}
