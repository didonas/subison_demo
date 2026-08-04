"use server";

import { requirePermission } from "@/lib/admin/permissions.server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions.shared";
import {
  createSpeciality,
  updateSpeciality,
  deleteDraftSpeciality,
  createTreatment,
  updateTreatment,
  createFacility,
  updateFacility,
  upsertDoctorProfile,
  reviewTestimonial,
  createArticle,
  createFaq,
  updateSiteSettings,
  upsertNavigationItem,
  createPreviewToken,
} from "./service";
import {
  SpecialityInputSchema,
  TreatmentInputSchema,
  FacilityInputSchema,
  DoctorProfileInputSchema,
  ArticleInputSchema,
  FaqInputSchema,
  NavigationItemInputSchema,
} from "./types";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function createSpecialityAction(rawData: unknown): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.CREATE_CONTENT);
    const parsed = SpecialityInputSchema.parse(rawData);

    // If publishing directly upon creation, check PUBLISH_CONTENT permission
    if (parsed.status === "PUBLISHED" && !admin.permissions.includes(ADMIN_PERMISSIONS.PUBLISH_CONTENT)) {
      return { success: false, error: "Forbidden: You do not have permission to publish content directly. Save as draft instead." };
    }

    const res = await createSpeciality(parsed, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to create speciality") };
  }
}

export async function updateSpecialityAction(
  id: string,
  rawData: unknown,
  expectedVersion: number
): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.EDIT_CONTENT);
    const parsed = SpecialityInputSchema.parse(rawData);

    if (parsed.status === "PUBLISHED" && !admin.permissions.includes(ADMIN_PERMISSIONS.PUBLISH_CONTENT)) {
      return { success: false, error: "Forbidden: You do not have permission to publish content." };
    }

    if (parsed.status === "ARCHIVED" && !admin.permissions.includes(ADMIN_PERMISSIONS.ARCHIVE_CONTENT)) {
      return { success: false, error: "Forbidden: You do not have permission to archive content." };
    }

    const res = await updateSpeciality(id, parsed, expectedVersion, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update speciality") };
  }
}

export async function deleteSpecialityDraftAction(id: string): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.DELETE_DRAFT_CONTENT);
    await deleteDraftSpeciality(id, admin.id);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to delete draft speciality") };
  }
}

export async function createTreatmentAction(rawData: unknown): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.CREATE_CONTENT);
    const parsed = TreatmentInputSchema.parse(rawData);

    if (parsed.status === "PUBLISHED" && !admin.permissions.includes(ADMIN_PERMISSIONS.PUBLISH_CONTENT)) {
      return { success: false, error: "Forbidden: You do not have permission to publish content." };
    }

    const res = await createTreatment(parsed, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to create treatment") };
  }
}

export async function updateTreatmentAction(
  id: string,
  rawData: unknown,
  expectedVersion: number
): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.EDIT_CONTENT);
    const parsed = TreatmentInputSchema.parse(rawData);

    if (parsed.status === "PUBLISHED" && !admin.permissions.includes(ADMIN_PERMISSIONS.PUBLISH_CONTENT)) {
      return { success: false, error: "Forbidden: You do not have permission to publish content." };
    }

    const res = await updateTreatment(id, parsed, expectedVersion, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update treatment") };
  }
}

export async function createFacilityAction(rawData: unknown): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.CREATE_CONTENT);
    const parsed = FacilityInputSchema.parse(rawData);
    const res = await createFacility(parsed, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to create facility") };
  }
}

export async function updateFacilityAction(
  id: string,
  rawData: unknown,
  expectedVersion: number
): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.EDIT_CONTENT);
    const parsed = FacilityInputSchema.parse(rawData);
    const res = await updateFacility(id, parsed, expectedVersion, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update facility") };
  }
}

export async function upsertDoctorProfileAction(
  rawData: unknown,
  expectedVersion: number | null
): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_DOCTOR_CONTENT);
    const parsed = DoctorProfileInputSchema.parse(rawData);
    const res = await upsertDoctorProfile(parsed, expectedVersion, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to save doctor profile") };
  }
}

export async function reviewTestimonialAction(
  id: string,
  status: "APPROVED" | "REJECTED" | "ARCHIVED",
  rejectionReason?: string
): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_TESTIMONIALS);
    const res = await reviewTestimonial(id, status, rejectionReason, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to review testimonial") };
  }
}

export async function createArticleAction(rawData: unknown): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.CREATE_CONTENT);
    const parsed = ArticleInputSchema.parse(rawData);
    const res = await createArticle(parsed, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to create article") };
  }
}

export async function createFaqAction(rawData: unknown): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.CREATE_CONTENT);
    const parsed = FaqInputSchema.parse(rawData);
    const res = await createFaq(parsed, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to create FAQ") };
  }
}

export async function updateSiteSettingsAction(key: string, data: Record<string, unknown>): Promise<ActionResponse> {
  try {
    const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_SITE_SETTINGS);
    const res = await updateSiteSettings(key, data, admin.id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update site settings") };
  }
}

export async function upsertNavigationItemAction(rawData: unknown, id?: string): Promise<ActionResponse> {
  try {
    await requirePermission(ADMIN_PERMISSIONS.MANAGE_SITE_SETTINGS);
    const parsed = NavigationItemInputSchema.parse(rawData);
    const res = await upsertNavigationItem(parsed, id);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to save navigation item") };
  }
}

export async function createPreviewTokenAction(entityType: string, entityId: string): Promise<ActionResponse> {
  try {
    await requirePermission(ADMIN_PERMISSIONS.PREVIEW_CONTENT);
    const res = await createPreviewToken(entityType, entityId);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to generate preview token") };
  }
}
