import "server-only";
import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import { AdminRoleType } from "../admin/permissions.shared";

export async function getStaffUsers() {
  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      roles: {
        include: { role: true }
      }
    }
  });

  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt?.toISOString() || null,
    roles: u.roles.map(r => r.role.name),
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function getStaffUserDetail(id: string) {
  const user = await prisma.adminUser.findUnique({
    where: { id },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } }
            }
          }
        }
      },
      sessions: true,
    }
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    roles: user.roles.map(r => r.role.name),
    activeSessionsCount: user.sessions.filter(s => s.expires > new Date()).length,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function createStaffUser(
  data: {
    name: string;
    email: string;
    password: string;
    role: AdminRoleType;
  },
  adminId: string
) {
  const existing = await prisma.adminUser.findUnique({
    where: { email: data.email.toLowerCase().trim() }
  });

  if (existing) {
    return { success: false, error: "A user with this email address already exists." };
  }

  if (data.password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }

  const role = await prisma.role.findUnique({
    where: { name: data.role }
  });

  if (!role) {
    return { success: false, error: `Role ${data.role} does not exist.` };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.adminUser.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash,
        isActive: true,
        roles: {
          create: {
            roleId: role.id
          }
        }
      }
    });

    await tx.auditLog.create({
      data: {
        adminUserId: adminId,
        action: "CREATE_STAFF_USER",
        resourceType: "ADMIN_USER",
        resourceId: user.id,
        metadata: JSON.stringify({ email: user.email, role: data.role })
      }
    });

    return user;
  });

  return { success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } };
}

export async function updateStaffUserRole(
  targetUserId: string,
  newRole: AdminRoleType,
  currentAdminId: string,
  currentAdminRole: AdminRoleType
) {
  if (currentAdminRole !== "SUPER_ADMIN") {
    return { success: false, error: "Only Super Administrators can modify staff roles." };
  }

  const targetUser = await prisma.adminUser.findUnique({
    where: { id: targetUserId },
    include: { roles: { include: { role: true } } }
  });

  if (!targetUser) {
    return { success: false, error: "Staff user not found." };
  }

  const targetIsSuperAdmin = targetUser.roles.some(r => r.role.name === "SUPER_ADMIN");

  // If removing SUPER_ADMIN role, check that at least one other active SUPER_ADMIN remains
  if (targetIsSuperAdmin && newRole !== "SUPER_ADMIN") {
    const superAdminCount = await prisma.userRole.count({
      where: {
        role: { name: "SUPER_ADMIN" },
        user: { isActive: true }
      }
    });

    if (superAdminCount <= 1) {
      return { success: false, error: "Cannot demote the last remaining Super Administrator." };
    }
  }

  const roleRecord = await prisma.role.findUnique({
    where: { name: newRole }
  });

  if (!roleRecord) {
    return { success: false, error: `Role ${newRole} not found.` };
  }

  await prisma.$transaction(async (tx) => {
    // Delete existing roles
    await tx.userRole.deleteMany({
      where: { userId: targetUserId }
    });

    // Assign new role
    await tx.userRole.create({
      data: {
        userId: targetUserId,
        roleId: roleRecord.id,
      }
    });

    await tx.auditLog.create({
      data: {
        adminUserId: currentAdminId,
        action: "UPDATE_STAFF_ROLE",
        resourceType: "ADMIN_USER",
        resourceId: targetUserId,
        metadata: JSON.stringify({ newRole })
      }
    });
  });

  return { success: true };
}

export async function toggleStaffUserActive(
  targetUserId: string,
  isActive: boolean,
  currentAdminId: string
) {
  if (targetUserId === currentAdminId && !isActive) {
    return { success: false, error: "You cannot deactivate your own account." };
  }

  const targetUser = await prisma.adminUser.findUnique({
    where: { id: targetUserId },
    include: { roles: { include: { role: true } } }
  });

  if (!targetUser) {
    return { success: false, error: "Staff user not found." };
  }

  if (!isActive && targetUser.roles.some(r => r.role.name === "SUPER_ADMIN")) {
    const activeSuperAdmins = await prisma.userRole.count({
      where: {
        role: { name: "SUPER_ADMIN" },
        user: { isActive: true }
      }
    });

    if (activeSuperAdmins <= 1) {
      return { success: false, error: "Cannot deactivate the last remaining active Super Administrator." };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.adminUser.update({
      where: { id: targetUserId },
      data: { isActive }
    });

    // If deactivating, immediately revoke all active sessions
    if (!isActive) {
      await tx.session.deleteMany({
        where: { userId: targetUserId }
      });
    }

    await tx.auditLog.create({
      data: {
        adminUserId: currentAdminId,
        action: isActive ? "ACTIVATE_STAFF_USER" : "DEACTIVATE_STAFF_USER",
        resourceType: "ADMIN_USER",
        resourceId: targetUserId,
      }
    });
  });

  return { success: true };
}

export async function revokeStaffUserSessions(targetUserId: string, currentAdminId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: { userId: targetUserId }
    });

    await tx.auditLog.create({
      data: {
        adminUserId: currentAdminId,
        action: "REVOKE_STAFF_SESSIONS",
        resourceType: "ADMIN_USER",
        resourceId: targetUserId,
      }
    });
  });

  return { success: true };
}
