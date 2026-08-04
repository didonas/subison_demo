import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicVideo = {
  id: string;
  provider: string;
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  titleEn: string | null;
  titleTa: string | null;
  captionEn: string | null;
  captionTa: string | null;
};

export async function getPublicVideos(): Promise<PublicVideo[]> {
  const items = await prisma.videoItem.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { displayOrder: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    provider: item.provider,
    videoId: item.videoId,
    embedUrl: item.embedUrl,
    thumbnailUrl: item.thumbnailUrl,
    titleEn: item.titleEn,
    titleTa: item.titleTa,
    captionEn: item.captionEn,
    captionTa: item.captionTa,
  }));
}
