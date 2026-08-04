import "server-only";
import { env } from "@/lib/env";
import crypto from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export interface RateLimitOptions {
  keyType?: "ip" | "mobile" | "user";
  keyValue?: string;
}

const SENSITIVE_ACTIONS = new Set([
  "admin_login",
  "password_reset",
  "staff_user_mutation",
  "media_upload",
  "csv_export",
  "notification_retry",
]);

/**
 * Extracts and normalizes the trusted client IP according to the deployment's reverse-proxy mode.
 * Prevents client-forged headers from spoofing rate limit identities.
 */
export function extractTrustedClientIp(
  headersList: Headers,
  mode: "cloudflare" | "vercel" | "nginx" | "direct"
): string | null {
  let candidateIp: string | null = null;

  switch (mode) {
    case "cloudflare": {
      // Cloudflare sets CF-Connecting-IP after validating the connecting edge
      // Only trusted when direct origin access is blocked at the network perimeter
      const cfIp = headersList.get("cf-connecting-ip");
      if (cfIp) candidateIp = cfIp.trim();
      break;
    }
    case "vercel": {
      // Documented Vercel client IP header: x-vercel-forwarded-for, falling back to x-forwarded-for or x-real-ip
      // Note: x-vercel-proxied-for is nonexistent and deliberately ignored
      const vercelIp = 
        headersList.get("x-vercel-forwarded-for") ??
        headersList.get("x-forwarded-for") ??
        headersList.get("x-real-ip");
      
      if (vercelIp) {
        candidateIp = vercelIp.split(",")[0].trim();
      }
      break;
    }
    case "nginx": {
      // NGINX configured to overwrite X-Real-IP or manage trusted X-Forwarded-For chain
      const realIp = headersList.get("x-real-ip");
      if (realIp) {
        candidateIp = realIp.trim();
      } else {
        const xff = headersList.get("x-forwarded-for");
        if (xff) candidateIp = xff.split(",")[0].trim();
      }
      break;
    }
    case "direct":
    default: {
      // Direct mode is restricted to local development or documented environments exposing connection headers
      // Next.js headers() alone does not provide raw socket inspection
      const xff = headersList.get("x-forwarded-for") || headersList.get("x-real-ip");
      if (xff) {
        candidateIp = xff.split(",")[0].trim();
      }
      break;
    }
  }

  if (!candidateIp) return null;

  // Normalize candidate: strip IPv4-mapped IPv6 prefix (::ffff:x.x.x.x)
  let normalized = candidateIp.toLowerCase().trim();
  normalized = normalized.replace(/^::ffff:/i, "");

  // Validate format (IPv4 or IPv6)
  const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(normalized);
  const isIpv6 = /^[0-9a-f:]+$/.test(normalized);

  if (!isIpv4 && !isIpv6) {
    return null;
  }

  return normalized;
}

export async function checkRateLimit(
  action: string,
  maxAttempts: number,
  windowMinutes: number,
  options?: RateLimitOptions
): Promise<{ success: boolean; error?: string }> {
  const keyType = options?.keyType || "ip";
  let normalizedValue: string;

  if (keyType === "ip") {
    let trustedIp: string | null = options?.keyValue || null;
    if (!trustedIp) {
      try {
        const headersList = await headers();
        trustedIp = extractTrustedClientIp(headersList, env.TRUSTED_PROXY_MODE);
      } catch {
        trustedIp = null;
      }
    }

    if (trustedIp) {
      normalizedValue = trustedIp;
    } else {
      // Emit privacy-safe monitoring event without logging raw headers
      if (process.env.NODE_ENV !== "test") {
        console.warn(`[SECURITY_TELEMETRY] event=trusted_client_ip_unavailable action=${action}`);
      }

      // Fail closed for sensitive administrative actions
      if (SENSITIVE_ACTIONS.has(action)) {
        return {
          success: false,
          error: "Trusted client identification required for this operation.",
        };
      }

      // Public forms map to namespaced unknown-client bucket
      normalizedValue = "unknown-client";
    }
  } else if (keyType === "mobile") {
    normalizedValue = (options?.keyValue || "").replace(/\D/g, "");
    if (!normalizedValue) normalizedValue = "unknown-mobile";
  } else {
    normalizedValue = (options?.keyValue || "unknown-user").trim().toLowerCase();
  }

  // Action-specific and identifier-specific HMAC-SHA256 payload
  // Strict separation: ${action}:${keyType}:${normalizedValue}
  const payload = `${action}:${keyType}:${normalizedValue}`;
  const identifier = crypto
    .createHmac("sha256", env.RATE_LIMIT_SECRET)
    .update(payload)
    .digest("hex");

  // Atomic Upsert using raw SQL
  let result;
  try {
    result = await prisma.$queryRaw<unknown[]>`
      INSERT INTO "RateLimit" (id, identifier, action, attempts, "windowStart", "lastAttempt", "lockedUntil", "expiresAt", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text, 
        ${identifier}, 
        ${action}, 
        1, 
        NOW(), 
        NOW(), 
        NULL, 
        NOW() + (${windowMinutes} * INTERVAL '1 minute'), 
        NOW(), 
        NOW()
      )
      ON CONFLICT (identifier, action) DO UPDATE
      SET 
        attempts = CASE 
          WHEN "RateLimit"."expiresAt" < NOW() THEN 1 
          ELSE "RateLimit".attempts + 1 
        END,
        "windowStart" = CASE 
          WHEN "RateLimit"."expiresAt" < NOW() THEN NOW() 
          ELSE "RateLimit"."windowStart" 
        END,
        "lastAttempt" = NOW(),
        "expiresAt" = CASE 
          WHEN "RateLimit"."expiresAt" < NOW() THEN NOW() + (${windowMinutes} * INTERVAL '1 minute')
          ELSE "RateLimit"."expiresAt" 
        END,
        "lockedUntil" = CASE 
          WHEN "RateLimit"."lockedUntil" > NOW() THEN "RateLimit"."lockedUntil"
          WHEN (("RateLimit"."expiresAt" >= NOW()) AND ("RateLimit".attempts + 1 >= ${maxAttempts})) THEN NOW() + (${windowMinutes} * INTERVAL '1 minute')
          ELSE NULL 
        END,
        "updatedAt" = NOW()
      RETURNING *;
    `;
  } catch {
    return { success: false, error: "Rate limit service error" };
  }

  if (!result || !Array.isArray(result) || result.length === 0) {
    return { success: false, error: "Rate limit service error" };
  }

  const record = result[0] as {
    id: string;
    identifier: string;
    action: string;
    attempts: number;
    windowStart: Date;
    lastAttempt: Date;
    lockedUntil: Date | null;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };

  // If the record is locked
  if (record.lockedUntil && new Date(record.lockedUntil) > new Date()) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  return { success: true };
}
