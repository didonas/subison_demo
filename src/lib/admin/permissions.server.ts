import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  AdminPermissionType, 
  AdminRoleType, 
  DEFAULT_ROLE_PERMISSIONS, 
  SerializedAdminUser 
} from "./permissions.shared";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized: Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden: Insufficient permissions") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Loads the current authenticated admin user from session and verifies active status in DB.
 */
export async function getCurrentAdmin(): Promise<SerializedAdminUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const dbUser = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!dbUser || !dbUser.isActive) {
    return null;
  }

  // Determine primary role
  const primaryRole = (dbUser.roles[0]?.role.name as AdminRoleType) || "RECEPTIONIST";

  // Aggregate explicit database permissions and role defaults
  const permissionsSet = new Set<AdminPermissionType>();

  // Add default permissions for roles
  dbUser.roles.forEach(ur => {
    const roleName = ur.role.name as AdminRoleType;
    const defaults = DEFAULT_ROLE_PERMISSIONS[roleName] || [];
    defaults.forEach(p => permissionsSet.add(p));

    // Add any database-specific permissions
    ur.role.permissions.forEach(rp => {
      permissionsSet.add(rp.permission.name as AdminPermissionType);
    });
  });

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: primaryRole,
    permissions: Array.from(permissionsSet),
  };
}

/**
 * Requires an authenticated active admin. Throws UnauthorizedError if missing.
 */
export async function requireAdmin(): Promise<SerializedAdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new UnauthorizedError("You must be logged in as an active administrator to perform this action.");
  }
  return admin;
}

/**
 * Asserts the current admin user possesses the specified permission.
 */
export async function requirePermission(permission: AdminPermissionType): Promise<SerializedAdminUser> {
  const admin = await requireAdmin();
  if (!admin.permissions.includes(permission)) {
    throw new ForbiddenError(`Forbidden: Missing required permission [${permission}].`);
  }
  return admin;
}

/**
 * Asserts the current admin user possesses at least one of the specified permissions.
 */
export async function requireAnyPermission(permissions: AdminPermissionType[]): Promise<SerializedAdminUser> {
  const admin = await requireAdmin();
  const hasAny = permissions.some(p => admin.permissions.includes(p));
  if (!hasAny) {
    throw new ForbiddenError(`Forbidden: Requires at least one of [${permissions.join(", ")}].`);
  }
  return admin;
}
