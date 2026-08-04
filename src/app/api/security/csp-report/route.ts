import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_REPORT_SIZE_BYTES = 10 * 1024; // 10 KB limit
const MAX_BATCH_REPORTS = 10; // Max 10 items in reports+json array

function extractRouteGroup(rawUrl: unknown): string {
  if (typeof rawUrl !== "string") return "unknown";
  try {
    const parsed = new URL(rawUrl);
    const path = parsed.pathname.toLowerCase();
    if (path.includes("/appointments/book")) return "appointment-booking";
    if (path.includes("/appointments/track")) return "appointment-tracking";
    if (path.includes("/admin/login")) return "admin-login";
    if (path.includes("/admin/cms")) return "admin-cms";
    if (path.includes("/admin")) return "admin";
    if (path.includes("/contact")) return "contact";
    if (path === "/" || path === "/en" || path === "/ta") return "homepage";
    return "public-content";
  } catch {
    return "unknown";
  }
}

function extractBlockedOrigin(rawBlockedUri: unknown): string | null {
  if (typeof rawBlockedUri !== "string" || !rawBlockedUri.trim()) return null;
  const trimmed = rawBlockedUri.trim();
  if (trimmed === "self" || trimmed === "inline" || trimmed === "eval" || trimmed === "data:" || trimmed === "blob:") {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return trimmed.split("?")[0].split("#")[0].slice(0, 64);
  }
}

export interface SanitizedTelemetryEvent {
  event: "csp_violation";
  environment: string;
  effectiveDirective: string;
  blockedOrigin: string | null;
  documentRouteGroup: string;
  count: number;
}

export async function POST(request: NextRequest) {
  const noCacheHeaders = new Headers({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
  });

  try {
    // 1. Content-Type Validation
    const contentType = request.headers.get("content-type") || "";
    if (
      !contentType.includes("application/csp-report") &&
      !contentType.includes("application/reports+json") &&
      !contentType.includes("application/json")
    ) {
      return new NextResponse("Unsupported Media Type", {
        status: 415,
        headers: { ...Object.fromEntries(noCacheHeaders), "Content-Type": "text/plain" },
      });
    }

    // 2. Payload Size Check
    const rawBody = await request.text();
    if (rawBody.length > MAX_REPORT_SIZE_BYTES) {
      return new NextResponse("Payload Too Large", {
        status: 413,
        headers: { ...Object.fromEntries(noCacheHeaders), "Content-Type": "text/plain" },
      });
    }

    if (!rawBody || rawBody.trim().length === 0) {
      return new NextResponse("Bad Request: Empty Body", {
        status: 400,
        headers: { ...Object.fromEntries(noCacheHeaders), "Content-Type": "text/plain" },
      });
    }

    // 3. JSON Parsing & Schema Validation
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return new NextResponse("Bad Request: Malformed JSON", {
        status: 400,
        headers: { ...Object.fromEntries(noCacheHeaders), "Content-Type": "text/plain" },
      });
    }

    if (typeof parsed !== "object" || parsed === null) {
      return new NextResponse("Bad Request: Invalid Schema", {
        status: 400,
        headers: { ...Object.fromEntries(noCacheHeaders), "Content-Type": "text/plain" },
      });
    }

    if (Array.isArray(parsed) && parsed.length === 0) {
      return new NextResponse("Bad Request: Empty Array", {
        status: 400,
        headers: { ...Object.fromEntries(noCacheHeaders), "Content-Type": "text/plain" },
      });
    }

    // 4. Rate Limiting Check (Fail safe if DB offline, enforce 429 if limit exceeded)
    try {
      const rateLimit = await checkRateLimit("csp_report_submission", 60, 1);
      if (!rateLimit.success && rateLimit.error === "Too many attempts. Please try again later.") {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: { ...Object.fromEntries(noCacheHeaders), "Content-Type": "text/plain" },
        });
      }
    } catch {
      // Ingestion resilience: Allow safe parsing if rate-limit store is temporarily offline
    }

    // 5. Batch Bounding: Process at most 10 items, discard excess safely
    const reportsToProcess: unknown[] = Array.isArray(parsed)
      ? parsed.slice(0, MAX_BATCH_REPORTS)
      : [parsed];

    const telemetryEvents: SanitizedTelemetryEvent[] = [];

    for (const item of reportsToProcess) {
      if (typeof item !== "object" || item === null) continue;

      const record = item as Record<string, unknown>;
      const cspBody = (record["csp-report"] || record["body"] || record) as Record<string, unknown>;

      if (typeof cspBody !== "object" || cspBody === null) continue;

      const rawDocUri = typeof cspBody["document-uri"] === "string" 
        ? cspBody["document-uri"] 
        : typeof cspBody["documentURL"] === "string" 
          ? cspBody["documentURL"] 
          : "";

      const rawBlockedUri = typeof cspBody["blocked-uri"] === "string" 
        ? cspBody["blocked-uri"] 
        : typeof cspBody["blockedURL"] === "string" 
          ? cspBody["blockedURL"] 
          : "";

      // Self-Report Loop Protection: Ignore reports generated by the report endpoint itself
      if (rawDocUri.includes("/api/security/csp-report") || rawBlockedUri.includes("/api/security/csp-report")) {
        continue;
      }

      const rawDirective = typeof cspBody["effective-directive"] === "string" 
        ? cspBody["effective-directive"] 
        : typeof cspBody["violated-directive"] === "string" 
          ? cspBody["violated-directive"] 
          : "unknown";

      const effectiveDirective = rawDirective.slice(0, 50);
      const routeGroup = extractRouteGroup(rawDocUri);
      const blockedOrigin = extractBlockedOrigin(rawBlockedUri);

      telemetryEvents.push({
        event: "csp_violation",
        environment: process.env.NODE_ENV || "development",
        effectiveDirective,
        blockedOrigin,
        documentRouteGroup: routeGroup,
        count: 1,
      });
    }

    // 6. Return 204 No Content without Content-Type header and with zero body length
    return new NextResponse(null, {
      status: 204,
      headers: noCacheHeaders,
    });
  } catch {
    return new NextResponse("Internal Error", {
      status: 500,
      headers: { ...Object.fromEntries(noCacheHeaders), "Content-Type": "text/plain" },
    });
  }
}
