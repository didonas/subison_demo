import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicArticle = {
  id: string;
  slug: string;
  category: string;
  authorName: string;
  isMedicalReviewed: boolean;
  reviewedByDoctorName: string | null;
  titleEn: string;
  titleTa: string | null;
  summaryEn: string | null;
  summaryTa: string | null;
  contentEn: unknown;
  contentTa: unknown;
  seoTitleEn: string | null;
  seoDescEn: string | null;
  publishedAt: Date | null;
};

export async function getPublicArticles(limit?: number): Promise<PublicArticle[]> {
  const items = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: { translations: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  return items.map((item) => {
    const en = item.translations.find((t) => t.locale === "en");
    const ta = item.translations.find((t) => t.locale === "ta");

    return {
      id: item.id,
      slug: item.slug,
      category: item.category,
      authorName: item.authorName,
      isMedicalReviewed: item.isMedicalReviewed,
      reviewedByDoctorName: item.reviewedByDoctorName,
      titleEn: en?.title || item.slug,
      titleTa: ta?.title || null,
      summaryEn: en?.summary || null,
      summaryTa: ta?.summary || null,
      contentEn: en?.content || null,
      contentTa: ta?.content || null,
      seoTitleEn: en?.seoTitle || null,
      seoDescEn: en?.seoDescription || null,
      publishedAt: item.publishedAt,
    };
  });
}

export async function getPublicArticleBySlug(slug: string): Promise<PublicArticle | null> {
  const item = await prisma.article.findUnique({
    where: { slug },
    include: { translations: true },
  });

  if (!item || item.status !== "PUBLISHED") return null;

  const en = item.translations.find((t) => t.locale === "en");
  const ta = item.translations.find((t) => t.locale === "ta");

  return {
    id: item.id,
    slug: item.slug,
    category: item.category,
    authorName: item.authorName,
    isMedicalReviewed: item.isMedicalReviewed,
    reviewedByDoctorName: item.reviewedByDoctorName,
    titleEn: en?.title || item.slug,
    titleTa: ta?.title || null,
    summaryEn: en?.summary || null,
    summaryTa: ta?.summary || null,
    contentEn: en?.content || null,
    contentTa: ta?.content || null,
    seoTitleEn: en?.seoTitle || null,
    seoDescEn: en?.seoDescription || null,
    publishedAt: item.publishedAt,
  };
}
