import "server-only";
import { prisma } from "../prisma";
import { EnquiryStatus } from "@/generated/prisma/client";
import { maskMobileNumber } from "../appointments/admin-service";

export async function getEnquiries(params: {
  status?: EnquiryStatus;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(10, params.limit || 20));
  const skip = (page - 1) * limit;

  const where = params.status ? { status: params.status } : {};

  const [total, items] = await Promise.all([
    prisma.patientEnquiry.count({ where }),
    prisma.patientEnquiry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        assignedToAdmin: { select: { id: true, name: true } },
      }
    })
  ]);

  const sanitized = items.map(e => ({
    id: e.id,
    name: e.name,
    maskedMobile: maskMobileNumber(e.mobileNumber),
    enquiryType: e.enquiryType,
    messageSummary: e.message.length > 80 ? `${e.message.slice(0, 80)}...` : e.message,
    status: e.status,
    preferredContact: e.preferredContact,
    assignedTo: e.assignedToAdmin?.name || null,
    createdAt: e.createdAt.toISOString(),
  }));

  return {
    items: sanitized,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getEnquiryDetail(id: string) {
  const enquiry = await prisma.patientEnquiry.findUnique({
    where: { id },
    include: {
      assignedToAdmin: { select: { id: true, name: true, email: true } },
      resolvedByAdmin: { select: { id: true, name: true, email: true } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          authorAdmin: { select: { id: true, name: true } }
        }
      },
      history: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!enquiry) return null;

  return {
    ...enquiry,
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
    resolvedAt: enquiry.resolvedAt?.toISOString() || null,
  };
}

export async function updateEnquiryStatus(
  enquiryId: string,
  newStatus: EnquiryStatus,
  adminId: string,
  notes?: string
) {
  const enquiry = await prisma.patientEnquiry.findUnique({
    where: { id: enquiryId }
  });

  if (!enquiry) {
    return { success: false, error: "Enquiry not found." };
  }

  const oldStatus = enquiry.status;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.patientEnquiry.update({
      where: { id: enquiryId },
      data: {
        status: newStatus,
        resolvedAt: newStatus === "RESOLVED" ? new Date() : undefined,
        resolvedByAdminId: newStatus === "RESOLVED" ? adminId : undefined,
      }
    });

    await tx.enquiryStatusHistory.create({
      data: {
        enquiryId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        changedByAdminId: adminId,
        notes: notes?.trim() || null,
      }
    });

    await tx.auditLog.create({
      data: {
        adminUserId: adminId,
        action: `ENQUIRY_${newStatus}`,
        resourceType: "ENQUIRY",
        resourceId: enquiryId,
        metadata: JSON.stringify({
          fromStatus: oldStatus,
          toStatus: newStatus,
        })
      }
    });

    return updated;
  });

  return { success: true, enquiry: result };
}

export async function addEnquiryNote(enquiryId: string, adminId: string, content: string) {
  const clean = content.trim();
  if (!clean) {
    return { success: false, error: "Note content cannot be empty." };
  }

  const note = await prisma.$transaction(async (tx) => {
    const created = await tx.enquiryNote.create({
      data: {
        enquiryId,
        authorAdminId: adminId,
        content: clean,
      },
      include: {
        authorAdmin: { select: { id: true, name: true } }
      }
    });

    await tx.auditLog.create({
      data: {
        adminUserId: adminId,
        action: "ADD_ENQUIRY_NOTE",
        resourceType: "ENQUIRY",
        resourceId: enquiryId,
        metadata: JSON.stringify({ noteId: created.id })
      }
    });

    return created;
  });

  return { success: true, note };
}
