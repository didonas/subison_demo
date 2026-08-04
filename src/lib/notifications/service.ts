import "server-only";
import { notificationFactory } from "./provider";
import { NotificationEvent, NotificationMessage, NotificationChannel } from "./types";
import { prisma } from "../prisma";

import { Prisma } from "@/generated/prisma/client";

export async function sendNotification(
  channel: NotificationChannel,
  event: NotificationEvent,
  message: NotificationMessage,
  dbTransaction?: Prisma.TransactionClient
) {
  const db = dbTransaction || prisma;

  // 1. Create the notification record in DB (Outbox pattern)
  const notificationRecord = await db.notification.create({
    data: {
      type: event,
      recipient: message.to,
      channel: channel,
      status: "PENDING",
    }
  });

  // 2. We send via the selected provider
  const provider = notificationFactory.getProvider(channel);
  
  try {
    const result = await provider.send({ ...message, event });

    if (result.success) {
      await prisma.notification.update({
        where: { id: notificationRecord.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          providerId: result.providerId || null
        }
      });
      return { success: true, id: notificationRecord.id, providerId: result.providerId };
    } else {
      // Record failure safely without throwing or rolling back external transactions
      const safeError = result.error ? result.error.replace(/[a-zA-Z0-9_\-]{20,}/g, "[REDACTED]") : "Provider failed";
      await prisma.notification.update({
        where: { id: notificationRecord.id },
        data: {
          status: "FAILED",
          failureReason: safeError
        }
      });
      return { success: false, error: safeError, id: notificationRecord.id };
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown notification error";
    const safeError = errorMessage.replace(/[a-zA-Z0-9_\-]{20,}/g, "[REDACTED]");
    await prisma.notification.update({
      where: { id: notificationRecord.id },
      data: {
        status: "FAILED",
        failureReason: safeError
      }
    });
    return { success: false, error: safeError, id: notificationRecord.id };
  }
}

export async function retryNotification(notificationId: string): Promise<{ success: boolean; error?: string; providerId?: string }> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification) {
    return { success: false, error: "Notification not found" };
  }

  // Idempotency: Do not re-send if already sent
  if (notification.status === "SENT") {
    return { success: true, providerId: notification.providerId || undefined };
  }

  const channel = notification.channel as NotificationChannel;
  const provider = notificationFactory.getProvider(channel);

  try {
    const result = await provider.send({
      to: notification.recipient,
      subject: `Notification: ${notification.type}`,
      text: `Update regarding your notification: ${notification.type}`,
      event: notification.type as NotificationEvent
    });

    if (result.success) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          providerId: result.providerId || null,
          failureReason: null
        }
      });
      return { success: true, providerId: result.providerId };
    } else {
      const safeError = result.error ? result.error.replace(/[a-zA-Z0-9_\-]{20,}/g, "[REDACTED]") : "Provider retry failed";
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "FAILED",
          failureReason: safeError
        }
      });
      return { success: false, error: safeError };
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Retry exception";
    const safeError = errorMessage.replace(/[a-zA-Z0-9_\-]{20,}/g, "[REDACTED]");
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: "FAILED",
        failureReason: safeError
      }
    });
    return { success: false, error: safeError };
  }
}
