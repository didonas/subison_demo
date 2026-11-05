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

const DEFAULT_SETTINGS_EN: HospitalSettings = {
  hospitalName: "Hospital",
  address: "Hospital, Kanyakumari Main Road, Nagercoil, Tamil Nadu 629001",
  phone: "+91 63836 36281",
  whatsapp: "+91 63836 36281",
  emergency: "+91 63836 36281",
  email: "contact@subisonneuro.com",
  consultationHours: "Monday to Saturday, 6:00 PM to 10:00 PM",
  appointmentFee: "₹200",
  latitude: "8.1592044",
  longitude: "77.4085451",
  socialLinks: {},
};

const DEFAULT_SETTINGS_TA: HospitalSettings = {
  hospitalName: "மருத்துவமனை",
  address: "மருத்துவமனை, கன்னியாகுமரி மெயின் ரோடு, நாகர்கோவில், தமிழ்நாடு 629001",
  phone: "+91 63836 36281",
  whatsapp: "+91 63836 36281",
  emergency: "+91 63836 36281",
  email: "contact@subisonneuro.com",
  consultationHours: "திங்கள் முதல் சனி வரை, மாலை 6:00 மணி முதல் இரவு 10:00 மணி வரை",
  appointmentFee: "ரூ. 200",
  latitude: "8.1592044",
  longitude: "77.4085451",
  socialLinks: {},
};

function cleanValue(raw: string | undefined): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    return String(parsed);
  } catch {
    return raw;
  }
}

export async function getSiteSettings(locale?: string): Promise<HospitalSettings> {
  const isTa = locale === "ta";
  const defaults = isTa ? DEFAULT_SETTINGS_TA : DEFAULT_SETTINGS_EN;

  try {
    const settings = await prisma.siteSetting.findMany();
    
    // Convert array of {key, value} to an object map
    const map: Record<string, string> = {};
    settings.forEach(s => {
      map[s.key] = cleanValue(s.value);
    });

    const hospitalName = isTa
      ? (map["hospitalName_ta"] || map["hospitalName"] || defaults.hospitalName)
      : (map["hospitalName"] || defaults.hospitalName);

    const address = isTa
      ? (map["address_ta"] || map["address"] || defaults.address)
      : (map["address"] || defaults.address);

    const consultationHours = isTa
      ? (map["consultationHours_ta"] || map["consultationHours"] || defaults.consultationHours)
      : (map["consultationHours"] || defaults.consultationHours);

    const appointmentFee = isTa
      ? (map["appointmentFee_ta"] || (map["appointmentFee"] ? `ரூ. ${map["appointmentFee"].replace(/[^0-9]/g, '')}` : defaults.appointmentFee))
      : (map["appointmentFee"] ? (map["appointmentFee"].startsWith("₹") ? map["appointmentFee"] : `₹${map["appointmentFee"]}`) : defaults.appointmentFee);

    return {
      hospitalName,
      address,
      phone: map["phone"] || defaults.phone,
      whatsapp: map["whatsapp"] || defaults.whatsapp,
      emergency: map["emergencyPhone"] || map["emergency"] || defaults.emergency,
      email: map["email"] || defaults.email,
      consultationHours,
      appointmentFee,
      latitude: map["latitude"] || (map["locationCoordinates"] ? map["locationCoordinates"].split(",")[0].trim() : defaults.latitude),
      longitude: map["longitude"] || (map["locationCoordinates"] ? map["locationCoordinates"].split(",")[1]?.trim() || defaults.longitude : defaults.longitude),
      socialLinks: map["socialLinks"] ? JSON.parse(map["socialLinks"]) : defaults.socialLinks,
    };
  } catch (error) {
    console.error("Failed to load site settings:", error);
    return defaults;
  }
}
