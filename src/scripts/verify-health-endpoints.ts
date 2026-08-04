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

import { prisma } from "../lib/prisma";
import { GET as healthGET } from "../app/api/health/route";
import { GET as liveGET } from "../app/api/health/live/route";
import { GET as readyGET } from "../app/api/health/ready/route";

export async function runHealthVerification() {
  console.log("=================================================");
  console.log("     HEALTH & PROBE ENDPOINTS VERIFICATION       ");
  console.log("=================================================\n");

  const results: Record<string, boolean> = {};

  // Check DB reachability directly to establish ground truth
  let isDbOnline = false;
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 1500));
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
    isDbOnline = true;
  } catch {
    isDbOnline = false;
  }

  console.log(`[STATE] Live Database Reachability: ${isDbOnline ? "ONLINE (200 expected for health/ready)" : "UNAVAILABLE (503 expected for health/ready, 200 for live)"}`);

  // 1. Test live endpoint (Always 200, no DB dependency)
  const liveRes = await liveGET();
  const liveData = await liveRes.json();
  const liveCache = liveRes.headers.get("cache-control");

  results["/api/health/live returns 200 OK"] = liveRes.status === 200 && liveData.status === "alive";
  results["/api/health/live includes Cache-Control: no-store"] = !!liveCache && liveCache.includes("no-store");
  results["/api/health/live returns exact minimal payload { status: 'alive' }"] = JSON.stringify(liveData) === JSON.stringify({ status: "alive" });
  results["/api/health/live leaks no credentials or stack traces"] = 
    !JSON.stringify(liveData).includes("password") && 
    !JSON.stringify(liveData).includes("postgres") &&
    !JSON.stringify(liveData).includes("Error");

  // 2. Test health endpoint
  const healthRes = await healthGET();
  const healthData = await healthRes.json();
  const healthCache = healthRes.headers.get("cache-control");

  if (isDbOnline) {
    results["/api/health returns 200 OK when DB is online"] = healthRes.status === 200 && healthData.status === "healthy";
    results["/api/health returns exact payload { status: 'healthy' }"] = JSON.stringify(healthData) === JSON.stringify({ status: "healthy" });
  } else {
    results["/api/health returns 503 Service Unavailable when DB is down"] = healthRes.status === 503 && healthData.status === "unhealthy";
    results["/api/health returns exact minimal payload { status: 'unhealthy' }"] = JSON.stringify(healthData) === JSON.stringify({ status: "unhealthy" });
  }
  results["/api/health includes Cache-Control: no-store"] = !!healthCache && healthCache.includes("no-store");
  results["/api/health leaks no stack trace or secrets"] = 
    !JSON.stringify(healthData).includes("at ") && 
    !JSON.stringify(healthData).includes("prisma") && 
    !JSON.stringify(healthData).includes("postgres");

  // 3. Test ready endpoint
  const readyRes = await readyGET();
  const readyData = await readyRes.json();
  const readyCache = readyRes.headers.get("cache-control");

  if (isDbOnline) {
    results["/api/health/ready returns 200 OK when DB is online"] = readyRes.status === 200 && readyData.status === "ready";
    results["/api/health/ready returns exact payload { status: 'ready' }"] = JSON.stringify(readyData) === JSON.stringify({ status: "ready" });
  } else {
    results["/api/health/ready returns 503 Service Unavailable when DB is down"] = readyRes.status === 503 && readyData.status === "not_ready";
    results["/api/health/ready returns exact minimal payload { status: 'not_ready' }"] = JSON.stringify(readyData) === JSON.stringify({ status: "not_ready" });
  }
  results["/api/health/ready includes Cache-Control: no-store"] = !!readyCache && readyCache.includes("no-store");
  results["/api/health/ready leaks no stack trace or secrets"] = 
    !JSON.stringify(readyData).includes("at ") && 
    !JSON.stringify(readyData).includes("prisma") && 
    !JSON.stringify(readyData).includes("postgres");

  console.log("\n--- HEALTH TEST RESULTS ---");
  let allPassed = true;
  for (const [name, passed] of Object.entries(results)) {
    console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
    if (!passed) allPassed = false;
  }

  console.log(`\nOVERALL: ${allPassed ? "ALL HEALTH CHECKS PASSED" : "SOME HEALTH CHECKS FAILED"}`);
}

if (require.main === module) {
  runHealthVerification();
}
