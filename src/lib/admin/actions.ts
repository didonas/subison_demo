"use server";

import { requirePermission } from "./permissions.server";
import { ADMIN_PERMISSIONS, AdminRoleType } from "./permissions.shared";
import { transitionAppointmentStatus, StatusTransitionOptions } from "../appointments/service";
import {
  checkInAppointment,
  addAppointmentNote,
  createManualBooking,
  CreateManualBookingInput,
  exportAppointmentsCsv,
  GetAdminAppointmentsParams
} from "../appointments/admin-service";
import {
  updateDoctorSchedule,
  DoctorScheduleInput,
  addDoctorLeave,
  deleteDoctorLeave,
  addHospitalHoliday,
  deleteHospitalHoliday
} from "../schedules/service";
import {
  updateEnquiryStatus,
  addEnquiryNote
} from "../enquiries/service";
import { retryFailedNotification } from "../notifications/admin-service";
import {
  createStaffUser,
  updateStaffUserRole,
  toggleStaffUserActive,
  revokeStaffUserSessions
} from "../users/service";
import { EnquiryStatus } from "@/generated/prisma/client";

// 1. Appointment Lifecycle Transitions
export async function transitionAppointmentStatusAction(options: Omit<StatusTransitionOptions, "changedById">) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS);
  return transitionAppointmentStatus({
    ...options,
    changedById: admin.id,
  });
}

// 2. Check-in
export async function checkInAppointmentAction(appointmentId: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS);
  return checkInAppointment(appointmentId, admin.id);
}

// 3. Appointment Notes
export async function addAppointmentNoteAction(appointmentId: string, content: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.ADD_INTERNAL_NOTES);
  return addAppointmentNote(appointmentId, admin.id, content);
}

// 4. Manual Booking Creation
export async function createManualBookingAction(data: Omit<CreateManualBookingInput, "adminId">) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.CREATE_MANUAL_BOOKINGS);
  return createManualBooking({
    ...data,
    adminId: admin.id,
  });
}

// 5. CSV Export
export async function exportAppointmentsCsvAction(filters: GetAdminAppointmentsParams) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.EXPORT_APPOINTMENTS);
  return exportAppointmentsCsv(filters, admin.id);
}

// 6. Schedule Management
export async function updateDoctorScheduleAction(input: Omit<DoctorScheduleInput, "adminId">) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_SCHEDULES);
  return updateDoctorSchedule({
    ...input,
    adminId: admin.id,
  });
}

export async function addDoctorLeaveAction(doctorId: string, startDate: string, endDate: string, reason: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_SCHEDULES);
  return addDoctorLeave(doctorId, startDate, endDate, reason, admin.id);
}

export async function deleteDoctorLeaveAction(leaveId: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_SCHEDULES);
  return deleteDoctorLeave(leaveId, admin.id);
}

export async function addHospitalHolidayAction(name: string, dateStr: string, description: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_SCHEDULES);
  return addHospitalHoliday(name, dateStr, description, admin.id);
}

export async function deleteHospitalHolidayAction(holidayId: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_SCHEDULES);
  return deleteHospitalHoliday(holidayId, admin.id);
}

// 7. Enquiries
export async function updateEnquiryStatusAction(enquiryId: string, newStatus: EnquiryStatus, notes?: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ENQUIRIES);
  return updateEnquiryStatus(enquiryId, newStatus, admin.id, notes);
}

export async function addEnquiryNoteAction(enquiryId: string, content: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ENQUIRIES);
  return addEnquiryNote(enquiryId, admin.id, content);
}

// 8. Notifications Retry
export async function retryNotificationAction(notificationId: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.RETRY_NOTIFICATIONS);
  return retryFailedNotification(notificationId, admin.id);
}

// 9. Staff User Management
export async function createStaffUserAction(data: {
  name: string;
  email: string;
  password: string;
  role: AdminRoleType;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_USERS);
  return createStaffUser(data, admin.id);
}

export async function updateStaffUserRoleAction(targetUserId: string, newRole: AdminRoleType) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_ROLES);
  return updateStaffUserRole(targetUserId, newRole, admin.id, admin.role);
}

export async function toggleStaffUserActiveAction(targetUserId: string, isActive: boolean) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_USERS);
  return toggleStaffUserActive(targetUserId, isActive, admin.id);
}

export async function revokeStaffUserSessionsAction(targetUserId: string) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.REVOKE_SESSIONS);
  return revokeStaffUserSessions(targetUserId, admin.id);
}
