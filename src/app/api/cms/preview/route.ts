import { NextRequest, NextResponse } from "next/server";
import { resolvePreviewToken } from "@/lib/cms/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing preview token" }, { status: 400 });
  }

  const tokenRecord = await resolvePreviewToken(token);
  if (!tokenRecord) {
    return NextResponse.json(
      { error: "Invalid or expired preview token" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    valid: true,
    entityType: tokenRecord.entityType,
    entityId: tokenRecord.entityId,
    expiresAt: tokenRecord.expiresAt,
  });
}
