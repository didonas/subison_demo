import { z } from "zod";

export const CONTENT_STATUSES = {
  DRAFT: "DRAFT",
  IN_REVIEW: "IN_REVIEW",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type ContentStatusType = keyof typeof CONTENT_STATUSES;

export const TESTIMONIAL_STATUSES = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
} as const;

export type TestimonialStatusType = keyof typeof TESTIMONIAL_STATUSES;

export const FACILITY_VERIFICATION_STATUSES = {
  UNVERIFIED: "UNVERIFIED",
  VERIFIED: "VERIFIED",
} as const;

export type FacilityVerificationType = keyof typeof FACILITY_VERIFICATION_STATUSES;

export const VIDEO_PROVIDERS = {
  YOUTUBE: "YOUTUBE",
  VIMEO: "VIMEO",
} as const;

export type VideoProviderType = keyof typeof VIDEO_PROVIDERS;

// Medical educational disclaimer standard
export const MEDICAL_EDUCATIONAL_DISCLAIMER =
  "This content is provided for general educational purposes and does not replace consultation, diagnosis or treatment by a qualified medical professional.";

// Banned medical marketing terms (Prohibited claims)
export const PROHIBITED_MARKETING_TERMS = [
  "guaranteed cure",
  "100% cure",
  "miracle cure",
  "completely safe",
  "no complications",
  "zero risk",
  "permanent recovery",
  "100% success",
  "best hospital in world",
  "guaranteed outcome",
  "guaranteed results",
];

export const SpecialityInputSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  displayOrder: z.number().int().min(0).default(0),
  featuredImageId: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  version: z.number().int().min(1).default(1),
  translations: z.object({
    en: z.object({
      title: z.string().min(2, "English title is required"),
      summary: z.string().optional().nullable(),
      overview: z.string().optional().nullable(),
      symptoms: z.array(z.string()).optional().default([]),
      causes: z.array(z.string()).optional().default([]),
      whenToSeekCare: z.string().optional().nullable(),
      diagnosticApproach: z.string().optional().nullable(),
      treatmentApproach: z.string().optional().nullable(),
      seoTitle: z.string().max(70).optional().nullable(),
      seoDescription: z.string().max(160).optional().nullable(),
    }),
    ta: z.object({
      title: z.string().optional().default(""),
      summary: z.string().optional().nullable(),
      overview: z.string().optional().nullable(),
      symptoms: z.array(z.string()).optional().default([]),
      causes: z.array(z.string()).optional().default([]),
      whenToSeekCare: z.string().optional().nullable(),
      diagnosticApproach: z.string().optional().nullable(),
      treatmentApproach: z.string().optional().nullable(),
      seoTitle: z.string().max(70).optional().nullable(),
      seoDescription: z.string().max(160).optional().nullable(),
    }).optional(),
  }),
});

export type SpecialityInput = z.infer<typeof SpecialityInputSchema>;

export const TreatmentInputSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  displayOrder: z.number().int().min(0).default(0),
  featuredImageId: z.string().optional().nullable(),
  version: z.number().int().min(1).default(1),
  translations: z.object({
    en: z.object({
      title: z.string().min(2, "English title is required"),
      summary: z.string().optional().nullable(),
      overview: z.string().optional().nullable(),
      candidateConditions: z.array(z.string()).optional().default([]),
      preparationInfo: z.string().optional().nullable(),
      diagnosticProcess: z.string().optional().nullable(),
      treatmentApproach: z.string().optional().nullable(),
      recoveryInfo: z.string().optional().nullable(),
      risksAndLimitations: z.string().optional().nullable(),
      seoTitle: z.string().max(70).optional().nullable(),
      seoDescription: z.string().max(160).optional().nullable(),
    }),
    ta: z.object({
      title: z.string().optional().default(""),
      summary: z.string().optional().nullable(),
      overview: z.string().optional().nullable(),
      candidateConditions: z.array(z.string()).optional().default([]),
      preparationInfo: z.string().optional().nullable(),
      diagnosticProcess: z.string().optional().nullable(),
      treatmentApproach: z.string().optional().nullable(),
      recoveryInfo: z.string().optional().nullable(),
      risksAndLimitations: z.string().optional().nullable(),
      seoTitle: z.string().max(70).optional().nullable(),
      seoDescription: z.string().max(160).optional().nullable(),
    }).optional(),
  }),
});

export type TreatmentInput = z.infer<typeof TreatmentInputSchema>;

export const FacilityInputSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  verificationState: z.enum(["UNVERIFIED", "VERIFIED"]).default("UNVERIFIED"),
  displayOrder: z.number().int().min(0).default(0),
  featuredImageId: z.string().optional().nullable(),
  version: z.number().int().min(1).default(1),
  translations: z.object({
    en: z.object({
      name: z.string().min(2, "Facility name is required"),
      description: z.string().optional().nullable(),
      availabilityInfo: z.string().optional().nullable(),
    }),
    ta: z.object({
      name: z.string().optional().default(""),
      description: z.string().optional().nullable(),
      availabilityInfo: z.string().optional().nullable(),
    }).optional(),
  }),
});

export type FacilityInput = z.infer<typeof FacilityInputSchema>;

export const DoctorProfileInputSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  qualifications: z.string().min(2, "Qualifications required"),
  registrationNumber: z.string().min(2, "Registration number required"),
  specialisation: z.string().min(2, "Specialisation required"),
  experienceYears: z.number().int().min(0).max(80).optional().nullable(),
  training: z.string().optional().nullable(),
  areasOfExpertise: z.array(z.string()).optional().default([]),
  memberships: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default(["English", "Tamil"]),
  bioEn: z.string().optional().nullable(),
  bioTa: z.string().optional().nullable(),
  consultationFee: z.number().min(0, "Consultation fee must be non-negative"),
  publicNotice: z.string().optional().nullable(),
  isVerified: z.boolean().default(false),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  version: z.number().int().min(1).default(1),
});

export type DoctorProfileInput = z.infer<typeof DoctorProfileInputSchema>;

export const TestimonialInputSchema = z.object({
  patientDisplayName: z.string().min(2, "Patient display name required"),
  patientLocation: z.string().optional().nullable(),
  content: z.string().min(10, "Testimonial content required"),
  status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED", "ARCHIVED"]).default("PENDING_REVIEW"),
  displayOrder: z.number().int().min(0).default(0),
  hasConsent: z.boolean().default(false),
  consentDate: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  version: z.number().int().min(1).default(1),
});

export type TestimonialInput = z.infer<typeof TestimonialInputSchema>;

export const ArticleInputSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string().min(2, "Category required"),
  authorName: z.string().min(2, "Author name required"),
  isMedicalReviewed: z.boolean().default(false),
  reviewedByDoctorName: z.string().optional().nullable(),
  featuredImageId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  version: z.number().int().min(1).default(1),
  translations: z.object({
    en: z.object({
      title: z.string().min(2, "Article title is required"),
      summary: z.string().optional().nullable(),
      content: z.any().default([]), // Structured JSON blocks
      seoTitle: z.string().max(70).optional().nullable(),
      seoDescription: z.string().max(160).optional().nullable(),
    }),
    ta: z.object({
      title: z.string().optional().default(""),
      summary: z.string().optional().nullable(),
      content: z.any().default([]),
      seoTitle: z.string().max(70).optional().nullable(),
      seoDescription: z.string().max(160).optional().nullable(),
    }).optional(),
  }),
});

export type ArticleInput = z.infer<typeof ArticleInputSchema>;

export const FaqInputSchema = z.object({
  category: z.string().min(2, "Category required"),
  displayOrder: z.number().int().min(0).default(0),
  pageAssociation: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  version: z.number().int().min(1).default(1),
  translations: z.object({
    en: z.object({
      question: z.string().min(5, "Question is required"),
      answer: z.string().min(5, "Answer is required"),
    }),
    ta: z.object({
      question: z.string().optional().default(""),
      answer: z.string().optional().default(""),
    }).optional(),
  }),
});

export type FaqInput = z.infer<typeof FaqInputSchema>;

export const VideoItemInputSchema = z.object({
  provider: z.enum(["YOUTUBE", "VIMEO"]).default("YOUTUBE"),
  videoId: z.string().min(2, "Video ID or URL required"),
  titleEn: z.string().optional().nullable(),
  titleTa: z.string().optional().nullable(),
  captionEn: z.string().optional().nullable(),
  captionTa: z.string().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  version: z.number().int().min(1).default(1),
});

export type VideoItemInput = z.infer<typeof VideoItemInputSchema>;

export const SiteSettingsInputSchema = z.object({
  identity: z.object({
    hospitalName: z.string().min(2),
    publicDescriptionEn: z.string(),
    publicDescriptionTa: z.string().optional(),
    address: z.string(),
    mapCoordinates: z.string(),
  }),
  contact: z.object({
    phone: z.string(),
    emergencyNumber: z.string(),
    whatsapp: z.string(),
    email: z.string().email(),
  }),
  consultation: z.object({
    displayHours: z.string(),
    consultationFee: z.string(),
    appointmentInstructionsEn: z.string(),
    appointmentInstructionsTa: z.string().optional(),
  }),
  emergencyNotice: z.object({
    isEnabled: z.boolean().default(false),
    messageEn: z.string().optional(),
    messageTa: z.string().optional(),
    callAction: z.string().optional(),
    directionsAction: z.string().optional(),
  }),
  socialLinks: z.array(
    z.object({
      platform: z.string(),
      url: z.string().url(),
      isEnabled: z.boolean().default(true),
      displayOrder: z.number().int().default(0),
    })
  ).default([]),
  seoDefaults: z.object({
    defaultTitle: z.string(),
    defaultDescription: z.string(),
    ogImageUrl: z.string().optional(),
    publicWebsiteUrl: z.string().url(),
  }),
});

export type SiteSettingsInput = z.infer<typeof SiteSettingsInputSchema>;

export const NavigationItemInputSchema = z.object({
  labelEn: z.string().min(2),
  labelTa: z.string().optional().nullable(),
  url: z.string().min(1),
  isExternal: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
  isEnabled: z.boolean().default(true),
  version: z.number().int().min(1).default(1),
});

export type NavigationItemInput = z.infer<typeof NavigationItemInputSchema>;
