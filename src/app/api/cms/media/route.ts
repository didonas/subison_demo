import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { mediaStorage } from "@/lib/cms/media-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_MEDIA);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const altTextEn = (formData.get("altTextEn") as string) || "";
    const altTextTa = (formData.get("altTextTa") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const stored = await mediaStorage.upload({
      buffer,
      fileName: file.name,
      mimeType: file.type,
      altTextEn,
      altTextTa,
    });

    const record = await prisma.mediaAsset.create({
      data: {
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl,
        fileName: stored.fileName,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
        altTextEn,
        altTextTa,
        thumbnailUrl: stored.thumbnailUrl,
        uploadedByAdminId: admin.id,
      },
    });

    return NextResponse.json({ success: true, asset: record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload media asset";
    const isForbidden = err instanceof Error && err.name === "ForbiddenError";
    return NextResponse.json(
      { error: message },
      { status: isForbidden ? 403 : 400 }
    );
  }
}
