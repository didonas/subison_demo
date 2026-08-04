import { MEDICAL_EDUCATIONAL_DISCLAIMER, PROHIBITED_MARKETING_TERMS } from "./types";

/**
 * Server-side HTML and text sanitization for CMS content.
 * Prevents stored XSS, strips dangerous tags/attributes, normalizes links.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  let sanitized = rawHtml;

  // 1. Remove script tags and contents
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // 2. Remove style tags and contents
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  
  // 3. Remove object, embed, applet, iframe tags
  sanitized = sanitized.replace(/<(object|embed|applet|iframe|meta|link|base)\b[^>]*>/gi, "");
  sanitized = sanitized.replace(/<\/(object|embed|applet|iframe|meta|link|base)>/gi, "");

  // 4. Strip inline event handlers (onclick, onerror, onload, onmouseover, etc.)
  sanitized = sanitized.replace(/\son[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 5. Neutralize javascript: and vbscript: URLs in href and src
  sanitized = sanitized.replace(/(href|src)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, '$1="#"');
  sanitized = sanitized.replace(/(href|src)\s*=\s*(?:'vbscript:[^']*'|"vbscript:[^"]*"|vbscript:[^\s>]+)/gi, '$1="#"');
  sanitized = sanitized.replace(/(href|src)\s*=\s*(?:'data:[^']*'|"data:[^"]*"|data:[^\s>]+)/gi, '$1="#"');

  // 6. Ensure external links have rel="noopener noreferrer"
  sanitized = sanitized.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(https?:\/\/[^"']+)\1([^>]*)>/gi, (match, quote, url, rest) => {
    const isExternal = !url.includes("subisonneuro.com") && !url.startsWith("/");
    if (isExternal) {
      // Remove any existing rel attribute
      const cleanRest = rest.replace(/\s+rel=(["'])[^"']*\1/gi, "");
      return `<a href="${url}"${cleanRest} target="_blank" rel="noopener noreferrer">`;
    }
    return match;
  });

  return sanitized.trim();
}

export const sanitizeCmsHtml = sanitizeHtml;

/**
 * Validate that text content does not contain prohibited medical marketing claims.
 */
export function validateMedicalContent(text: string): { isValid: boolean; flaggedTerms: string[] } {
  if (!text) return { isValid: true, flaggedTerms: [] };

  const lower = text.toLowerCase();
  const flaggedTerms: string[] = [];

  for (const term of PROHIBITED_MARKETING_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      flaggedTerms.push(term);
    }
  }

  return {
    isValid: flaggedTerms.length === 0,
    flaggedTerms,
  };
}

export const validateMedicalClaims = validateMedicalContent;

/**
 * Format article content with mandatory educational disclaimer if not already present.
 */
export function formatMedicalArticle(content: string): string {
  const clean = sanitizeHtml(content);
  if (!clean.includes("This content is provided for general educational purposes")) {
    return `${clean}\n\n<p class="text-xs text-muted-foreground italic border-t pt-4 mt-6"><strong>Medical Disclaimer:</strong> ${MEDICAL_EDUCATIONAL_DISCLAIMER}</p>`;
  }
  return clean;
}

export const formatWithMedicalDisclaimer = formatMedicalArticle;
