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

export async function getPublicDoctor(locale?: string): Promise<PublicDoctor | null> {
  const doctor = await prisma.doctor.findFirst({
    include: { profile: true },
  });
  if (!doctor) return null;

  const isTa = locale === "ta";
  const bio = isTa && doctor.profile?.bioTa ? doctor.profile.bioTa : (doctor.profile?.bioEn || doctor.bio);
  const name = isTa ? "டாக்டர் சி. சுப்பையா" : doctor.name;
  const specialisation = isTa ? "மூத்த நரம்பியல் அறுவை சிகிச்சை & தண்டுவட நிபுணர்" : (doctor.profile?.specialisation || doctor.specialisation);
  const experience = isTa ? "25+ ஆண்டுகள் அனுபவம்" : (doctor.experience || "25+ Years Experience");

  return {
    name,
    qualifications: doctor.profile?.qualifications || doctor.qualifications,
    specialisation,
    experience,
    registration: doctor.profile?.registrationNumber || doctor.registration,
    bio,
    imageUrl: doctor.imageUrl,
  };
}
