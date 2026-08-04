import { revalidatePath } from "next/cache";

function safeRevalidate(path: string, type?: "page" | "layout") {
  try {
    revalidatePath(path, type);
  } catch {
    // In test or non-request execution context, revalidatePath is a no-op
  }
}

export async function revalidateEntityCache(
  entityType: "SPECIALITY" | "TREATMENT" | "FACILITY" | "DOCTOR" | "TESTIMONIAL" | "ARTICLE" | "FAQ" | "SETTINGS" | "NAVIGATION",
  slugOrId?: string,
  isFeatured?: boolean
): Promise<string[]> {
  const revalidatedPaths: string[] = [];

  switch (entityType) {
    case "SPECIALITY":
      safeRevalidate("/[locale]/specialities", "page");
      revalidatedPaths.push("/en/specialities", "/ta/specialities");
      if (slugOrId) {
        safeRevalidate("/[locale]/specialities/[slug]", "page");
        revalidatedPaths.push(`/en/specialities/${slugOrId}`, `/ta/specialities/${slugOrId}`);
      }
      if (isFeatured) {
        safeRevalidate("/[locale]", "page");
        revalidatedPaths.push("/en", "/ta");
      }
      break;

    case "TREATMENT":
      safeRevalidate("/[locale]/treatments", "page");
      revalidatedPaths.push("/en/treatments", "/ta/treatments");
      if (slugOrId) {
        safeRevalidate("/[locale]/treatments/[slug]", "page");
        revalidatedPaths.push(`/en/treatments/${slugOrId}`, `/ta/treatments/${slugOrId}`);
      }
      if (isFeatured) {
        safeRevalidate("/[locale]", "page");
        revalidatedPaths.push("/en", "/ta");
      }
      break;

    case "FACILITY":
      safeRevalidate("/[locale]/facilities", "page");
      revalidatedPaths.push("/en/facilities", "/ta/facilities");
      safeRevalidate("/[locale]", "page");
      revalidatedPaths.push("/en", "/ta");
      break;

    case "DOCTOR":
      safeRevalidate("/[locale]/doctor", "page");
      safeRevalidate("/[locale]/about", "page");
      safeRevalidate("/[locale]", "page");
      revalidatedPaths.push("/en/doctor", "/ta/doctor", "/en/about", "/ta/about");
      break;

    case "TESTIMONIAL":
      safeRevalidate("/[locale]", "page");
      revalidatedPaths.push("/en", "/ta");
      break;

    case "ARTICLE":
      safeRevalidate("/[locale]/articles", "page");
      revalidatedPaths.push("/en/articles", "/ta/articles");
      if (slugOrId) {
        safeRevalidate("/[locale]/articles/[slug]", "page");
        revalidatedPaths.push(`/en/articles/${slugOrId}`, `/ta/articles/${slugOrId}`);
      }
      break;

    case "FAQ":
      safeRevalidate("/[locale]", "page");
      safeRevalidate("/[locale]/contact", "page");
      revalidatedPaths.push("/en", "/ta", "/en/contact", "/ta/contact");
      break;

    case "SETTINGS":
    case "NAVIGATION":
      safeRevalidate("/[locale]", "layout");
      revalidatedPaths.push("/en (layout)", "/ta (layout)");
      break;
  }

  // Revalidate sitemap
  safeRevalidate("/sitemap.xml");

  return revalidatedPaths;
}
