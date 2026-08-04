-- CreateEnum
CREATE TYPE "BookingChannel" AS ENUM ('ONLINE', 'PHONE', 'WALK_IN', 'ADMIN');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('UNREAD', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "DoctorAvailability" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "effectiveFrom" DATE,
ADD COLUMN "effectiveTo" DATE;

-- AlterTable
ALTER TABLE "HospitalHoliday" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Hospital Holiday',
ADD COLUMN "createdByAdminId" TEXT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "bookingChannel" "BookingChannel" NOT NULL DEFAULT 'ONLINE',
ADD COLUMN "checkedInAt" TIMESTAMP(3),
ADD COLUMN "checkedInByAdminId" TEXT,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN "lastErrorCode" TEXT,
ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PatientEnquiry" ADD COLUMN "assignedToAdminId" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3),
ADD COLUMN "resolvedByAdminId" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "EnquiryStatus" USING ("status"::text::"EnquiryStatus"),
ALTER COLUMN "status" SET DEFAULT 'UNREAD';

-- CreateTable
CREATE TABLE "DoctorBreak" (
    "id" TEXT NOT NULL,
    "doctorAvailabilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorLeave" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByAdminId" TEXT,

    CONSTRAINT "DoctorLeave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotReservation" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentNote" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "authorAdminId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryNote" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "authorAdminId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryStatusHistory" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "fromStatus" "EnquiryStatus" NOT NULL,
    "toStatus" "EnquiryStatus" NOT NULL,
    "changedByAdminId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_resourceType_idx" ON "AuditLog"("resourceType");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX "AuditLog_adminUserId_idx" ON "AuditLog"("adminUserId");

-- CreateIndex
CREATE INDEX "DoctorAvailability_doctorId_dayOfWeek_idx" ON "DoctorAvailability"("doctorId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "DoctorBreak_doctorAvailabilityId_idx" ON "DoctorBreak"("doctorAvailabilityId");

-- CreateIndex
CREATE INDEX "DoctorLeave_doctorId_startDate_endDate_idx" ON "DoctorLeave"("doctorId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "BlockedSlot_date_idx" ON "BlockedSlot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalHoliday_date_key" ON "HospitalHoliday"("date");
CREATE INDEX "HospitalHoliday_date_idx" ON "HospitalHoliday"("date");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");
CREATE INDEX "Appointment_bookingChannel_idx" ON "Appointment"("bookingChannel");
CREATE INDEX "Appointment_doctorId_appointmentDate_startTime_idx" ON "Appointment"("doctorId", "appointmentDate", "startTime");
CREATE INDEX "Appointment_createdAt_idx" ON "Appointment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SlotReservation_appointmentId_key" ON "SlotReservation"("appointmentId");
CREATE UNIQUE INDEX "SlotReservation_doctorId_appointmentDate_startTime_position_key" ON "SlotReservation"("doctorId", "appointmentDate", "startTime", "position");
CREATE INDEX "SlotReservation_doctorId_appointmentDate_startTime_idx" ON "SlotReservation"("doctorId", "appointmentDate", "startTime");

-- CreateIndex
CREATE INDEX "AppointmentNote_appointmentId_idx" ON "AppointmentNote"("appointmentId");
CREATE INDEX "AppointmentNote_authorAdminId_idx" ON "AppointmentNote"("authorAdminId");

-- CreateIndex
CREATE INDEX "AppointmentStatusHistory_appointmentId_idx" ON "AppointmentStatusHistory"("appointmentId");
CREATE INDEX "AppointmentStatusHistory_createdAt_idx" ON "AppointmentStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "PatientEnquiry_status_idx" ON "PatientEnquiry"("status");
CREATE INDEX "PatientEnquiry_createdAt_idx" ON "PatientEnquiry"("createdAt");

-- CreateIndex
CREATE INDEX "EnquiryNote_enquiryId_idx" ON "EnquiryNote"("enquiryId");
CREATE INDEX "EnquiryNote_authorAdminId_idx" ON "EnquiryNote"("authorAdminId");

-- CreateIndex
CREATE INDEX "EnquiryStatusHistory_enquiryId_idx" ON "EnquiryStatusHistory"("enquiryId");
CREATE INDEX "EnquiryStatusHistory_createdAt_idx" ON "EnquiryStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "DoctorBreak" ADD CONSTRAINT "DoctorBreak_doctorAvailabilityId_fkey" FOREIGN KEY ("doctorAvailabilityId") REFERENCES "DoctorAvailability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorLeave" ADD CONSTRAINT "DoctorLeave_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_checkedInByAdminId_fkey" FOREIGN KEY ("checkedInByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotReservation" ADD CONSTRAINT "SlotReservation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentNote" ADD CONSTRAINT "AppointmentNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentNote" ADD CONSTRAINT "AppointmentNote_authorAdminId_fkey" FOREIGN KEY ("authorAdminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientEnquiry" ADD CONSTRAINT "PatientEnquiry_assignedToAdminId_fkey" FOREIGN KEY ("assignedToAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientEnquiry" ADD CONSTRAINT "PatientEnquiry_resolvedByAdminId_fkey" FOREIGN KEY ("resolvedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryNote" ADD CONSTRAINT "EnquiryNote_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "PatientEnquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryNote" ADD CONSTRAINT "EnquiryNote_authorAdminId_fkey" FOREIGN KEY ("authorAdminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryStatusHistory" ADD CONSTRAINT "EnquiryStatusHistory_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "PatientEnquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
