/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email as string },
          include: { roles: { include: { role: true } } },
        });

        if (!user || !user.isActive) return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);

        if (!isValid) {
          const failed = user.failedLogins + 1;
          const lockedUntil = failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await prisma.adminUser.update({
            where: { id: user.id },
            data: { failedLogins: failed, lockedUntil },
          });
          
          await prisma.auditLog.create({
            data: {
              adminUserId: user.id,
              action: "LOGIN_FAILED",
              resourceType: "AUTH",
            }
          });
          return null;
        }

        // Reset failed logins
        await prisma.adminUser.update({
          where: { id: user.id },
          data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        
        await prisma.auditLog.create({
          data: {
            adminUserId: user.id,
            action: "LOGIN_SUCCESS",
            resourceType: "AUTH",
          }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles.map(r => r.role.name),
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Create DB-backed session
        const sessionToken = uuidv4();
        await prisma.session.create({
          data: {
            sessionToken,
            userId: user.id as string,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
          }
        });
        token.sessionId = sessionToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sessionId) {
        const dbSession = await prisma.session.findUnique({
          where: { sessionToken: token.sessionId as string },
          include: { 
            user: { 
              include: { 
                roles: { 
                  include: { 
                    role: {
                      include: {
                        permissions: { include: { permission: true } }
                      }
                    } 
                  } 
                } 
              } 
            } 
          }
        });
        if (!dbSession || dbSession.expires < new Date() || !dbSession.user.isActive) {
          (session as any).error = "SessionExpired";
          return session;
        }
        session.user.id = dbSession.user.id;
        (session.user as any).roles = dbSession.user.roles.map(r => r.role.name);
        
        const perms = new Set<string>();
        dbSession.user.roles.forEach(ur => {
          ur.role.permissions.forEach(rp => perms.add(rp.permission.name));
        });
        (session.user as any).permissions = Array.from(perms);
      } else {
        (session as any).error = "NoSession";
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
});
