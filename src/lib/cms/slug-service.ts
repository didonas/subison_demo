export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "appointments",
  "book",
  "track",
  "success",
  "contact",
  "about",
  "doctor",
  "facilities",
  "specialities",
  "treatments",
  "gallery",
  "videos",
  "faqs",
  "articles",
  "news",
  "sitemap",
  "robots",
  "login",
  "en",
  "ta",
]);

/**
 * Normalizes text to a clean, lowercase, hyphen-separated canonical slug.
 */
export function generateCanonicalSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters
    .replace(/[\s_-]+/g, "-") // Collapse whitespace and underscores into single dash
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing dashes
}

/**
 * Validates a slug against reserved words and structure.
 */
export function validateSlug(slug: string, existingSlugs?: string[]): { isValid: boolean; error?: string } {
  const normalized = slug.toLowerCase().trim();

  if (!normalized) {
    return { isValid: false, error: "Slug cannot be empty" };
  }

  if (normalized.length < 2 || normalized.length > 100) {
    return { isValid: false, error: "Slug length must be between 2 and 100 characters" };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return { isValid: false, error: "Slug must contain only lowercase alphanumeric characters and hyphens, and cannot start or end with a hyphen" };
  }

  if (RESERVED_SLUGS.has(normalized)) {
    return { isValid: false, error: `Slug "${normalized}" is a reserved system keyword and cannot be used` };
  }

  if (existingSlugs && existingSlugs.includes(normalized)) {
    return { isValid: false, error: `Slug "${normalized}" is already in use by another entity` };
  }

  return { isValid: true };
}
