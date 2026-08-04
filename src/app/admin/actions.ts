"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function logoutCurrentDevice() {
  await signOut({ redirectTo: '/admin/login' });
}

export async function logoutAllDevices() {
  const session = await auth();
  if (!session || !session.user?.id) throw new Error("Unauthorized");
  
  await prisma.session.deleteMany({
    where: { userId: session.user.id }
  });
  
  await prisma.auditLog.create({
    data: {
      adminUserId: session.user.id,
      action: "LOGOUT_ALL_DEVICES",
      resourceType: "AUTH",
    }
  });
  
  await signOut({ redirectTo: '/admin/login' });
}
