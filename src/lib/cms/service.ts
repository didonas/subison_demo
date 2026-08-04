import { prisma } from "@/lib/prisma";
import {
  SpecialityInput,
  TreatmentInput,
  FacilityInput,
  DoctorProfileInput,
  TestimonialInput,
  ArticleInput,
  FaqInput,
  NavigationItemInput,
  ContentStatusType,
} from "./types";
import { sanitizeHtml, validateMedicalContent } from "./sanitizer";
import { validateSlug } from "./slug-service";
import { generatePreviewToken, isPreviewTokenValid } from "./preview-service";
import { revalidateEntityCache } from "./revalidation";

// Concurrency error class
export class ConcurrencyConflictError extends Error {
  constructor(entity: string, currentVersion: number, expectedVersion: number) {
    super(`Conflict in ${entity}: Record was modified by another administrator (Current version: ${currentVersion}, your version: ${expectedVersion}). Please refresh and try again.`);
    this.name = "ConcurrencyConflictError";
  }
}

// ----------------------------------------------------
// 1. SPECIALITIES
// ----------------------------------------------------
export async function listSpecialities(status?: ContentStatusType) {
  return prisma.speciality.findMany({
    where: status ? { status } : undefined,
    include: { translations: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getSpecialityBySlug(slug: string, locale?: string) {
  return prisma.speciality.findUnique({
    where: { slug },
    include: {
      translations: locale ? { where: { locale } } : true,
    },
  });
}

export async function createSpeciality(input: SpecialityInput, adminUserId: string) {
  const slugCheck = validateSlug(input.slug);
  if (!slugCheck.isValid) {
    throw new Error(slugCheck.error);
  }

  // Medical claim check
  const claimsCheck = validateMedicalContent(
    `${input.translations.en.title} ${input.translations.en.overview || ""} ${input.translations.en.treatmentApproach || ""}`
  );
  if (!claimsCheck.isValid) {
    throw new Error(`Content contains prohibited claims: ${claimsCheck.flaggedTerms.join(", ")}`);
  }

  return prisma.$transaction(async (tx) => {
    const speciality = await tx.speciality.create({
      data: {
        slug: input.slug,
        status: input.status,
        displayOrder: input.displayOrder,
        featuredImageId: input.featuredImageId,
        isFeatured: input.isFeatured,
        version: 1,
        createdByAdminId: adminUserId,
        updatedByAdminId: adminUserId,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        publishedByAdminId: input.status === "PUBLISHED" ? adminUserId : null,
      },
    });

    // Create English translation
    await tx.specialityTranslation.create({
      data: {
        specialityId: speciality.id,
        locale: "en",
        title: input.translations.en.title,
        summary: input.translations.en.summary,
        overview: input.translations.en.overview ? sanitizeHtml(input.translations.en.overview) : null,
        symptoms: input.translations.en.symptoms,
        causes: input.translations.en.causes,
        whenToSeekCare: input.translations.en.whenToSeekCare ? sanitizeHtml(input.translations.en.whenToSeekCare) : null,
        diagnosticApproach: input.translations.en.diagnosticApproach ? sanitizeHtml(input.translations.en.diagnosticApproach) : null,
        treatmentApproach: input.translations.en.treatmentApproach ? sanitizeHtml(input.translations.en.treatmentApproach) : null,
        seoTitle: input.translations.en.seoTitle,
        seoDescription: input.translations.en.seoDescription,
      },
    });

    // Create Tamil translation if provided
    if (input.translations.ta && input.translations.ta.title) {
      await tx.specialityTranslation.create({
        data: {
          specialityId: speciality.id,
          locale: "ta",
          title: input.translations.ta.title,
          summary: input.translations.ta.summary,
          overview: input.translations.ta.overview ? sanitizeHtml(input.translations.ta.overview) : null,
          symptoms: input.translations.ta.symptoms,
          causes: input.translations.ta.causes,
          whenToSeekCare: input.translations.ta.whenToSeekCare ? sanitizeHtml(input.translations.ta.whenToSeekCare) : null,
          diagnosticApproach: input.translations.ta.diagnosticApproach ? sanitizeHtml(input.translations.ta.diagnosticApproach) : null,
          treatmentApproach: input.translations.ta.treatmentApproach ? sanitizeHtml(input.translations.ta.treatmentApproach) : null,
          seoTitle: input.translations.ta.seoTitle,
          seoDescription: input.translations.ta.seoDescription,
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        adminUserId,
        action: "CMS_CREATE_SPECIALITY",
        resourceType: "SPECIALITY",
        resourceId: speciality.id,
        metadata: JSON.stringify({ slug: input.slug, status: input.status }),
      },
    });

    return speciality;
  });
}

export async function updateSpeciality(
  id: string,
  input: SpecialityInput,
  expectedVersion: number,
  adminUserId: string
) {
  const existing = await prisma.speciality.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!existing) {
    throw new Error("Speciality not found");
  }

  if (existing.version !== expectedVersion) {
    throw new ConcurrencyConflictError("Speciality", existing.version, expectedVersion);
  }

  const slugCheck = validateSlug(input.slug);
  if (!slugCheck.isValid) {
    throw new Error(slugCheck.error);
  }

  const isPublishingNow = existing.status !== "PUBLISHED" && input.status === "PUBLISHED";

  const updated = await prisma.$transaction(async (tx) => {
    const speciality = await tx.speciality.update({
      where: { id, version: expectedVersion },
      data: {
        slug: input.slug,
        status: input.status,
        displayOrder: input.displayOrder,
        featuredImageId: input.featuredImageId,
        isFeatured: input.isFeatured,
        version: { increment: 1 },
        updatedByAdminId: adminUserId,
        publishedAt: isPublishingNow ? new Date() : existing.publishedAt,
        publishedByAdminId: isPublishingNow ? adminUserId : existing.publishedByAdminId,
      },
    });

    // Upsert English translation
    await tx.specialityTranslation.upsert({
      where: { specialityId_locale: { specialityId: id, locale: "en" } },
      create: {
        specialityId: id,
        locale: "en",
        title: input.translations.en.title,
        summary: input.translations.en.summary,
        overview: input.translations.en.overview ? sanitizeHtml(input.translations.en.overview) : null,
        symptoms: input.translations.en.symptoms,
        causes: input.translations.en.causes,
        whenToSeekCare: input.translations.en.whenToSeekCare ? sanitizeHtml(input.translations.en.whenToSeekCare) : null,
        diagnosticApproach: input.translations.en.diagnosticApproach ? sanitizeHtml(input.translations.en.diagnosticApproach) : null,
        treatmentApproach: input.translations.en.treatmentApproach ? sanitizeHtml(input.translations.en.treatmentApproach) : null,
        seoTitle: input.translations.en.seoTitle,
        seoDescription: input.translations.en.seoDescription,
      },
      update: {
        title: input.translations.en.title,
        summary: input.translations.en.summary,
        overview: input.translations.en.overview ? sanitizeHtml(input.translations.en.overview) : null,
        symptoms: input.translations.en.symptoms,
        causes: input.translations.en.causes,
        whenToSeekCare: input.translations.en.whenToSeekCare ? sanitizeHtml(input.translations.en.whenToSeekCare) : null,
        diagnosticApproach: input.translations.en.diagnosticApproach ? sanitizeHtml(input.translations.en.diagnosticApproach) : null,
        treatmentApproach: input.translations.en.treatmentApproach ? sanitizeHtml(input.translations.en.treatmentApproach) : null,
        seoTitle: input.translations.en.seoTitle,
        seoDescription: input.translations.en.seoDescription,
      },
    });

    // Upsert Tamil translation if provided
    if (input.translations.ta && input.translations.ta.title) {
      await tx.specialityTranslation.upsert({
        where: { specialityId_locale: { specialityId: id, locale: "ta" } },
        create: {
          specialityId: id,
          locale: "ta",
          title: input.translations.ta.title,
          summary: input.translations.ta.summary,
          overview: input.translations.ta.overview ? sanitizeHtml(input.translations.ta.overview) : null,
          symptoms: input.translations.ta.symptoms,
          causes: input.translations.ta.causes,
          whenToSeekCare: input.translations.ta.whenToSeekCare ? sanitizeHtml(input.translations.ta.whenToSeekCare) : null,
          diagnosticApproach: input.translations.ta.diagnosticApproach ? sanitizeHtml(input.translations.ta.diagnosticApproach) : null,
          treatmentApproach: input.translations.ta.treatmentApproach ? sanitizeHtml(input.translations.ta.treatmentApproach) : null,
          seoTitle: input.translations.ta.seoTitle,
          seoDescription: input.translations.ta.seoDescription,
        },
        update: {
          title: input.translations.ta.title,
          summary: input.translations.ta.summary,
          overview: input.translations.ta.overview ? sanitizeHtml(input.translations.ta.overview) : null,
          symptoms: input.translations.ta.symptoms,
          causes: input.translations.ta.causes,
          whenToSeekCare: input.translations.ta.whenToSeekCare ? sanitizeHtml(input.translations.ta.whenToSeekCare) : null,
          diagnosticApproach: input.translations.ta.diagnosticApproach ? sanitizeHtml(input.translations.ta.diagnosticApproach) : null,
          treatmentApproach: input.translations.ta.treatmentApproach ? sanitizeHtml(input.translations.ta.treatmentApproach) : null,
          seoTitle: input.translations.ta.seoTitle,
          seoDescription: input.translations.ta.seoDescription,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        adminUserId,
        action: "CMS_UPDATE_SPECIALITY",
        resourceType: "SPECIALITY",
        resourceId: id,
        metadata: JSON.stringify({ slug: input.slug, status: input.status, oldVersion: expectedVersion }),
      },
    });

    return speciality;
  });

  await revalidateEntityCache("SPECIALITY", input.slug, input.isFeatured);
  return updated;
}

export async function deleteDraftSpeciality(id: string, adminUserId: string) {
  const existing = await prisma.speciality.findUnique({ where: { id } });
  if (!existing) throw new Error("Speciality not found");
  if (existing.status === "PUBLISHED") {
    throw new Error("Cannot delete a published speciality. Archive it instead.");
  }

  await prisma.speciality.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      adminUserId,
      action: "CMS_DELETE_SPECIALITY_DRAFT",
      resourceType: "SPECIALITY",
      resourceId: id,
      metadata: JSON.stringify({ slug: existing.slug }),
    },
  });
}

// ----------------------------------------------------
// 2. TREATMENTS
// ----------------------------------------------------
export async function listTreatments(status?: ContentStatusType) {
  return prisma.treatment.findMany({
    where: status ? { status } : undefined,
    include: { translations: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getTreatmentBySlug(slug: string, locale?: string) {
  return prisma.treatment.findUnique({
    where: { slug },
    include: {
      translations: locale ? { where: { locale } } : true,
    },
  });
}

export async function createTreatment(input: TreatmentInput, adminUserId: string) {
  const slugCheck = validateSlug(input.slug);
  if (!slugCheck.isValid) throw new Error(slugCheck.error);

  const claimsCheck = validateMedicalContent(
    `${input.translations.en.title} ${input.translations.en.treatmentApproach || ""} ${input.translations.en.recoveryInfo || ""}`
  );
  if (!claimsCheck.isValid) {
    throw new Error(`Content contains prohibited claims: ${claimsCheck.flaggedTerms.join(", ")}`);
  }

  return prisma.$transaction(async (tx) => {
    const treatment = await tx.treatment.create({
      data: {
        slug: input.slug,
        status: input.status,
        displayOrder: input.displayOrder,
        featuredImageId: input.featuredImageId,
        version: 1,
        createdByAdminId: adminUserId,
        updatedByAdminId: adminUserId,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        publishedByAdminId: input.status === "PUBLISHED" ? adminUserId : null,
      },
    });

    await tx.treatmentTranslation.create({
      data: {
        treatmentId: treatment.id,
        locale: "en",
        title: input.translations.en.title,
        summary: input.translations.en.summary,
        overview: input.translations.en.overview ? sanitizeHtml(input.translations.en.overview) : null,
        candidateConditions: input.translations.en.candidateConditions,
        preparationInfo: input.translations.en.preparationInfo ? sanitizeHtml(input.translations.en.preparationInfo) : null,
        diagnosticProcess: input.translations.en.diagnosticProcess ? sanitizeHtml(input.translations.en.diagnosticProcess) : null,
        treatmentApproach: input.translations.en.treatmentApproach ? sanitizeHtml(input.translations.en.treatmentApproach) : null,
        recoveryInfo: input.translations.en.recoveryInfo ? sanitizeHtml(input.translations.en.recoveryInfo) : null,
        risksAndLimitations: input.translations.en.risksAndLimitations ? sanitizeHtml(input.translations.en.risksAndLimitations) : null,
        seoTitle: input.translations.en.seoTitle,
        seoDescription: input.translations.en.seoDescription,
      },
    });

    if (input.translations.ta && input.translations.ta.title) {
      await tx.treatmentTranslation.create({
        data: {
          treatmentId: treatment.id,
          locale: "ta",
          title: input.translations.ta.title,
          summary: input.translations.ta.summary,
          overview: input.translations.ta.overview ? sanitizeHtml(input.translations.ta.overview) : null,
          candidateConditions: input.translations.ta.candidateConditions,
          preparationInfo: input.translations.ta.preparationInfo ? sanitizeHtml(input.translations.ta.preparationInfo) : null,
          diagnosticProcess: input.translations.ta.diagnosticProcess ? sanitizeHtml(input.translations.ta.diagnosticProcess) : null,
          treatmentApproach: input.translations.ta.treatmentApproach ? sanitizeHtml(input.translations.ta.treatmentApproach) : null,
          recoveryInfo: input.translations.ta.recoveryInfo ? sanitizeHtml(input.translations.ta.recoveryInfo) : null,
          risksAndLimitations: input.translations.ta.risksAndLimitations ? sanitizeHtml(input.translations.ta.risksAndLimitations) : null,
          seoTitle: input.translations.ta.seoTitle,
          seoDescription: input.translations.ta.seoDescription,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        adminUserId,
        action: "CMS_CREATE_TREATMENT",
        resourceType: "TREATMENT",
        resourceId: treatment.id,
        metadata: JSON.stringify({ slug: input.slug, status: input.status }),
      },
    });

    return treatment;
  });
}

export async function updateTreatment(
  id: string,
  input: TreatmentInput,
  expectedVersion: number,
  adminUserId: string
) {
  const existing = await prisma.treatment.findUnique({ where: { id } });
  if (!existing) throw new Error("Treatment not found");
  if (existing.version !== expectedVersion) {
    throw new ConcurrencyConflictError("Treatment", existing.version, expectedVersion);
  }

  const isPublishingNow = existing.status !== "PUBLISHED" && input.status === "PUBLISHED";

  const updated = await prisma.$transaction(async (tx) => {
    const treatment = await tx.treatment.update({
      where: { id, version: expectedVersion },
      data: {
        slug: input.slug,
        status: input.status,
        displayOrder: input.displayOrder,
        featuredImageId: input.featuredImageId,
        version: { increment: 1 },
        updatedByAdminId: adminUserId,
        publishedAt: isPublishingNow ? new Date() : existing.publishedAt,
        publishedByAdminId: isPublishingNow ? adminUserId : existing.publishedByAdminId,
      },
    });

    await tx.treatmentTranslation.upsert({
      where: { treatmentId_locale: { treatmentId: id, locale: "en" } },
      create: {
        treatmentId: id,
        locale: "en",
        title: input.translations.en.title,
        summary: input.translations.en.summary,
        overview: input.translations.en.overview ? sanitizeHtml(input.translations.en.overview) : null,
        candidateConditions: input.translations.en.candidateConditions,
        preparationInfo: input.translations.en.preparationInfo ? sanitizeHtml(input.translations.en.preparationInfo) : null,
        diagnosticProcess: input.translations.en.diagnosticProcess ? sanitizeHtml(input.translations.en.diagnosticProcess) : null,
        treatmentApproach: input.translations.en.treatmentApproach ? sanitizeHtml(input.translations.en.treatmentApproach) : null,
        recoveryInfo: input.translations.en.recoveryInfo ? sanitizeHtml(input.translations.en.recoveryInfo) : null,
        risksAndLimitations: input.translations.en.risksAndLimitations ? sanitizeHtml(input.translations.en.risksAndLimitations) : null,
        seoTitle: input.translations.en.seoTitle,
        seoDescription: input.translations.en.seoDescription,
      },
      update: {
        title: input.translations.en.title,
        summary: input.translations.en.summary,
        overview: input.translations.en.overview ? sanitizeHtml(input.translations.en.overview) : null,
        candidateConditions: input.translations.en.candidateConditions,
        preparationInfo: input.translations.en.preparationInfo ? sanitizeHtml(input.translations.en.preparationInfo) : null,
        diagnosticProcess: input.translations.en.diagnosticProcess ? sanitizeHtml(input.translations.en.diagnosticProcess) : null,
        treatmentApproach: input.translations.en.treatmentApproach ? sanitizeHtml(input.translations.en.treatmentApproach) : null,
        recoveryInfo: input.translations.en.recoveryInfo ? sanitizeHtml(input.translations.en.recoveryInfo) : null,
        risksAndLimitations: input.translations.en.risksAndLimitations ? sanitizeHtml(input.translations.en.risksAndLimitations) : null,
        seoTitle: input.translations.en.seoTitle,
        seoDescription: input.translations.en.seoDescription,
      },
    });

    if (input.translations.ta && input.translations.ta.title) {
      await tx.treatmentTranslation.upsert({
        where: { treatmentId_locale: { treatmentId: id, locale: "ta" } },
        create: {
          treatmentId: id,
          locale: "ta",
          title: input.translations.ta.title,
          summary: input.translations.ta.summary,
          overview: input.translations.ta.overview ? sanitizeHtml(input.translations.ta.overview) : null,
          candidateConditions: input.translations.ta.candidateConditions,
          preparationInfo: input.translations.ta.preparationInfo ? sanitizeHtml(input.translations.ta.preparationInfo) : null,
          diagnosticProcess: input.translations.ta.diagnosticProcess ? sanitizeHtml(input.translations.ta.diagnosticProcess) : null,
          treatmentApproach: input.translations.ta.treatmentApproach ? sanitizeHtml(input.translations.ta.treatmentApproach) : null,
          recoveryInfo: input.translations.ta.recoveryInfo ? sanitizeHtml(input.translations.ta.recoveryInfo) : null,
          risksAndLimitations: input.translations.ta.risksAndLimitations ? sanitizeHtml(input.translations.ta.risksAndLimitations) : null,
          seoTitle: input.translations.ta.seoTitle,
          seoDescription: input.translations.ta.seoDescription,
        },
        update: {
          title: input.translations.ta.title,
          summary: input.translations.ta.summary,
          overview: input.translations.ta.overview ? sanitizeHtml(input.translations.ta.overview) : null,
          candidateConditions: input.translations.ta.candidateConditions,
          preparationInfo: input.translations.ta.preparationInfo ? sanitizeHtml(input.translations.ta.preparationInfo) : null,
          diagnosticProcess: input.translations.ta.diagnosticProcess ? sanitizeHtml(input.translations.ta.diagnosticProcess) : null,
          treatmentApproach: input.translations.ta.treatmentApproach ? sanitizeHtml(input.translations.ta.treatmentApproach) : null,
          recoveryInfo: input.translations.ta.recoveryInfo ? sanitizeHtml(input.translations.ta.recoveryInfo) : null,
          risksAndLimitations: input.translations.ta.risksAndLimitations ? sanitizeHtml(input.translations.ta.risksAndLimitations) : null,
          seoTitle: input.translations.ta.seoTitle,
          seoDescription: input.translations.ta.seoDescription,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        adminUserId,
        action: "CMS_UPDATE_TREATMENT",
        resourceType: "TREATMENT",
        resourceId: id,
        metadata: JSON.stringify({ slug: input.slug, status: input.status, oldVersion: expectedVersion }),
      },
    });

    return treatment;
  });

  await revalidateEntityCache("TREATMENT", input.slug);
  return updated;
}

// ----------------------------------------------------
// 3. FACILITIES
// ----------------------------------------------------
export async function listFacilities(status?: ContentStatusType) {
  return prisma.facility.findMany({
    where: status ? { status } : undefined,
    include: { translations: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function createFacility(input: FacilityInput, adminUserId: string) {
  const slugCheck = validateSlug(input.slug);
  if (!slugCheck.isValid) throw new Error(slugCheck.error);

  return prisma.$transaction(async (tx) => {
    const facility = await tx.facility.create({
      data: {
        slug: input.slug,
        status: input.status,
        verificationState: input.verificationState,
        displayOrder: input.displayOrder,
        featuredImageId: input.featuredImageId,
        version: 1,
        createdByAdminId: adminUserId,
        updatedByAdminId: adminUserId,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        publishedByAdminId: input.status === "PUBLISHED" ? adminUserId : null,
      },
    });

    await tx.facilityTranslation.create({
      data: {
        facilityId: facility.id,
        locale: "en",
        name: input.translations.en.name,
        description: input.translations.en.description ? sanitizeHtml(input.translations.en.description) : null,
        availabilityInfo: input.translations.en.availabilityInfo,
      },
    });

    if (input.translations.ta && input.translations.ta.name) {
      await tx.facilityTranslation.create({
        data: {
          facilityId: facility.id,
          locale: "ta",
          name: input.translations.ta.name,
          description: input.translations.ta.description ? sanitizeHtml(input.translations.ta.description) : null,
          availabilityInfo: input.translations.ta.availabilityInfo,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        adminUserId,
        action: "CMS_CREATE_FACILITY",
        resourceType: "FACILITY",
        resourceId: facility.id,
        metadata: JSON.stringify({ slug: input.slug, status: input.status }),
      },
    });

    return facility;
  });
}

export async function updateFacility(
  id: string,
  input: FacilityInput,
  expectedVersion: number,
  adminUserId: string
) {
  const existing = await prisma.facility.findUnique({ where: { id } });
  if (!existing) throw new Error("Facility not found");
  if (existing.version !== expectedVersion) {
    throw new ConcurrencyConflictError("Facility", existing.version, expectedVersion);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const facility = await tx.facility.update({
      where: { id, version: expectedVersion },
      data: {
        slug: input.slug,
        status: input.status,
        verificationState: input.verificationState,
        displayOrder: input.displayOrder,
        featuredImageId: input.featuredImageId,
        version: { increment: 1 },
        updatedByAdminId: adminUserId,
      },
    });

    await tx.facilityTranslation.upsert({
      where: { facilityId_locale: { facilityId: id, locale: "en" } },
      create: {
        facilityId: id,
        locale: "en",
        name: input.translations.en.name,
        description: input.translations.en.description ? sanitizeHtml(input.translations.en.description) : null,
        availabilityInfo: input.translations.en.availabilityInfo,
      },
      update: {
        name: input.translations.en.name,
        description: input.translations.en.description ? sanitizeHtml(input.translations.en.description) : null,
        availabilityInfo: input.translations.en.availabilityInfo,
      },
    });

    if (input.translations.ta && input.translations.ta.name) {
      await tx.facilityTranslation.upsert({
        where: { facilityId_locale: { facilityId: id, locale: "ta" } },
        create: {
          facilityId: id,
          locale: "ta",
          name: input.translations.ta.name,
          description: input.translations.ta.description ? sanitizeHtml(input.translations.ta.description) : null,
          availabilityInfo: input.translations.ta.availabilityInfo,
        },
        update: {
          name: input.translations.ta.name,
          description: input.translations.ta.description ? sanitizeHtml(input.translations.ta.description) : null,
          availabilityInfo: input.translations.ta.availabilityInfo,
        },
      });
    }

    return facility;
  });

  await revalidateEntityCache("FACILITY");
  return updated;
}

// ----------------------------------------------------
// 4. DOCTOR PROFILE & VERIFICATION
// ----------------------------------------------------
export async function getDoctorWithProfile(doctorId: string) {
  return prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      profile: true,
      department: true,
    },
  });
}

export async function upsertDoctorProfile(
  input: DoctorProfileInput,
  expectedVersion: number | null,
  adminUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.doctorProfile.findUnique({
      where: { doctorId: input.doctorId },
    });

    if (existing && expectedVersion !== null && existing.version !== expectedVersion) {
      throw new ConcurrencyConflictError("DoctorProfile", existing.version, expectedVersion);
    }

    const profile = await tx.doctorProfile.upsert({
      where: { doctorId: input.doctorId },
      create: {
        doctorId: input.doctorId,
        qualifications: input.qualifications,
        registrationNumber: input.registrationNumber,
        specialisation: input.specialisation,
        experienceYears: input.experienceYears,
        training: input.training,
        areasOfExpertise: input.areasOfExpertise,
        memberships: input.memberships,
        languages: input.languages,
        bioEn: input.bioEn ? sanitizeHtml(input.bioEn) : null,
        bioTa: input.bioTa ? sanitizeHtml(input.bioTa) : null,
        consultationFee: input.consultationFee,
        publicNotice: input.publicNotice,
        isVerified: input.isVerified,
        verifiedByAdminId: input.isVerified ? adminUserId : null,
        verifiedAt: input.isVerified ? new Date() : null,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        status: input.status,
        version: 1,
      },
      update: {
        qualifications: input.qualifications,
        registrationNumber: input.registrationNumber,
        specialisation: input.specialisation,
        experienceYears: input.experienceYears,
        training: input.training,
        areasOfExpertise: input.areasOfExpertise,
        memberships: input.memberships,
        languages: input.languages,
        bioEn: input.bioEn ? sanitizeHtml(input.bioEn) : null,
        bioTa: input.bioTa ? sanitizeHtml(input.bioTa) : null,
        consultationFee: input.consultationFee,
        publicNotice: input.publicNotice,
        isVerified: input.isVerified,
        verifiedByAdminId: input.isVerified ? adminUserId : null,
        verifiedAt: input.isVerified ? new Date() : null,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        status: input.status,
        version: { increment: 1 },
      },
    });

    // Sync fee back to main Doctor model
    await tx.doctor.update({
      where: { id: input.doctorId },
      data: { consultationFee: input.consultationFee },
    });

    await tx.auditLog.create({
      data: {
        adminUserId,
        action: "CMS_UPSERT_DOCTOR_PROFILE",
        resourceType: "DOCTOR_PROFILE",
        resourceId: profile.id,
        metadata: JSON.stringify({ doctorId: input.doctorId, isVerified: input.isVerified }),
      },
    });

    return profile;
  });
}

// ----------------------------------------------------
// 5. TESTIMONIALS & CONSENT WORKFLOW
// ----------------------------------------------------
export async function listTestimonials(status?: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED") {
  return prisma.testimonial.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function createTestimonial(input: TestimonialInput, adminUserId?: string) {
  const item = await prisma.testimonial.create({
    data: {
      patientDisplayName: input.patientDisplayName,
      patientLocation: input.patientLocation,
      content: sanitizeHtml(input.content),
      status: input.status,
      displayOrder: input.displayOrder,
      hasConsent: input.hasConsent,
      consentDate: input.hasConsent ? new Date() : null,
      rejectionReason: input.rejectionReason,
      version: 1,
    },
  });

  if (adminUserId) {
    await prisma.auditLog.create({
      data: {
        adminUserId,
        action: "CMS_CREATE_TESTIMONIAL",
        resourceType: "TESTIMONIAL",
        resourceId: item.id,
      },
    });
  }

  return item;
}

export async function reviewTestimonial(
  id: string,
  status: "APPROVED" | "REJECTED" | "ARCHIVED",
  rejectionReason: string | undefined,
  adminUserId: string
) {
  return prisma.testimonial.update({
    where: { id },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason : null,
      reviewedByAdminId: adminUserId,
      reviewedAt: new Date(),
      version: { increment: 1 },
    },
  });
}

// ----------------------------------------------------
// 6. ARTICLES & HEALTH ADVICE
// ----------------------------------------------------
export async function listArticles(status?: ContentStatusType) {
  return prisma.article.findMany({
    where: status ? { status } : undefined,
    include: { translations: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createArticle(input: ArticleInput, adminUserId: string) {
  const slugCheck = validateSlug(input.slug);
  if (!slugCheck.isValid) throw new Error(slugCheck.error);

  return prisma.$transaction(async (tx) => {
    const article = await tx.article.create({
      data: {
        slug: input.slug,
        category: input.category,
        authorName: input.authorName,
        isMedicalReviewed: input.isMedicalReviewed,
        reviewedByDoctorName: input.reviewedByDoctorName,
        featuredImageId: input.featuredImageId,
        status: input.status,
        version: 1,
        createdByAdminId: adminUserId,
        updatedByAdminId: adminUserId,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        publishedByAdminId: input.status === "PUBLISHED" ? adminUserId : null,
      },
    });

    await tx.articleTranslation.create({
      data: {
        articleId: article.id,
        locale: "en",
        title: input.translations.en.title,
        summary: input.translations.en.summary,
        content: input.translations.en.content,
        seoTitle: input.translations.en.seoTitle,
        seoDescription: input.translations.en.seoDescription,
      },
    });

    if (input.translations.ta && input.translations.ta.title) {
      await tx.articleTranslation.create({
        data: {
          articleId: article.id,
          locale: "ta",
          title: input.translations.ta.title,
          summary: input.translations.ta.summary,
          content: input.translations.ta.content,
          seoTitle: input.translations.ta.seoTitle,
          seoDescription: input.translations.ta.seoDescription,
        },
      });
    }

    return article;
  });
}

// ----------------------------------------------------
// 7. FAQS
// ----------------------------------------------------
export async function listFaqs(status?: ContentStatusType) {
  return prisma.fAQ.findMany({
    where: status ? { status } : undefined,
    include: { translations: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function createFaq(input: FaqInput, adminUserId?: string) {
  return prisma.$transaction(async (tx) => {
    const faq = await tx.fAQ.create({
      data: {
        category: input.category,
        displayOrder: input.displayOrder,
        pageAssociation: input.pageAssociation,
        status: input.status,
        version: 1,
      },
    });

    await tx.faqTranslation.create({
      data: {
        faqId: faq.id,
        locale: "en",
        question: input.translations.en.question,
        answer: sanitizeHtml(input.translations.en.answer),
      },
    });

    if (input.translations.ta && input.translations.ta.question) {
      await tx.faqTranslation.create({
        data: {
          faqId: faq.id,
          locale: "ta",
          question: input.translations.ta.question,
          answer: sanitizeHtml(input.translations.ta.answer),
        },
      });
    }

    if (adminUserId) {
      await tx.auditLog.create({
        data: {
          adminUserId,
          action: "CMS_CREATE_FAQ",
          resourceType: "FAQ",
          resourceId: faq.id,
        },
      });
    }

    return faq;
  });
}

// ----------------------------------------------------
// 8. SITE SETTINGS & NAVIGATION
// ----------------------------------------------------
export async function getSiteSettings(key: string = "site_settings_main") {
  const setting = await prisma.siteSetting.findUnique({
    where: { key },
  });
  if (!setting) return null;
  try {
    return JSON.parse(setting.value);
  } catch {
    return null;
  }
}

export async function updateSiteSettings(
  key: string = "site_settings_main",
  settingsData: unknown,
  adminUserId: string
) {
  const updated = await prisma.siteSetting.upsert({
    where: { key },
    create: {
      key,
      value: JSON.stringify(settingsData),
    },
    update: {
      value: JSON.stringify(settingsData),
    },
  });

  await prisma.auditLog.create({
    data: {
      adminUserId,
      action: "CMS_UPDATE_SITE_SETTINGS",
      resourceType: "SITE_SETTINGS",
      resourceId: key,
    },
  });

  await revalidateEntityCache("SETTINGS");
  return updated;
}

export async function listNavigationItems() {
  return prisma.navigationItem.findMany({
    orderBy: { displayOrder: "asc" },
  });
}

export async function upsertNavigationItem(input: NavigationItemInput, id?: string) {
  if (id) {
    return prisma.navigationItem.update({
      where: { id },
      data: {
        labelEn: input.labelEn,
        labelTa: input.labelTa,
        url: input.url,
        isExternal: input.isExternal,
        displayOrder: input.displayOrder,
        isEnabled: input.isEnabled,
        version: { increment: 1 },
      },
    });
  } else {
    return prisma.navigationItem.create({
      data: {
        labelEn: input.labelEn,
        labelTa: input.labelTa,
        url: input.url,
        isExternal: input.isExternal,
        displayOrder: input.displayOrder,
        isEnabled: input.isEnabled,
        version: 1,
      },
    });
  }
}

// ----------------------------------------------------
// 9. PREVIEW SYSTEM
// ----------------------------------------------------
export async function createPreviewToken(entityType: string, entityId: string) {
  const tokenData = generatePreviewToken(entityType, entityId, 60);
  return prisma.previewToken.create({
    data: {
      token: tokenData.token,
      entityType: tokenData.entityType,
      entityId: tokenData.entityId,
      expiresAt: tokenData.expiresAt,
    },
  });
}

export async function resolvePreviewToken(token: string) {
  const record = await prisma.previewToken.findUnique({
    where: { token },
  });

  if (!record || !isPreviewTokenValid(record.expiresAt)) {
    return null;
  }

  return record;
}
