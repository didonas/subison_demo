import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export type PublicMediaAsset = {
  id: string;
  publicUrl: string;
  fileName: string;
  altTextEn: string | null;
  altTextTa: string | null;
  captionEn: string | null;
  captionTa: string | null;
  album: string | null;
};

export async function getPublicGallery(album?: string): Promise<PublicMediaAsset[]> {
  const where: Prisma.MediaAssetWhereInput = { status: "PUBLISHED" };
  if (album) {
    where.album = album;
  }

  const items = await prisma.mediaAsset.findMany({
    where,
    orderBy: { displayOrder: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    publicUrl: item.publicUrl,
    fileName: item.fileName,
    altTextEn: item.altTextEn,
    altTextTa: item.altTextTa,
    captionEn: item.captionEn,
    captionTa: item.captionTa,
    album: item.album,
  }));
}
