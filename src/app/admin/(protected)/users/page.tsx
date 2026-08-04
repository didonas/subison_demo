import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import { getStaffUsers } from "@/lib/users/service";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_USERS);
  const users = await getStaffUsers();

  const canManageRoles = admin.permissions.includes(ADMIN_PERMISSIONS.MANAGE_ROLES);

  return (
    <UsersClient
      users={users}
      currentAdminId={admin.id}
      canManageRoles={canManageRoles}
    />
  );
}
