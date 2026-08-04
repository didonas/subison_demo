import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Content-Type": "application/json",
  };

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB_TIMEOUT")), 3000)
    );
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    return NextResponse.json({ status: "healthy" }, { status: 200, headers });
  } catch {
    return NextResponse.json({ status: "unhealthy" }, { status: 503, headers });
  }
}
