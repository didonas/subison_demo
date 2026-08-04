import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin/permissions.server";
import { computeClientPermissionFlags } from "@/lib/admin/permissions.shared";
import { AdminShellClient } from "./admin-shell-client";
import { ToastProvider } from "@/components/ui/toast-context";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const flags = computeClientPermissionFlags(admin.permissions);

  return (
    <ToastProvider>
      <AdminShellClient admin={admin} permissions={flags}>
        {children}
      </AdminShellClient>
    </ToastProvider>
  );
}
