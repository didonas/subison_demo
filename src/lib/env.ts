import { z } from "zod";

const isStrongSecret = (val: string) => {
  if (val.length < 32) return false;
  if (/^(.)\1+$/.test(val)) return false;
  const lower = val.toLowerCase();
  if (lower.includes("changeme") || lower.includes("secret123") || lower.includes("placeholder")) {
    return false;
  }
  return true;
};

const hex64Regex = /^[a-fA-F0-9]{64}$/;

const DISALLOWED_PLACEHOLDER_DOMAINS = [
  "example.com",
  "example.org",
  "example.net",
  "placeholder.com",
  "test.com",
  "mysite.com",
  "yourdomain.com",
];

const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),
    PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    DEVELOPMENT_PUBLIC_URL: z.string().url().optional(),
    STAGING_PUBLIC_URL: z.string().url().optional(),
    PRODUCTION_PUBLIC_URL: z.string().url().optional(),
    AUTH_SECRET: z.string().min(32).refine(isStrongSecret, {
      message: "AUTH_SECRET must be at least 32 characters and cannot be a predictable placeholder",
    }),
    SEED_ADMIN_EMAIL: z.string().email().optional(),
    SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
    SEED_ADMIN_NAME: z.string().min(2).optional(),
    TURNSTILE_SECRET_KEY: z.string(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string(),
    TURNSTILE_ENABLED: z.enum(["true", "false"]).default("true"),
    RATE_LIMIT_SECRET: z.string().min(32).refine(isStrongSecret, {
      message: "RATE_LIMIT_SECRET must be at least 32 characters (recommended: 64-character hex)",
    }),
    TRUSTED_PROXY_MODE: z.enum(["cloudflare", "vercel", "nginx", "direct"]).default("direct"),
    CSP_REPORT_ONLY: z.enum(["true", "false"]).default("true"),
    STORAGE_PROVIDER: z.enum(["local", "cloudinary", "s3"]).default("local"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
    APPOINTMENT_ADMIN_EMAIL: z.string().email().optional(),
    EMAIL_NOTIFICATIONS_ENABLED: z.enum(["true", "false"]).default("true"),
  })
  .superRefine((data, ctx) => {
    const effectiveProductionUrl = data.PRODUCTION_PUBLIC_URL || data.PUBLIC_APP_URL;

    // Strict Production URL Validation
    if (data.NODE_ENV === "production" && process.env.APP_ENV === "production") {
      try {
        const parsed = new URL(effectiveProductionUrl);

        // 1. Protocol must be HTTPS
        if (parsed.protocol !== "https:") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["PUBLIC_APP_URL"],
            message: "Production URL must use https://",
          });
        }

        // 2. Reject localhost and private IP ranges
        const hostname = parsed.hostname.toLowerCase();
        if (
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname.startsWith("192.168.") ||
          hostname.startsWith("10.") ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["PUBLIC_APP_URL"],
            message: "Production URL cannot use localhost or private IP addresses",
          });
        }

        // 3. Reject placeholders
        if (DISALLOWED_PLACEHOLDER_DOMAINS.some((d) => hostname.includes(d))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["PUBLIC_APP_URL"],
            message: "Production URL cannot use unapproved placeholder domains",
          });
        }

        // 4. Reject credentials in URL
        if (parsed.username || parsed.password) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["PUBLIC_APP_URL"],
            message: "Production URL cannot contain username or password credentials",
          });
        }

        // 5. Reject query strings and fragments
        if (parsed.search || parsed.hash) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["PUBLIC_APP_URL"],
            message: "Production URL cannot contain query strings or hash fragments",
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["PUBLIC_APP_URL"],
          message: "Invalid PUBLIC_APP_URL format",
        });
      }

      // Enforce 64-character hexadecimal format for production secrets
      if (!hex64Regex.test(data.AUTH_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["AUTH_SECRET"],
          message: "AUTH_SECRET must be a 64-character hexadecimal string in production",
        });
      }
      if (!hex64Regex.test(data.RATE_LIMIT_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RATE_LIMIT_SECRET"],
          message: "RATE_LIMIT_SECRET must be a 64-character hexadecimal string in production",
        });
      }
    }
  });

export const env = envSchema.parse(process.env);
