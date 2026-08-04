import { getSiteSettings } from "@/lib/settings";
import { Phone } from "lucide-react";

export async function EmergencyBar() {
  const settings = await getSiteSettings();
  const emergencyNumber = settings.emergency || settings.phone || "";

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 shrink-0" />
          <p className="text-center sm:text-left">
            Medical emergency? Call the hospital immediately. Do not use online forms for emergencies.
          </p>
        </div>
        
        {emergencyNumber && (
          <div className="flex items-center gap-4 shrink-0">
            <a 
              href={`tel:${emergencyNumber.replace(/[^0-9+]/g, '')}`} 
              className="bg-white text-destructive hover:bg-white/90 px-3 py-1 rounded-md text-xs font-bold transition-colors"
            >
              Call {emergencyNumber}
            </a>
            {settings.latitude && settings.longitude && (
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${settings.latitude},${settings.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-white/80"
              >
                Directions
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
