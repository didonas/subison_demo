import "server-only";
import { prisma } from "../prisma";

export async function getAuditLogs(params: {
  action?: string;
  resourceType?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(10, params.limit || 25));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.action) where.action = params.action;
  if (params.resourceType) where.resourceType = params.resourceType;

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: "desc" },
      include: {
        adminUser: { select: { id: true, name: true, email: true } },
      }
    })
  ]);

  const sanitized = items.map(log => ({
    id: log.id,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    timestamp: log.timestamp.toISOString(),
    adminName: log.adminUser?.name || "System / Guest",
    adminEmail: log.adminUser?.email || null,
    metadata: log.metadata ? JSON.parse(log.metadata) : null,
  }));

  return {
    items: sanitized,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
