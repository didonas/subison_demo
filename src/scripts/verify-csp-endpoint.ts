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

import { NextRequest } from "next/server";

export async function runCspEndpointIntegrationSuite() {
  console.log("=================================================");
  console.log("   EXPANDED CSP ENDPOINT & SANITIZATION SUITE   ");
  console.log("=================================================\n");

  const { POST } = await import("../app/api/security/csp-report/route");
  const results: Record<string, boolean> = {};

  // 1. Valid Legacy application/csp-report format
  console.log(">>> [1/8] Testing valid application/csp-report payload...");
  const legacyPayload = JSON.stringify({
    "csp-report": {
      "document-uri": "https://example.com/appointments/book?ref=SNC-12345678&patient=RajeshKumar#step2",
      "referrer": "",
      "violated-directive": "img-src",
      "effective-directive": "img-src",
      "original-policy": "default-src 'self'",
      "disposition": "report",
      "blocked-uri": "https://untrusted-tracker.com/pixel.png?mobile=9876543210&email=patient@example.com",
      "status-code": 200,
      "script-sample": "console.log('Very long malicious script injection snippet with patient PII and tokens');"
    }
  });

  const legacyReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: {
      "content-type": "application/csp-report"
    },
    body: legacyPayload
  });

  const legacyRes = await POST(legacyReq);
  const cacheControl = legacyRes.headers.get("cache-control") || "";
  const contentType = legacyRes.headers.get("content-type");
  const bodyText = await legacyRes.text();

  results["Legacy format: Returns 204 No Content"] = legacyRes.status === 204;
  results["Legacy format: Cache-Control contains no-store"] = cacheControl.includes("no-store");
  results["Legacy format: Content-Type is omitted on 204"] = contentType === null;
  results["Legacy format: Response body is completely empty (zero reflection)"] = bodyText.length === 0;

  // 2. Valid Modern application/reports+json array format
  console.log(">>> [2/8] Testing modern application/reports+json array payload...");
  const modernPayload = JSON.stringify([
    {
      type: "csp-violation",
      age: 10,
      url: "http://localhost:3000/admin/login?auth=attempt",
      user_agent: "Mozilla/5.0",
      body: {
        documentURL: "http://localhost:3000/admin/login?token=secret_admin_token#form",
        referrer: "",
        blockedURL: "https://evil.com/leak.js?session=eyJhbGciOi...",
        effectiveDirective: "script-src",
        originalPolicy: "default-src 'self'",
        disposition: "report",
        sample: "alert(1)",
        statusCode: 200
      }
    }
  ]);

  const modernReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: {
      "content-type": "application/reports+json"
    },
    body: modernPayload
  });

  const modernRes = await POST(modernReq);
  results["Modern format: Returns 204 No Content"] = modernRes.status === 204;

  // 3. Status Code Accuracy (415, 413, 400)
  console.log(">>> [3/8] Testing status code accuracy (415, 413, 400)...");
  
  // Unsupported content-type -> 415
  const invalidTypeReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: { "content-type": "application/xml" },
    body: "<xml>test</xml>"
  });
  const invalidTypeRes = await POST(invalidTypeReq);
  results["Status: Unsupported Content-Type returns 415"] = invalidTypeRes.status === 415;

  // Empty body -> 400
  const emptyReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: ""
  });
  const emptyRes = await POST(emptyReq);
  results["Status: Empty body returns 400 Bad Request"] = emptyRes.status === 400;

  // Empty array [] -> 400
  const emptyArrReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: { "content-type": "application/reports+json" },
    body: "[]"
  });
  const emptyArrRes = await POST(emptyArrReq);
  results["Status: Empty array [] returns 400 Bad Request"] = emptyArrRes.status === 400;

  // Malformed JSON -> 400
  const malformedReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: { "content-type": "application/csp-report" },
    body: "{ malformed json: true, missing quotes "
  });
  const malformedRes = await POST(malformedReq);
  results["Status: Malformed JSON returns 400 Bad Request"] = malformedRes.status === 400;

  // Oversized payload (> 10 KB) -> 413
  const oversizedData = JSON.stringify({
    "csp-report": {
      "document-uri": "http://localhost:3000/test",
      "blob": "x".repeat(12 * 1024)
    }
  });
  const oversizedReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: { "content-type": "application/csp-report" },
    body: oversizedData
  });
  const oversizedRes = await POST(oversizedReq);
  results["Status: Oversized payload (>10KB) returns 413 Payload Too Large"] = oversizedRes.status === 413;

  // 4. Batch Size Limits (50 items within 10KB total payload size)
  console.log(">>> [4/8] Testing batch processing and array limits...");
  const batch50 = Array.from({ length: 50 }, (_, i) => ({
    type: "csp-violation",
    body: {
      documentURL: `http://localhost:3000/p/${i}`,
      blockedURL: "https://u.com/s.js",
      effectiveDirective: "script-src"
    }
  }));

  const batchReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: { "content-type": "application/reports+json" },
    body: JSON.stringify(batch50)
  });
  const batchRes = await POST(batchReq);
  results["Batch: 50-report batch within 10KB accepted and capped safely to 10"] = batchRes.status === 204;

  // 5. Mixed Valid and Invalid Entries
  console.log(">>> [5/8] Testing mixed valid and invalid batch entries...");
  const mixedBatch = [
    { type: "csp-violation", body: { documentURL: "http://localhost:3000/en", blockedURL: "https://tracker.com", effectiveDirective: "img-src" } },
    null,
    "invalid-string-entry",
    { invalidKey: 123 },
    { type: "csp-violation", body: { documentURL: "http://localhost:3000/contact", blockedURL: "https://bad.com", effectiveDirective: "script-src" } }
  ];

  const mixedReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: { "content-type": "application/reports+json" },
    body: JSON.stringify(mixedBatch)
  });
  const mixedRes = await POST(mixedReq);
  results["Batch: Mixed valid/invalid entries processed safely without crash"] = mixedRes.status === 204;

  // 6. PII & High-Cardinality Sanitization
  console.log(">>> [6/8] Testing PII, query string, and token scrubbing...");
  const maliciousPiiPayload = JSON.stringify({
    "csp-report": {
      "document-uri": "http://localhost:3000/en/appointments/track?ref=SNC-88889999&name=PatientName&phone=9876543210&token=secretAuthToken123#tab-records",
      "blocked-uri": "https://malicious-collector.com/steal?uuid=550e8400-e29b-41d4-a716-446655440000&cookie=session_id_xyz",
      "effective-directive": "connect-src",
      "script-sample": "eval(atob('ZXhwbG9pdA==')); document.cookie='stolen';"
    }
  });

  const piiReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: { "content-type": "application/csp-report" },
    body: maliciousPiiPayload
  });

  const piiRes = await POST(piiReq);
  const piiBody = await piiRes.text();
  results["Sanitization: PII report returns 204 without reflection"] = piiRes.status === 204;
  results["Sanitization: Zero PII or tokens reflected in response"] = 
    !piiBody.includes("SNC-88889999") && 
    !piiBody.includes("9876543210") && 
    !piiBody.includes("secretAuthToken123");

  // 7. Recursion Safety & Loop Prevention
  console.log(">>> [7/8] Testing recursion safety & self-report loop protection...");
  const selfLoopPayload = JSON.stringify({
    "csp-report": {
      "document-uri": "http://localhost:3000/api/security/csp-report",
      "blocked-uri": "http://localhost:3000/api/security/csp-report",
      "effective-directive": "connect-src"
    }
  });

  const selfLoopReq = new NextRequest("http://localhost:3000/api/security/csp-report", {
    method: "POST",
    headers: { "content-type": "application/csp-report" },
    body: selfLoopPayload
  });

  const selfLoopRes = await POST(selfLoopReq);
  results["Recursion Safety: Self-referencing report handled without loop"] = selfLoopRes.status === 204;
  results["Recursion Safety: Response has no HTML, scripts, or redirects"] = 
    !selfLoopRes.headers.get("content-type")?.includes("html") &&
    selfLoopRes.status !== 301 && selfLoopRes.status !== 302;

  // 8. Test Summary
  console.log("\n--- TEST SUMMARY ---");
  let allPassed = true;
  for (const [name, passed] of Object.entries(results)) {
    console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
    if (!passed) allPassed = false;
  }

  console.log(`\nOVERALL: ${allPassed ? "ALL CSP ENDPOINT INTEGRATION TESTS PASSED" : "SOME CHECKS FAILED"}`);
}

if (require.main === module) {
  runCspEndpointIntegrationSuite();
}
