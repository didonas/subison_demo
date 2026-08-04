-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "activeSlotKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_activeSlotKey_key" ON "Appointment"("activeSlotKey");
