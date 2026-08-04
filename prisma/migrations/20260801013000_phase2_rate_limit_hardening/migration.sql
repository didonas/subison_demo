-- DropIndex
DROP INDEX "RateLimit_identifier_key";

-- AlterTable
ALTER TABLE "RateLimit" ADD COLUMN     "action" TEXT NOT NULL DEFAULT 'CONTACT_FORM',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "lastAttempt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimit_lockedUntil_idx" ON "RateLimit"("lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_identifier_action_key" ON "RateLimit"("identifier", "action");
