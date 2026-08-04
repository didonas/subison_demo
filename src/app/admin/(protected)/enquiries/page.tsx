import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { getEnquiries } from "@/lib/enquiries/service";
import { EnquiriesClient } from "./enquiries-client";
import { EnquiryStatus } from "@/generated/prisma/client";

interface EnquiriesPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

export default async function AdminEnquiriesPage({ searchParams }: EnquiriesPageProps) {
  await requirePermission(ADMIN_PERMISSIONS.MANAGE_ENQUIRIES);
  const resolved = await searchParams;

  const status = resolved.status ? (resolved.status as EnquiryStatus) : undefined;
  const page = parseInt(resolved.page || "1", 10);

  const enquiriesData = await getEnquiries({ status, page, limit: 25 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Patient Enquiries Inbox</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review, assign, and respond to incoming medical queries and department contact requests.
        </p>
      </div>

      <EnquiriesClient initialData={enquiriesData} selectedStatus={status} />
    </div>
  );
}
