import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export type PublicFaq = {
  id: string;
  category: string;
  questionEn: string;
  questionTa: string | null;
  answerEn: string;
  answerTa: string | null;
};

export async function getPublicFaqs(category?: string): Promise<PublicFaq[]> {
  const where: Prisma.FAQWhereInput = { status: "PUBLISHED" };
  if (category) {
    where.category = category;
  }

  const items = await prisma.fAQ.findMany({
    where,
    include: { translations: true },
    orderBy: { displayOrder: "asc" },
  });

  return items.map((item) => {
    const en = item.translations.find((t) => t.locale === "en");
    const ta = item.translations.find((t) => t.locale === "ta");

    return {
      id: item.id,
      category: item.category,
      questionEn: en?.question || "",
      questionTa: ta?.question || null,
      answerEn: en?.answer || "",
      answerTa: ta?.answer || null,
    };
  });
}
