import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { getHospitalHolidays } from "@/lib/schedules/service";
import { HolidaysClient } from "./holidays-client";

export default async function AdminHospitalHolidaysPage() {
  await requirePermission(ADMIN_PERMISSIONS.MANAGE_SCHEDULES);

  const holidays = await getHospitalHolidays();

  const sanitized = holidays.map((h) => ({
    id: h.id,
    name: h.name,
    date: h.date.toISOString().split("T")[0],
    description: h.description || "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Hospital Holidays &amp; Closures</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage full-day clinic closures for public holidays and institutional observances.
        </p>
      </div>

      <HolidaysClient initialHolidays={sanitized} />
    </div>
  );
}
