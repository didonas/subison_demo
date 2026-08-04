/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session || (session as any).error) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(role: string) {
  const session = await requireAdmin();
  const roles = (session.user as any).roles as string[];
  
  if (!roles.includes(role) && !roles.includes("SUPER_ADMIN")) {
    throw new Error("Forbidden: Missing required role");
  }
  return session;
}

export async function hasRole(role: string) {
  try {
    const session = await auth();
    if (!session || (session as any).error) return false;
    const roles = (session.user as any).roles as string[];
    return roles.includes(role) || roles.includes("SUPER_ADMIN");
  } catch (e) {
    return false;
  }
}

export async function requirePermission(permission: string) {
  const session = await requireAdmin();
  const roles = (session.user as any).roles as string[];
  if (roles.includes("SUPER_ADMIN")) return session;

  const permissions = (session.user as any).permissions as string[];
  if (!permissions?.includes(permission)) {
    throw new Error("Forbidden: Missing required permission");
  }
  return session;
}

export async function hasPermission(permission: string) {
  try {
    const session = await auth();
    if (!session || (session as any).error) return false;
    const roles = (session.user as any).roles as string[];
    if (roles.includes("SUPER_ADMIN")) return true;

    const permissions = (session.user as any).permissions as string[];
    return permissions?.includes(permission) ?? false;
  } catch (e) {
    return false;
  }
}
