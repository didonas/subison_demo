import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicTestimonial = {
  id: string;
  patientName: string;
  location: string | null;
  text: string;
};

export async function getPublicTestimonials(limit?: number): Promise<PublicTestimonial[]> {
  const items = await prisma.testimonial.findMany({
    where: { status: "APPROVED", hasConsent: true },
    orderBy: { displayOrder: "asc" },
    take: limit,
  });

  return items.map((item) => ({
    id: item.id,
    patientName: item.patientDisplayName,
    location: item.patientLocation,
    text: item.content,
  }));
}
