import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicFacility = {
  id: string;
  slug: string;
  titleEn: string;
  titleTa: string | null;
  contentEn: string;
  contentTa: string | null;
  imageUrl: string | null;
};

export async function getPublicFacilities(limit?: number): Promise<PublicFacility[]> {
  const items = await prisma.facility.findMany({
    where: { status: "PUBLISHED" },
    include: { translations: true },
    orderBy: { displayOrder: "asc" },
    take: limit,
  });

  return items.map((item) => {
    const en = item.translations.find((t) => t.locale === "en");
    const ta = item.translations.find((t) => t.locale === "ta");

    return {
      id: item.id,
      slug: item.slug,
      titleEn: en?.name || item.slug,
      titleTa: ta?.name || null,
      contentEn: en?.description || "",
      contentTa: ta?.description || null,
      imageUrl: null,
    };
  });
}
