import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicTreatment = {
  id: string;
  slug: string;
  titleEn: string;
  titleTa: string | null;
  contentEn: string;
  contentTa: string | null;
  imageUrl: string | null;
  seoTitleEn: string | null;
  seoDescEn: string | null;
  seoTitleTa: string | null;
  seoDescTa: string | null;
};

export async function getPublicTreatments(limit?: number): Promise<PublicTreatment[]> {
  const items = await prisma.treatment.findMany({
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
      titleEn: en?.title || item.slug,
      titleTa: ta?.title || null,
      contentEn: en?.overview || en?.summary || "",
      contentTa: ta?.overview || ta?.summary || null,
      imageUrl: null,
      seoTitleEn: en?.seoTitle || null,
      seoDescEn: en?.seoDescription || null,
      seoTitleTa: ta?.seoTitle || null,
      seoDescTa: ta?.seoDescription || null,
    };
  });
}

export async function getPublicTreatmentBySlug(slug: string): Promise<PublicTreatment | null> {
  const item = await prisma.treatment.findUnique({
    where: { slug },
    include: { translations: true },
  });

  if (!item || item.status !== "PUBLISHED") return null;

  const en = item.translations.find((t) => t.locale === "en");
  const ta = item.translations.find((t) => t.locale === "ta");

  return {
    id: item.id,
    slug: item.slug,
    titleEn: en?.title || item.slug,
    titleTa: ta?.title || null,
    contentEn: en?.overview || en?.summary || "",
    contentTa: ta?.overview || ta?.summary || null,
    imageUrl: null,
    seoTitleEn: en?.seoTitle || null,
    seoDescEn: en?.seoDescription || null,
    seoTitleTa: ta?.seoTitle || null,
    seoDescTa: ta?.seoDescription || null,
  };
}
