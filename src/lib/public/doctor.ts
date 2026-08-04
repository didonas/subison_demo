import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicDoctor = {
  name: string;
  qualifications: string;
  specialisation: string;
  experience: string | null;
  registration: string | null;
  bio: string | null;
  imageUrl: string | null;
};

export async function getPublicDoctor(): Promise<PublicDoctor | null> {
  const doctor = await prisma.doctor.findFirst();
  if (!doctor) return null;

  return {
    name: doctor.name,
    qualifications: doctor.qualifications,
    specialisation: doctor.specialisation,
    experience: doctor.experience,
    registration: doctor.registration,
    bio: doctor.bio,
    imageUrl: doctor.imageUrl,
  };
}
