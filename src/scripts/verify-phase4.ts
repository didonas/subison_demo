import "dotenv/config";
import { DEFAULT_ROLE_PERMISSIONS, ADMIN_PERMISSIONS } from "../lib/admin/permissions.shared";
import { ALLOWED_STATUS_TRANSITIONS } from "../lib/appointments/service";
import { formatActiveSlotKey, generateBookingReference } from "../lib/appointments/service";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName} ${detail ? `- ${detail}` : ""}`);
    failedCount++;
  }
}

async function runPhase4Verification() {
  console.log("=================================================");
  console.log("  PHASE 4: ADMIN PORTAL & MANAGEMENT SUITE TESTS ");
  console.log("=================================================\n");

  // SECTION 1: Granular RBAC Matrix & Compliance
  console.log("1. RBAC & PERMISSION MATRIX VERIFICATION:");
  {
    // Super Admin has all permissions
    const superAdminPerms = DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN;
    assert(
      superAdminPerms.includes(ADMIN_PERMISSIONS.MANAGE_ROLES) &&
      superAdminPerms.includes(ADMIN_PERMISSIONS.MANAGE_USERS) &&
      superAdminPerms.includes(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS) &&
      superAdminPerms.includes(ADMIN_PERMISSIONS.EXPORT_APPOINTMENTS),
      "Super Admin has full master governance permissions"
    );

    // Hospital Admin
    const hospAdminPerms = DEFAULT_ROLE_PERMISSIONS.HOSPITAL_ADMIN;
    assert(
      hospAdminPerms.includes(ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS) &&
      hospAdminPerms.includes(ADMIN_PERMISSIONS.MANAGE_SCHEDULES) &&
      hospAdminPerms.includes(ADMIN_PERMISSIONS.MANAGE_ENQUIRIES) &&
      !hospAdminPerms.includes(ADMIN_PERMISSIONS.MANAGE_ROLES),
      "Hospital Admin has clinical management permissions without role escalation"
    );

    // Receptionist
    const receptPerms = DEFAULT_ROLE_PERMISSIONS.RECEPTIONIST;
    assert(
      receptPerms.includes(ADMIN_PERMISSIONS.VIEW_APPOINTMENTS) &&
      receptPerms.includes(ADMIN_PERMISSIONS.CREATE_MANUAL_BOOKINGS) &&
      receptPerms.includes(ADMIN_PERMISSIONS.ADD_INTERNAL_NOTES) &&
      !receptPerms.includes(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS) &&
      !receptPerms.includes(ADMIN_PERMISSIONS.MANAGE_USERS),
      "Receptionist has front-desk operational permissions only"
    );

    // Content Editor MUST NOT have appointment or audit access
    const editorPerms = DEFAULT_ROLE_PERMISSIONS.CONTENT_EDITOR;
    assert(
      !editorPerms.includes(ADMIN_PERMISSIONS.VIEW_APPOINTMENTS) &&
      !editorPerms.includes(ADMIN_PERMISSIONS.VIEW_PATIENT_DETAILS) &&
      !editorPerms.includes(ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS) &&
      !editorPerms.includes(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS),
      "Content Editor strictly excluded from all appointment and patient records"
    );
  }

  // SECTION 2: Status Transition Finite State Machine
  console.log("\n2. APPOINTMENT LIFECYCLE TRANSITION MATRIX:");
  {
    assert(
      ALLOWED_STATUS_TRANSITIONS.PENDING.includes("CONFIRMED") &&
      ALLOWED_STATUS_TRANSITIONS.PENDING.includes("REJECTED") &&
      ALLOWED_STATUS_TRANSITIONS.PENDING.includes("CANCELLED"),
      "PENDING status transitions match lifecycle specification"
    );

    assert(
      ALLOWED_STATUS_TRANSITIONS.CONFIRMED.includes("RESCHEDULED") &&
      ALLOWED_STATUS_TRANSITIONS.CONFIRMED.includes("COMPLETED") &&
      ALLOWED_STATUS_TRANSITIONS.CONFIRMED.includes("CANCELLED") &&
      ALLOWED_STATUS_TRANSITIONS.CONFIRMED.includes("NO_SHOW"),
      "CONFIRMED status supports Reschedule, Complete, Cancel, and No-Show"
    );

    assert(
      ALLOWED_STATUS_TRANSITIONS.COMPLETED.length === 0 &&
      ALLOWED_STATUS_TRANSITIONS.CANCELLED.length === 0 &&
      ALLOWED_STATUS_TRANSITIONS.REJECTED.length === 0 &&
      ALLOWED_STATUS_TRANSITIONS.NO_SHOW.length === 0,
      "Terminal states (COMPLETED, CANCELLED, REJECTED, NO_SHOW) are strictly final"
    );
  }

  // SECTION 3: Booking Reference & Active Slot Key Standards
  console.log("\n3. IDENTIFIERS & ACTIVE SLOT KEY INTEGRITY:");
  {
    const ref = generateBookingReference();
    assert(
      /^SNC-\d{8}-[A-F0-9]{8}$/.test(ref),
      `Booking reference matches SNC-YYYYMMDD-XXXXXXXX: ${ref}`
    );

    const slotKey = formatActiveSlotKey("doc-123", "2026-08-15", "10:30");
    assert(
      slotKey === "doc-123_2026-08-15_10:30",
      `Active slot key formatted deterministically: ${slotKey}`
    );
  }

  // Summary
  console.log("\n=================================================");
  console.log(`  VERIFICATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4Verification().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
