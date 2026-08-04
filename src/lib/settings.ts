import "server-only";
import { prisma } from './prisma';

export type HospitalSettings = {
  hospitalName: string;
  address: string;
  phone: string;
  whatsapp: string;
  emergency: string;
  email: string;
  consultationHours: string;
  appointmentFee: string;
  latitude: string;
  longitude: string;
  socialLinks: Record<string, string>;
};

const DEFAULT_SETTINGS: HospitalSettings = {
  hospitalName: "Subison Neuro Centre",
  address: "Contact information is being updated.",
  phone: "+91 63836 36281",
  whatsapp: "+91 63836 36281",
  emergency: "+91 63836 36281",
  email: "contact@subisonneuro.com",
  consultationHours: "Timings unavailable.",
  appointmentFee: "Fee unavailable.",
  latitude: "",
  longitude: "",
  socialLinks: {},
};

export async function getSiteSettings(): Promise<HospitalSettings> {
  try {
    const settings = await prisma.siteSetting.findMany();
    
    // Convert array of {key, value} to an object map
    const map: Record<string, string> = {};
    settings.forEach(s => {
      map[s.key] = s.value;
    });

    return {
      hospitalName: map["hospitalName"] || DEFAULT_SETTINGS.hospitalName,
      address: map["address"] || DEFAULT_SETTINGS.address,
      phone: map["phone"] || DEFAULT_SETTINGS.phone,
      whatsapp: map["whatsapp"] || DEFAULT_SETTINGS.whatsapp,
      emergency: map["emergency"] || DEFAULT_SETTINGS.emergency,
      email: map["email"] || DEFAULT_SETTINGS.email,
      consultationHours: map["consultationHours"] || DEFAULT_SETTINGS.consultationHours,
      appointmentFee: map["appointmentFee"] || DEFAULT_SETTINGS.appointmentFee,
      latitude: map["latitude"] || DEFAULT_SETTINGS.latitude,
      longitude: map["longitude"] || DEFAULT_SETTINGS.longitude,
      socialLinks: map["socialLinks"] ? JSON.parse(map["socialLinks"]) : DEFAULT_SETTINGS.socialLinks,
    };
  } catch (error) {
    console.error("Failed to load site settings:", error);
    return DEFAULT_SETTINGS;
  }
}
