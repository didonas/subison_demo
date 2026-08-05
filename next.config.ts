import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const rawAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";
const publicAppUrl = rawAppUrl.startsWith("http://") || rawAppUrl.startsWith("https://")
  ? rawAppUrl
  : `https://${rawAppUrl}`;
let cspReportEndpoint = "http://localhost:3000/api/security/csp-report";
try {
  cspReportEndpoint = new URL("/api/security/csp-report", publicAppUrl).toString();
} catch {
  cspReportEndpoint = `${publicAppUrl.replace(/\/$/, "")}/api/security/csp-report`;
}

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
  "report-uri /api/security/csp-report",
  "report-to csp-endpoint"
].join("; ");

const isProduction = process.env.NODE_ENV === "production" && process.env.APP_ENV === "production";

const securityHeaders = [
  {
    key: "Content-Security-Policy-Report-Only",
    value: cspHeader,
  },
  {
    key: "Reporting-Endpoints",
    value: `csp-endpoint="${cspReportEndpoint}"`,
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
  // HSTS initial rollout: 1 day without includeSubDomains until all subdomains are verified in production
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=86400",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Production images delivered via cloud CDN transformations, avoiding nested Sharp runtime calls
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
