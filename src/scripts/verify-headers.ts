import "dotenv/config";
import nextConfig from "../../next.config";

export async function verifyConfiguredHeaders() {
  console.log("=================================================");
  console.log("      SECURITY HEADERS CONFIGURATION SUITE       ");
  console.log("=================================================\n");

  const results: Record<string, boolean> = {};

  if (typeof nextConfig.headers !== "function") {
    console.error("nextConfig.headers is not a function");
    return;
  }

  const headerRules = await nextConfig.headers();
  const globalRule = headerRules.find(r => r.source === "/:path*");

  results["Headers: Global rule /:path* is configured"] = !!globalRule;

  if (globalRule) {
    const headersMap = new Map(globalRule.headers.map(h => [h.key.toLowerCase(), h.value]));

    // 1. Reporting-Endpoints Header
    const reportingEndpoints = headersMap.get("reporting-endpoints") || "";
    results["Reporting-Endpoints: Present"] = headersMap.has("reporting-endpoints");
    results["Reporting-Endpoints: Name is csp-endpoint"] = reportingEndpoints.startsWith('csp-endpoint=');
    results["Reporting-Endpoints: Value is properly quoted URL"] = /^csp-endpoint="https?:\/\/[^"]+\/api\/security\/csp-report"$/.test(reportingEndpoints);

    // 2. CSP Report-Only Header
    const csp = headersMap.get("content-security-policy-report-only") || "";
    results["CSP: Report-Only header is present"] = headersMap.has("content-security-policy-report-only");
    results["CSP: Contains report-to csp-endpoint"] = csp.includes("report-to csp-endpoint");
    results["CSP: Contains report-uri fallback"] = csp.includes("report-uri /api/security/csp-report");
    results["CSP: Contains frame-ancestors 'none'"] = csp.includes("frame-ancestors 'none'");
    results["CSP: Contains object-src 'none'"] = csp.includes("object-src 'none'");
    results["CSP: Unapproved third-party domains (unsplash) removed"] = !csp.includes("unsplash.com");

    // 3. Security Hardening Headers
    results["Security Headers: X-Frame-Options is DENY"] = headersMap.get("x-frame-options") === "DENY";
    results["Security Headers: X-Content-Type-Options is nosniff"] = headersMap.get("x-content-type-options") === "nosniff";
    results["Security Headers: Cross-Origin-Opener-Policy is same-origin"] = headersMap.get("cross-origin-opener-policy") === "same-origin";
    results["Security Headers: Cross-Origin-Resource-Policy is same-origin"] = headersMap.get("cross-origin-resource-policy") === "same-origin";
    results["Security Headers: X-Permitted-Cross-Domain-Policies is none"] = headersMap.get("x-permitted-cross-domain-policies") === "none";
  }

  console.log("\n--- TEST SUMMARY ---");
  let allPassed = true;
  for (const [name, passed] of Object.entries(results)) {
    console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
    if (!passed) allPassed = false;
  }

  console.log(`\nOVERALL: ${allPassed ? "ALL HEADER VERIFICATION CHECKS PASSED" : "SOME CHECKS FAILED"}`);
}

if (require.main === module) {
  verifyConfiguredHeaders();
}
