import { sanitizeHtml, validateMedicalContent, formatMedicalArticle } from "../lib/cms/sanitizer";
import { generateCanonicalSlug, validateSlug } from "../lib/cms/slug-service";
import { validateUploadedMedia } from "../lib/cms/media-service";
import { generatePreviewToken, isPreviewTokenValid } from "../lib/cms/preview-service";
import { revalidateEntityCache } from "../lib/cms/revalidation";
import {
  AdminPermission,
  DEFAULT_ROLE_PERMISSIONS,
  computeClientPermissionFlags,
} from "../lib/admin/permissions.shared";
import {
  SpecialityInputSchema,
  DoctorProfileInputSchema,
  TestimonialInputSchema,
  VideoItemInputSchema,
} from "../lib/cms/types";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
  }
}

export async function runPhase5Verification() {
  console.log("=================================================");
  console.log("  SUBISON NEURO CENTRE - PHASE 5 CMS VERIFICATION");
  console.log("=================================================");

  // 1. HTML Sanitization & Stored XSS Prevention
  console.log("\nGroup 1: HTML Sanitizer & XSS Prevention");
  const scriptInput = "<p>Welcome to Subison Neuro</p><script>alert('xss')</script>";
  assert(sanitizeHtml(scriptInput) === "<p>Welcome to Subison Neuro</p>", "Strips <script> tags entirely");

  const onclickInput = `<button onclick="evil()">Click me</button>`;
  assert(sanitizeHtml(onclickInput) === "<button>Click me</button>", "Strips inline event handlers (onclick)");

  const badHref = `<a href="javascript:alert(1)">Learn more</a>`;
  assert(sanitizeHtml(badHref) === '<a href="#">Learn more</a>', "Neutralizes javascript: URL scheme to #");

  const externalLink = `<a href="https://external-medical-journal.org/paper">External Article</a>`;
  const sanitizedExternal = sanitizeHtml(externalLink);
  assert(
    sanitizedExternal.includes('rel="noopener noreferrer"') && sanitizedExternal.includes('target="_blank"'),
    "Injects rel='noopener noreferrer' and target='_blank' on external links"
  );

  // 2. Medical Claims & Marketing Safeguards
  console.log("\nGroup 2: Medical Content Validation & Safeguards");
  const unscientificClaim = "Our neuro clinic guarantees 100% cure for all migraine cases.";
  const claimCheck1 = validateMedicalContent(unscientificClaim);
  assert(!claimCheck1.isValid && claimCheck1.flaggedTerms.includes("100% cure"), "Flags prohibited superlative claim '100% cure'");

  const legitClinicalText = "Comprehensive management protocols for chronic migraine and tension headaches.";
  const claimCheck2 = validateMedicalContent(legitClinicalText);
  assert(claimCheck2.isValid && claimCheck2.flaggedTerms.length === 0, "Accepts accurate clinical educational copy");

  const formattedArticle = formatMedicalArticle("<p>Overview of epilepsy management.</p>");
  assert(
    formattedArticle.includes("Medical Disclaimer:") && formattedArticle.includes("educational purposes"),
    "Appends mandatory statutory medical disclaimer to educational articles"
  );

  // 3. Slug Generation & Routing Integrity
  console.log("\nGroup 3: Canonical Slug Validation");
  assert(generateCanonicalSlug("Headache & Migraine Clinic!") === "headache-migraine-clinic", "Normalizes titles to clean URL slugs");
  
  const validSlugCheck = validateSlug("neuro-icu-care");
  assert(validSlugCheck.isValid, "Validates compliant kebab-case slug");

  const collisionSlugCheck = validateSlug("admin");
  assert(!collisionSlugCheck.isValid, "Rejects reserved route keyword 'admin'");

  const duplicateSlugCheck = validateSlug("stroke-unit", ["stroke-unit", "headache-clinic"]);
  assert(!duplicateSlugCheck.isValid, "Detects slug collision against existing database records");

  // 4. Binary Signature & Magic Byte Media Validation
  console.log("\nGroup 4: Media Upload & Binary Security");
  const fakeJpg = Buffer.from("not an actual image file payload");
  const fakeJpgCheck = validateUploadedMedia(fakeJpg, "malicious.jpg", "image/jpeg");
  assert(!fakeJpgCheck.isValid, "Rejects renamed non-JPEG file masking with .jpg extension");

  const realJpgHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const realJpgCheck = validateUploadedMedia(realJpgHeader, "facility-mri.jpg", "image/jpeg");
  assert(realJpgCheck.isValid, "Validates authentic JPEG magic bytes (FF D8 FF)");

  const realPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const realPngCheck = validateUploadedMedia(realPngHeader, "eeg-report-sample.png", "image/png");
  assert(realPngCheck.isValid, "Validates authentic PNG magic bytes (89 50 4E 47)");

  const realPdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
  const realPdfCheck = validateUploadedMedia(realPdfHeader, "patient_guide.pdf", "application/pdf");
  assert(realPdfCheck.isValid, "Validates authentic PDF magic bytes (%PDF)");

  // 5. Cache Invalidation Matrix
  console.log("\nGroup 5: Cache Revalidation Engine");
  const revalTags = await revalidateEntityCache("SPECIALITY", "stroke-unit", false);
  assert(revalTags.includes("/en/specialities/stroke-unit") && revalTags.includes("/ta/specialities/stroke-unit"), "Generates targeted bilingual revalidation paths for published entity");

  const doctorReval = await revalidateEntityCache("DOCTOR");
  assert(doctorReval.includes("/en/doctor") && doctorReval.includes("/ta/doctor"), "Revalidates doctor profiles across English and Tamil routes");

  // 6. Preview Token Security
  console.log("\nGroup 6: Draft Preview System");
  const tokenPayload = generatePreviewToken("SPECIALITY", "spec-123", 60);
  assert(tokenPayload.token.length === 64, "Generates 64-char cryptographically secure token");
  assert(isPreviewTokenValid(tokenPayload.expiresAt), "Validates active unexpired preview token");
  const expiredDate = new Date(Date.now() - 1000);
  assert(!isPreviewTokenValid(expiredDate), "Rejects expired preview token");

  // 7. RBAC Matrix Verification
  console.log("\nGroup 7: RBAC Access Control Matrix");
  const editorPerms = DEFAULT_ROLE_PERMISSIONS.CONTENT_EDITOR;
  const editorFlags = computeClientPermissionFlags(editorPerms as AdminPermission[]);
  assert(editorFlags.canViewCms, "Content Editor can view CMS");
  assert(editorFlags.canCreateContent, "Content Editor can create content");
  assert(editorFlags.canEditContent, "Content Editor can edit content");
  assert(!editorFlags.canViewAppointments, "Content Editor CANNOT view appointments (Isolation verified)");
  assert(!editorFlags.canViewPatientDetails, "Content Editor CANNOT view patient details");
  assert(!editorFlags.canViewAuditLogs, "Content Editor CANNOT view audit logs");
  assert(!editorFlags.canPublishContent, "Content Editor CANNOT publish content by default");

  const receptionistPerms = DEFAULT_ROLE_PERMISSIONS.RECEPTIONIST;
  const receptionistFlags = computeClientPermissionFlags(receptionistPerms as AdminPermission[]);
  assert(!receptionistFlags.canViewCms, "Receptionist has NO CMS access");
  assert(receptionistFlags.canViewAppointments, "Receptionist has appointment access");

  const adminPerms = DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN;
  const adminFlags = computeClientPermissionFlags(adminPerms as AdminPermission[]);
  assert(adminFlags.canViewCms && adminFlags.canPublishContent && adminFlags.canViewAppointments, "Super Admin has full CMS and operations privileges");

  // 8. Schema Validators for CMS Models
  console.log("\nGroup 8: CMS Schema Zod Validation");
  const validSpeciality = SpecialityInputSchema.safeParse({
    slug: "stroke-unit",
    status: "DRAFT",
    displayOrder: 1,
    translations: {
      en: {
        title: "Comprehensive Stroke Unit",
        summary: "24/7 hyperacute stroke diagnosis and mechanical thrombectomy.",
        symptoms: ["Sudden facial droop", "Arm weakness", "Slurred speech"],
      },
    },
  });
  assert(validSpeciality.success, "Validates complete bilingual Speciality schema payload");

  const validDoctor = DoctorProfileInputSchema.safeParse({
    doctorId: "doc-123",
    qualifications: "MD, DM (Neuro)",
    registrationNumber: "TN-MED-98765",
    specialisation: "Interventional Neurology",
    experienceYears: 18,
    consultationFee: 700,
    areasOfExpertise: ["Stroke Interventions", "Epilepsy", "Headache Medicine"],
    bioEn: "Senior Consultant Neurologist & Interventional Specialist",
  });
  assert(validDoctor.success, "Validates Doctor Profile with clinical registration & credentials");

  const validTestimonial = TestimonialInputSchema.safeParse({
    patientDisplayName: "K. Rajendran",
    content: "Excellent diagnostic care and compassionate recovery support.",
    hasConsent: true,
    status: "APPROVED",
  });
  assert(validTestimonial.success, "Validates patient testimonial with explicit consent compliance");

  const validVideo = VideoItemInputSchema.safeParse({
    provider: "YOUTUBE",
    videoId: "dQw4w9WgXcQ",
    titleEn: "Understanding Stroke Warning Signs",
  });
  assert(validVideo.success && validVideo.data.videoId === "dQw4w9WgXcQ", "Validates Video item schema with YouTube videoId");

  console.log("=================================================");
  console.log(`  SUMMARY: ${passedCount}/${totalCount} tests PASSED`);
  console.log("=================================================");
  return passedCount === totalCount;
}

runPhase5Verification().catch((err) => {
  console.error("Verification failed with unhandled exception:", err);
  process.exit(1);
});
