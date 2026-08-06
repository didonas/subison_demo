import { getSiteSettings } from "@/lib/settings";
import { HeaderClient } from "./HeaderClient";

interface HeaderProps {
  locale: string;
}

export async function Header({ locale }: HeaderProps) {
  const settings = await getSiteSettings(locale);

  return (
    <HeaderClient 
      hospitalName={settings.hospitalName}
      phone={settings.phone}
      locale={locale}
    />
  );
}
