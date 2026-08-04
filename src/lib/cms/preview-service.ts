import crypto from "crypto";

export interface PreviewTokenPayload {
  token: string;
  entityType: string; // "SPECIALITY" | "TREATMENT" | "ARTICLE" | "FACILITY" | "DOCTOR"
  entityId: string;
  expiresAt: Date;
}

export function generatePreviewToken(
  entityType: string,
  entityId: string,
  lifetimeMinutes: number = 60
): PreviewTokenPayload {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + lifetimeMinutes * 60 * 1000);

  return {
    token,
    entityType,
    entityId,
    expiresAt,
  };
}

export function isPreviewTokenValid(expiresAt: Date): boolean {
  return new Date() < new Date(expiresAt);
}
