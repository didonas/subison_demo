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
    DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/postgres"),
    DIRECT_URL: z.string().optional(),
    PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
    DEVELOPMENT_PUBLIC_URL: z.string().optional(),
    STAGING_PUBLIC_URL: z.string().optional(),
    PRODUCTION_PUBLIC_URL: z.string().optional(),
    AUTH_SECRET: z.string().default("development_secret_key_minimum_32_characters_long_1234567890"),
    SEED_ADMIN_EMAIL: z.string().optional(),
    SEED_ADMIN_PASSWORD: z.string().optional(),
    SEED_ADMIN_NAME: z.string().optional(),
    TURNSTILE_SECRET_KEY: z.string().default("dummy-secret-key"),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().default("1x00000000000000000000AA"),
    TURNSTILE_ENABLED: z.enum(["true", "false"]).catch("false").default("false"),
    RATE_LIMIT_SECRET: z.string().default("development_secret_key_minimum_32_characters_long_1234567890"),
    TRUSTED_PROXY_MODE: z.enum(["cloudflare", "vercel", "nginx", "direct"]).catch("direct").default("direct"),
    CSP_REPORT_ONLY: z.enum(["true", "false"]).catch("true").default("true"),
    STORAGE_PROVIDER: z.enum(["local", "cloudinary", "s3"]).catch("local").default("local"),
    NODE_ENV: z.enum(["development", "test", "production"]).catch("development").default("development"),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().optional(),
    APPOINTMENT_ADMIN_EMAIL: z.string().optional(),
    EMAIL_NOTIFICATIONS_ENABLED: z.enum(["true", "false"]).catch("false").default("false"),
  });

const parseResult = envSchema.safeParse(process.env);
export const env = parseResult.success
  ? parseResult.data
  : {
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
      DIRECT_URL: process.env.DIRECT_URL,
      PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || "http://localhost:3000",
      AUTH_SECRET: process.env.AUTH_SECRET || "development_secret_key_minimum_32_characters_long_1234567890",
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || "dummy-secret-key",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
      TURNSTILE_ENABLED: (process.env.TURNSTILE_ENABLED as "true" | "false") || "false",
      RATE_LIMIT_SECRET: process.env.RATE_LIMIT_SECRET || "development_secret_key_minimum_32_characters_long_1234567890",
      TRUSTED_PROXY_MODE: (process.env.TRUSTED_PROXY_MODE as "cloudflare" | "vercel" | "nginx" | "direct") || "direct",
      CSP_REPORT_ONLY: (process.env.CSP_REPORT_ONLY as "true" | "false") || "true",
      STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER as "local" | "cloudinary" | "s3") || "local",
      NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "development",
      EMAIL_NOTIFICATIONS_ENABLED: (process.env.EMAIL_NOTIFICATIONS_ENABLED as "true" | "false") || "false",
    } as z.infer<typeof envSchema>;

