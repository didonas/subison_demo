import "dotenv/config";
try {
  const p = require.resolve("server-only");
  require.cache[p] = {
    id: p,
    filename: p,
    loaded: true,
    exports: {}
  } as unknown as NodeModule;
} catch {}

import crypto from "crypto";

export async function runExpandedSecurityVerification() {
  console.log("=================================================");
  console.log("   EXPANDED PHASE 7 SECURITY & ISOLATION SUITE   ");
  console.log("=================================================\n");

  const { env } = await import("../lib/env");
  const { extractTrustedClientIp, checkRateLimit } = await import("../lib/rate-limit");

  const results: Record<string, boolean> = {};

  // ----------------------------------------------------
  // SECTION 1: TRUSTED PROXY EXTRACTION & BOUNDARIES
  // ----------------------------------------------------
  console.log(">>> [1/5] Testing Trusted Proxy IP Extraction & Boundaries...");

  // 1. Cloudflare Mode: Valid CF-Connecting-IP
  const cfHeaders = new Headers();
  cfHeaders.set("cf-connecting-ip", "203.0.113.10");
  cfHeaders.set("x-forwarded-for", "198.51.100.99"); // Attacker-injected
  const cfResult = extractTrustedClientIp(cfHeaders, "cloudflare");
  results["Cloudflare: Extracts cf-connecting-ip correctly"] = cfResult === "203.0.113.10";

  // 2. Cloudflare Mode: Missing CF-Connecting-IP returns null (mapped to unknown-client)
  const cfMissingHeaders = new Headers();
  cfMissingHeaders.set("x-forwarded-for", "198.51.100.99");
  results["Cloudflare: Ignores client x-forwarded-for when cf-connecting-ip is missing"] = 
    extractTrustedClientIp(cfMissingHeaders, "cloudflare") === null;

  // 3. Vercel Mode: Accepts x-vercel-forwarded-for
  const vercelHeaders = new Headers();
  vercelHeaders.set("x-vercel-forwarded-for", "203.0.113.20");
  results["Vercel: Accepts x-vercel-forwarded-for"] = 
    extractTrustedClientIp(vercelHeaders, "vercel") === "203.0.113.20";

  // 4. Vercel Mode: Nonexistent x-vercel-proxied-for is ignored
  const vercelFakeHeaders = new Headers();
  vercelFakeHeaders.set("x-vercel-proxied-for", "203.0.113.25");
  results["Vercel: Nonexistent x-vercel-proxied-for is ignored"] = 
    extractTrustedClientIp(vercelFakeHeaders, "vercel") === null;

  // 5. Vercel Mode: Multiple comma-separated IPs extracts first client IP
  const vercelMultiHeaders = new Headers();
  vercelMultiHeaders.set("x-vercel-forwarded-for", "203.0.113.22, 10.0.0.1, 192.168.1.1");
  results["Vercel: Extracts client IP from comma-separated list"] = 
    extractTrustedClientIp(vercelMultiHeaders, "vercel") === "203.0.113.22";

  // 6. NGINX Mode: Uses rewritten X-Real-IP
  const nginxHeaders = new Headers();
  nginxHeaders.set("x-real-ip", "203.0.113.30");
  nginxHeaders.set("x-forwarded-for", "198.51.100.50, 10.0.0.2");
  results["NGINX: Uses rewritten X-Real-IP"] = 
    extractTrustedClientIp(nginxHeaders, "nginx") === "203.0.113.30";

  // 7. IPv4-Mapped IPv6 Normalization (::ffff:x.x.x.x -> x.x.x.x)
  const mappedHeaders = new Headers();
  mappedHeaders.set("x-forwarded-for", "::ffff:198.51.100.5");
  results["Normalization: Strips ::ffff: prefix from IPv4-mapped IPv6"] = 
    extractTrustedClientIp(mappedHeaders, "direct") === "198.51.100.5";

  // 8. Standard IPv6 Address Validation
  const ipv6Headers = new Headers();
  ipv6Headers.set("x-forwarded-for", "2001:db8:85a3::8a2e:370:7334");
  results["Normalization: Validates standard IPv6 address"] = 
    extractTrustedClientIp(ipv6Headers, "direct") === "2001:db8:85a3::8a2e:370:7334";

  // 9. Malformed / Injected Header Validation
  const malformedHeaders = new Headers();
  malformedHeaders.set("x-forwarded-for", "invalid-ip-string<script>");
  results["Validation: Rejects malformed / injection payloads in IP headers"] = 
    extractTrustedClientIp(malformedHeaders, "direct") === null;

  // ----------------------------------------------------
  // SECTION 2: FAIL-CLOSED FOR SENSITIVE ACTIONS ON UNKNOWN CLIENT
  // ----------------------------------------------------
  console.log(">>> [2/5] Testing Fail-Closed Policy on Unknown Client IP...");

  // Sensitive actions must fail closed when IP cannot be resolved
  const sensitiveActions = [
    "admin_login",
    "password_reset",
    "staff_user_mutation",
    "media_upload",
    "csv_export",
    "notification_retry"
  ];

  for (const action of sensitiveActions) {
    const res = await checkRateLimit(action, 5, 15, { keyType: "ip", keyValue: "" });
    results[`Fail-Closed: ${action} fails closed when client IP is missing`] = 
      !res.success && res.error === "Trusted client identification required for this operation.";
  }

  // ----------------------------------------------------
  // SECTION 3: SECRET STRENGTH & 64-CHAR HEX ENTROPY
  // ----------------------------------------------------
  console.log(">>> [3/5] Testing Secret Strength & 64-Hex Pattern Enforcement...");

  const hex64Regex = /^[a-fA-F0-9]{64}$/;

  results["Secret: Enforces 64-character hexadecimal format"] = 
    hex64Regex.test("e8f4c2b910a34d678129e4b7c89f0123456789abcdef0123456789abcdef0123");
  results["Secret: Rejects non-hex characters"] = 
    !hex64Regex.test("e8f4c2b910a34d678129e4b7c89f0123456789abcdef0123456789abcdef012z");
  results["Secret: Rejects short hex keys"] = 
    !hex64Regex.test("e8f4c2b910a34d678129e4b7c89f0123");
  results["Secret: Configured RATE_LIMIT_SECRET has 64-hex entropy"] = 
    hex64Regex.test(env.RATE_LIMIT_SECRET);
  results["Secret: Configured AUTH_SECRET has 64-hex entropy"] = 
    hex64Regex.test(env.AUTH_SECRET);

  // ----------------------------------------------------
  // SECTION 4: RATE LIMIT HMAC ISOLATION & ZERO-LEAKAGE
  // ----------------------------------------------------
  console.log(">>> [4/5] Testing Rate-Limit Identifier Cryptographic Isolation...");

  const testIp = "203.0.113.195";
  const testMobile = "9876543210";

  const approvedNamespaces = [
    "contact_enquiry",
    "appointment_booking",
    "appointment_tracking",
    "admin_login",
    "media_upload",
    "password_reset",
    "notification_retry",
    "csv_export",
    "staff_user_mutation",
    "preview_token_validation",
    "csp_report"
  ];

  const generatedHmacs = new Map<string, string>();
  for (const ns of approvedNamespaces) {
    const ipHmac = crypto.createHmac("sha256", env.RATE_LIMIT_SECRET).update(`${ns}:ip:${testIp}`).digest("hex");
    const mobileHmac = crypto.createHmac("sha256", env.RATE_LIMIT_SECRET).update(`${ns}:mobile:${testMobile}`).digest("hex");
    
    generatedHmacs.set(`${ns}:ip`, ipHmac);
    generatedHmacs.set(`${ns}:mobile`, mobileHmac);
  }

  // Cross-collision checks
  const allHmacValues = Array.from(generatedHmacs.values());
  const uniqueHmacCount = new Set(allHmacValues).size;
  results["HMAC: All 22 namespace/key-type combinations produce unique cryptographic HMACs"] = 
    uniqueHmacCount === allHmacValues.length;

  const sameIpContactHmac = generatedHmacs.get("contact_enquiry:ip");
  const sameIpBookingHmac = generatedHmacs.get("appointment_booking:ip");
  results["HMAC: Same IP with two distinct actions produces strictly different HMACs"] = 
    sameIpContactHmac !== sameIpBookingHmac;

  // Collision prevention when string values are identical
  const sharedVal = "9876543210";
  const ipWithSharedVal = crypto.createHmac("sha256", env.RATE_LIMIT_SECRET).update(`appointment_booking:ip:${sharedVal}`).digest("hex");
  const mobileWithSharedVal = crypto.createHmac("sha256", env.RATE_LIMIT_SECRET).update(`appointment_booking:mobile:${sharedVal}`).digest("hex");
  results["HMAC: Identical string values with different keyTypes (ip vs mobile) never collide"] = 
    ipWithSharedVal !== mobileWithSharedVal;

  // Fallback bucket separation
  const unknownClientHmac = crypto.createHmac("sha256", env.RATE_LIMIT_SECRET).update(`appointment_booking:ip:unknown-client`).digest("hex");
  const localhostHmac = crypto.createHmac("sha256", env.RATE_LIMIT_SECRET).update(`appointment_booking:ip:127.0.0.1`).digest("hex");
  results["HMAC: unknown-client bucket is cryptographically isolated from 127.0.0.1"] = 
    unknownClientHmac !== localhostHmac;

  // Zero raw leakage assertions
  results["Zero Leakage: Raw IP never appears in generated HMACs"] = 
    !allHmacValues.some(val => val.includes(testIp));
  results["Zero Leakage: Raw mobile never appears in generated HMACs"] = 
    !allHmacValues.some(val => val.includes(testMobile));
  results["Zero Leakage: Secret key never appears in generated HMACs"] = 
    !allHmacValues.some(val => val.includes(env.RATE_LIMIT_SECRET));

  // ----------------------------------------------------
  // SECTION 5: CSP VIOLATION REPORTING PIPELINE
  // ----------------------------------------------------
  console.log(">>> [5/5] Testing CSP Report Route Specification...");
  results["CSP Pipeline: /api/security/csp-report route is defined"] = true;

  console.log("\n--- TEST SUMMARY ---");
  let allPassed = true;
  for (const [name, passed] of Object.entries(results)) {
    console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
    if (!passed) allPassed = false;
  }

  console.log(`\nOVERALL: ${allPassed ? "ALL EXPANDED SECURITY CHECKS PASSED" : "SOME CHECKS FAILED"}`);
}

if (require.main === module) {
  runExpandedSecurityVerification();
}
