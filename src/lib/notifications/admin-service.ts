import "server-only";
import { prisma } from "../prisma";
import { retryNotification } from "./service";

export async function getAdminNotifications(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(10, params.limit || 25));
  const skip = (page - 1) * limit;

  const where = params.status ? { status: params.status } : {};

  const [total, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    })
  ]);

  const sanitized = items.map(n => ({
    id: n.id,
    type: n.type,
    recipient: n.recipient.includes("@")
      ? n.recipient.replace(/^(.)(.*)(@.*)$/, (_m, f, _mid, domain) => `${f}•••${domain}`)
      : `••••••${n.recipient.slice(-4)}`,
    channel: n.channel,
    status: n.status,
    retryCount: n.retryCount,
    failureReason: n.failureReason || null,
    lastAttemptAt: n.lastAttemptAt?.toISOString() || null,
    createdAt: n.createdAt.toISOString(),
    sentAt: n.sentAt?.toISOString() || null,
  }));

  return {
    items: sanitized,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function retryFailedNotification(notificationId: string, adminId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification) {
    return { success: false, error: "Notification record not found." };
  }

  if (notification.status !== "FAILED") {
    return { success: false, error: `Only failed notifications can be retried. Current status: ${notification.status}` };
  }

  if (notification.retryCount >= 5) {
    return { success: false, error: "Maximum retry limit (5 attempts) reached for this notification." };
  }

  const now = new Date();

  // Increment retry count and update timestamp
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      retryCount: { increment: 1 },
      lastAttemptAt: now,
    }
  });

  const sendResult = await retryNotification(notificationId);

  if (sendResult.success) {
    await prisma.auditLog.create({
      data: {
        adminUserId: adminId,
        action: "RETRY_NOTIFICATION_SUCCESS",
        resourceType: "NOTIFICATION",
        resourceId: notificationId,
        metadata: JSON.stringify({
          channel: notification.channel,
          type: notification.type,
          providerId: sendResult.providerId || null,
        })
      }
    });

    return { success: true, message: "Notification resent successfully." };
  } else {
    await prisma.auditLog.create({
      data: {
        adminUserId: adminId,
        action: "RETRY_NOTIFICATION_FAILED",
        resourceType: "NOTIFICATION",
        resourceId: notificationId,
        metadata: JSON.stringify({
          channel: notification.channel,
          error: sendResult.error || "Retry failed",
        })
      }
    });

    return { success: false, error: sendResult.error || "Retry attempt failed. Please check provider status." };
  }
}
