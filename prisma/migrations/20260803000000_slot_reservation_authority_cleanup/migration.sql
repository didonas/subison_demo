-- Migration: 20260803000000_slot_reservation_authority_cleanup
-- Drop unique index on activeSlotKey to allow multi-capacity slot reservations via SlotReservation model
DROP INDEX IF EXISTS "Appointment_activeSlotKey_key";

-- Nullify legacy activeSlotKey values to preserve record integrity while migrating authority to SlotReservation
UPDATE "Appointment" SET "activeSlotKey" = NULL WHERE "activeSlotKey" IS NOT NULL;
