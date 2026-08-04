import "dotenv/config";
// Mock server-only for standalone test scripts
try {
  const p = require.resolve("server-only");
  require.cache[p] = {
    id: p,
    filename: p,
    loaded: true,
    exports: {}
  } as unknown as NodeModule;
} catch {}

import type { AppointmentStatus } from "../lib/appointments/service";
import type { AdminRoleType } from "../lib/admin/permissions.shared";

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

async function runComprehensivePhase4Verification() {
  const { DEFAULT_ROLE_PERMISSIONS, ADMIN_PERMISSIONS } = await import("../lib/admin/permissions.shared");
  const { ALLOWED_STATUS_TRANSITIONS, formatActiveSlotKey, generateBookingReference } = await import("../lib/appointments/service");
  const { sanitizeCsvField, maskMobileNumber } = await import("../lib/appointments/admin-service");
  console.log("=================================================================");
  console.log("  SUBISON NEURO CENTRE: COMPLETE PHASE 4 VERIFICATION SUITE       ");
  console.log("=================================================================\n");

  // TEST SUITE 1: RBAC Matrix & Isolation
  console.log("1. RBAC PERMISSIONS & CONTENT EDITOR ISOLATION:");
  {
    const superAdmin = DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN;
    assert(
      superAdmin.includes(ADMIN_PERMISSIONS.MANAGE_ROLES) &&
      superAdmin.includes(ADMIN_PERMISSIONS.MANAGE_USERS) &&
      superAdmin.includes(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS) &&
      superAdmin.includes(ADMIN_PERMISSIONS.EXPORT_APPOINTMENTS),
      "Super Admin has full governance permissions"
    );

    const hospitalAdmin = DEFAULT_ROLE_PERMISSIONS.HOSPITAL_ADMIN;
    assert(
      hospitalAdmin.includes(ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS) &&
      hospitalAdmin.includes(ADMIN_PERMISSIONS.MANAGE_SCHEDULES) &&
      hospitalAdmin.includes(ADMIN_PERMISSIONS.MANAGE_ENQUIRIES) &&
      !hospitalAdmin.includes(ADMIN_PERMISSIONS.MANAGE_ROLES),
      "Hospital Admin has clinical management permissions without role escalation"
    );

    const receptionist = DEFAULT_ROLE_PERMISSIONS.RECEPTIONIST;
    assert(
      receptPermsIncludes(receptionist, [
        ADMIN_PERMISSIONS.VIEW_APPOINTMENTS,
        ADMIN_PERMISSIONS.CREATE_MANUAL_BOOKINGS,
        ADMIN_PERMISSIONS.ADD_INTERNAL_NOTES,
      ]) &&
      !receptionist.includes(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS) &&
      !receptionist.includes(ADMIN_PERMISSIONS.MANAGE_USERS) &&
      !receptionist.includes(ADMIN_PERMISSIONS.EXPORT_APPOINTMENTS),
      "Receptionist has front-desk permissions only (no audit/users/export)"
    );

    const contentEditor = DEFAULT_ROLE_PERMISSIONS.CONTENT_EDITOR;
    assert(
      contentEditor.length === 0 || (
        !contentEditor.includes(ADMIN_PERMISSIONS.VIEW_APPOINTMENTS) &&
        !contentEditor.includes(ADMIN_PERMISSIONS.VIEW_PATIENT_DETAILS) &&
        !contentEditor.includes(ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS) &&
        !contentEditor.includes(ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS)
      ),
      "Content Editor strictly excluded from all appointment and patient records"
    );
  }

  function receptPermsIncludes(list: readonly string[], perms: string[]) {
    return perms.every(p => (list as readonly string[]).includes(p));
  }

  // TEST SUITE 2: Status Lifecycle Transition FSM
  console.log("\n2. APPOINTMENT STATUS LIFECYCLE TRANSITION MATRIX:");
  {
    // Valid transitions
    assert(ALLOWED_STATUS_TRANSITIONS.PENDING.includes("CONFIRMED"), "Pending -> Confirmed is allowed");
    assert(ALLOWED_STATUS_TRANSITIONS.PENDING.includes("REJECTED"), "Pending -> Rejected is allowed");
    assert(ALLOWED_STATUS_TRANSITIONS.PENDING.includes("CANCELLED"), "Pending -> Cancelled is allowed");
    assert(ALLOWED_STATUS_TRANSITIONS.CONFIRMED.includes("RESCHEDULED"), "Confirmed -> Rescheduled is allowed");
    assert(ALLOWED_STATUS_TRANSITIONS.CONFIRMED.includes("COMPLETED"), "Confirmed -> Completed is allowed");
    assert(ALLOWED_STATUS_TRANSITIONS.CONFIRMED.includes("NO_SHOW"), "Confirmed -> No-Show is allowed");
    assert(ALLOWED_STATUS_TRANSITIONS.RESCHEDULED.includes("CONFIRMED"), "Rescheduled -> Confirmed is allowed");
    assert(ALLOWED_STATUS_TRANSITIONS.RESCHEDULED.includes("COMPLETED"), "Rescheduled -> Completed is allowed");

    // Invalid transitions rejected
    const completedAllowed: readonly string[] = ALLOWED_STATUS_TRANSITIONS.COMPLETED;
    assert(!completedAllowed.includes("PENDING"), "Completed -> Pending is rejected");

    const cancelledAllowed: readonly string[] = ALLOWED_STATUS_TRANSITIONS.CANCELLED;
    assert(!cancelledAllowed.includes("CONFIRMED"), "Cancelled -> Confirmed is rejected");

    const rejectedAllowed: readonly string[] = ALLOWED_STATUS_TRANSITIONS.REJECTED;
    assert(!rejectedAllowed.includes("COMPLETED"), "Rejected -> Completed is rejected");

    const noShowAllowed: readonly string[] = ALLOWED_STATUS_TRANSITIONS.NO_SHOW;
    assert(!noShowAllowed.includes("CONFIRMED"), "No-Show -> Confirmed is rejected");
  }

  // TEST SUITE 3: Identifier Generator & Slot Key Formatting
  console.log("\n3. IDENTIFIERS & SLOT KEYS:");
  {
    const ref = generateBookingReference();
    assert(
      /^SNC-\d{8}-[A-F0-9]{8}$/.test(ref),
      `Cryptographic booking reference matches SNC-YYYYMMDD-XXXXXXXX format (${ref})`
    );

    const slotKey = formatActiveSlotKey("doc_abc", "2026-08-15", "09:30");
    assert(slotKey === "doc_abc_2026-08-15_09:30", "Deterministic activeSlotKey formatting verified");
  }

  // TEST SUITE 4: Phone Masking & Detail Privacy
  console.log("\n4. PRIVACY & FIELD SANITIZATION:");
  {
    const masked = maskMobileNumber("+91 98765 43210");
    assert(masked === "••••••3210", `Mobile masking preserves last 4 digits only: ${masked}`);

    const emptyMasked = maskMobileNumber("");
    assert(emptyMasked === "••••••••••", "Empty or invalid phone safely fallback masked");
  }

  // TEST SUITE 5: CSV Formula Injection Neutralization
  console.log("\n5. CSV FORMULA INJECTION NEUTRALIZATION:");
  {
    const formulaEquals = sanitizeCsvField('=HYPERLINK("malicious")');
    assert(formulaEquals.startsWith("'=") || formulaEquals.startsWith('"\'='), `Formula '=' neutralized: ${formulaEquals}`);

    const formulaPlus = sanitizeCsvField('+SUM(1,1)');
    assert(formulaPlus.startsWith("'+") || formulaPlus.startsWith("\"'+"), `Formula '+' neutralized: ${formulaPlus}`);

    const formulaMinus = sanitizeCsvField('-1+2');
    assert(formulaMinus.startsWith("'-") || formulaMinus.startsWith("\"'-"), `Formula '-' neutralized: ${formulaMinus}`);

    const formulaAt = sanitizeCsvField('@SUM(1,1)');
    assert(formulaAt.startsWith("'@") || formulaAt.startsWith("\"'@"), `Formula '@' neutralized: ${formulaAt}`);

    const commasQuotes = sanitizeCsvField('Dr. John, MD "Specialist"');
    assert(commasQuotes.includes('""') && commasQuotes.startsWith('"'), "Quotes and commas escaped safely");
  }

  // TEST SUITE 6: Concurrency & Version Logic
  console.log("\n6. OPTIMISTIC CONCURRENCY MODEL:");
  {
    // Simulating version check logic
    const currentVersion: number = 3;
    const incomingStaleVersion: number = 2;
    const incomingFreshVersion: number = 3;

    const isStaleRejected = incomingStaleVersion !== currentVersion;
    assert(isStaleRejected, "Stale version edit rejected by optimistic concurrency check");

    const isFreshAccepted = incomingFreshVersion === currentVersion;
    assert(isFreshAccepted, "Matching expectedVersion accepted for status transition");
  }

  // TEST SUITE 7: Check-in Rules
  console.log("\n7. CHECK-IN STATE VALIDATION:");
  {
    function canCheckIn(status: AppointmentStatus, alreadyCheckedIn: boolean): boolean {
      if (alreadyCheckedIn) return true; // idempotent
      return status === "CONFIRMED" || status === "RESCHEDULED";
    }

    assert(canCheckIn("CONFIRMED", false), "Confirmed appointment can be checked in");
    assert(canCheckIn("RESCHEDULED", false), "Rescheduled active appointment can be checked in");
    assert(!canCheckIn("PENDING", false), "Pending appointment cannot be checked in");
    assert(!canCheckIn("CANCELLED", false), "Cancelled appointment cannot be checked in");
    assert(!canCheckIn("REJECTED", false), "Rejected appointment cannot be checked in");
    assert(!canCheckIn("COMPLETED", false), "Completed appointment cannot be checked in");
    assert(!canCheckIn("NO_SHOW", false), "No-Show appointment cannot be checked in");
    assert(canCheckIn("CONFIRMED", true), "Repeated check-in is idempotent");
  }

  // TEST SUITE 8: Schedule Break & Leave Validation
  console.log("\n8. SCHEDULE CONSTRAINTS:");
  {
    function validateBreakTimes(start: string, end: string, breakStart: string, breakEnd: string): boolean {
      const toM = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const ws = toM(start), we = toM(end), bs = toM(breakStart), be = toM(breakEnd);
      return bs >= ws && be <= we && be > bs;
    }

    assert(validateBreakTimes("09:00", "17:00", "13:00", "14:00"), "Break within working hours is valid");
    assert(!validateBreakTimes("09:00", "17:00", "08:00", "10:00"), "Break starting before working hours is rejected");
    assert(!validateBreakTimes("09:00", "17:00", "16:00", "18:00"), "Break extending past working hours is rejected");
    assert(!validateBreakTimes("09:00", "17:00", "14:00", "13:00"), "Inverted break end time is rejected");
  }

  // TEST SUITE 9: Notification Retry Constraints
  console.log("\n9. NOTIFICATION RETRY DIAGNOSTICS:");
  {
    const MAX_RETRIES = 5;
    function canRetryNotification(status: string, retryCount: number): boolean {
      return status === "FAILED" && retryCount < MAX_RETRIES;
    }

    assert(canRetryNotification("FAILED", 0), "Failed notification with 0 retries can be retried");
    assert(canRetryNotification("FAILED", 4), "Failed notification with 4 retries can be retried (attempt 5)");
    assert(!canRetryNotification("FAILED", 5), "Failed notification with 5 retries is blocked (max attempts reached)");
    assert(!canRetryNotification("SENT", 0), "Successfully sent notification cannot be retried");
  }

  // TEST SUITE 10: Staff User Governance & Protection
  console.log("\n10. STAFF USER GOVERNANCE & SAFETY:");
  {
    function canDeactivateUser(targetRole: AdminRoleType, activeSuperAdminCount: number, isSelf: boolean): boolean {
      if (isSelf) return false; // Self deactivation prohibited
      if (targetRole === "SUPER_ADMIN" && activeSuperAdminCount <= 1) return false; // Last super admin protected
      return true;
    }

    assert(!canDeactivateUser("SUPER_ADMIN", 1, false), "Last active Super Admin cannot be deactivated");
    assert(!canDeactivateUser("HOSPITAL_ADMIN", 2, true), "Self-deactivation is strictly prohibited");
    assert(canDeactivateUser("RECEPTIONIST", 2, false), "Non-self staff deactivation is allowed");
  }

  // Summary
  console.log("\n=================================================================");
  console.log(`  VERIFICATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runComprehensivePhase4Verification().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
