-- CreateEnum
CREATE TYPE "FacilityVerification" AS ENUM ('UNVERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'VIMEO');

-- AlterEnum
ALTER TYPE "ContentStatus" ADD VALUE IF NOT EXISTS 'IN_REVIEW';

-- AlterTable
ALTER TABLE "Speciality" 
  ADD COLUMN IF NOT EXISTS "featuredImageId" TEXT,
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publishedByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedByAdminId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "SpecialityTranslation" (
    "id" TEXT NOT NULL,
    "specialityId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "overview" TEXT,
    "symptoms" JSONB,
    "causes" JSONB,
    "whenToSeekCare" TEXT,
    "diagnosticApproach" TEXT,
    "treatmentApproach" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,

    CONSTRAINT "SpecialityTranslation_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Treatment" 
  ADD COLUMN IF NOT EXISTS "featuredImageId" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publishedByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedByAdminId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "TreatmentTranslation" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "overview" TEXT,
    "candidateConditions" JSONB,
    "preparationInfo" TEXT,
    "diagnosticProcess" TEXT,
    "treatmentApproach" TEXT,
    "recoveryInfo" TEXT,
    "risksAndLimitations" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,

    CONSTRAINT "TreatmentTranslation_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Facility" 
  ADD COLUMN IF NOT EXISTS "verificationState" "FacilityVerification" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS "featuredImageId" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publishedByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedByAdminId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "FacilityTranslation" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "availabilityInfo" TEXT,

    CONSTRAINT "FacilityTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DoctorProfile" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "qualifications" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "specialisation" TEXT NOT NULL,
    "experienceYears" INTEGER,
    "training" TEXT,
    "areasOfExpertise" JSONB,
    "memberships" JSONB,
    "languages" JSONB,
    "bioEn" TEXT,
    "bioTa" TEXT,
    "consultationFee" DOUBLE PRECISION NOT NULL,
    "publicNotice" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedByAdminId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY ("id")
);

-- AlterTable Testimonial
ALTER TABLE "Testimonial"
  ADD COLUMN IF NOT EXISTS "patientDisplayName" TEXT,
  ADD COLUMN IF NOT EXISTS "patientLocation" TEXT,
  ADD COLUMN IF NOT EXISTS "content" TEXT,
  ADD COLUMN IF NOT EXISTS "hasConsent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "consentDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewedByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable MediaAsset
CREATE TABLE IF NOT EXISTS "MediaAsset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altTextEn" TEXT,
    "altTextTa" TEXT,
    "captionEn" TEXT,
    "captionTa" TEXT,
    "thumbnailUrl" TEXT,
    "album" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "consentConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "uploadedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- AlterTable VideoItem
ALTER TABLE "VideoItem"
  ADD COLUMN IF NOT EXISTS "provider" "VideoProvider" NOT NULL DEFAULT 'YOUTUBE',
  ADD COLUMN IF NOT EXISTS "videoId" TEXT,
  ADD COLUMN IF NOT EXISTS "embedUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "captionEn" TEXT,
  ADD COLUMN IF NOT EXISTS "captionTa" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable Article
ALTER TABLE "Article"
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "authorName" TEXT,
  ADD COLUMN IF NOT EXISTS "isMedicalReviewed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "reviewedByDoctorName" TEXT,
  ADD COLUMN IF NOT EXISTS "featuredImageId" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "publishedByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedByAdminId" TEXT;

-- CreateTable ArticleTranslation
CREATE TABLE IF NOT EXISTS "ArticleTranslation" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" JSONB NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,

    CONSTRAINT "ArticleTranslation_pkey" PRIMARY KEY ("id")
);

-- AlterTable FAQ
ALTER TABLE "FAQ"
  ADD COLUMN IF NOT EXISTS "pageAssociation" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable FaqTranslation
CREATE TABLE IF NOT EXISTS "FaqTranslation" (
    "id" TEXT NOT NULL,
    "faqId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "FaqTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable NavigationItem
CREATE TABLE IF NOT EXISTS "NavigationItem" (
    "id" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelTa" TEXT,
    "url" TEXT NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable PreviewToken
CREATE TABLE IF NOT EXISTS "PreviewToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreviewToken_pkey" PRIMARY KEY ("id")
);

-- Unique & Index Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "SpecialityTranslation_specialityId_locale_key" ON "SpecialityTranslation"("specialityId", "locale");
CREATE INDEX IF NOT EXISTS "SpecialityTranslation_specialityId_idx" ON "SpecialityTranslation"("specialityId");

CREATE UNIQUE INDEX IF NOT EXISTS "TreatmentTranslation_treatmentId_locale_key" ON "TreatmentTranslation"("treatmentId", "locale");
CREATE INDEX IF NOT EXISTS "TreatmentTranslation_treatmentId_idx" ON "TreatmentTranslation"("treatmentId");

CREATE UNIQUE INDEX IF NOT EXISTS "FacilityTranslation_facilityId_locale_key" ON "FacilityTranslation"("facilityId", "locale");
CREATE INDEX IF NOT EXISTS "FacilityTranslation_facilityId_idx" ON "FacilityTranslation"("facilityId");

CREATE UNIQUE INDEX IF NOT EXISTS "DoctorProfile_doctorId_key" ON "DoctorProfile"("doctorId");

CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX IF NOT EXISTS "MediaAsset_status_idx" ON "MediaAsset"("status");
CREATE INDEX IF NOT EXISTS "MediaAsset_album_idx" ON "MediaAsset"("album");

CREATE INDEX IF NOT EXISTS "VideoItem_status_idx" ON "VideoItem"("status");

CREATE INDEX IF NOT EXISTS "Article_status_idx" ON "Article"("status");
CREATE INDEX IF NOT EXISTS "Article_category_idx" ON "Article"("category");
CREATE UNIQUE INDEX IF NOT EXISTS "ArticleTranslation_articleId_locale_key" ON "ArticleTranslation"("articleId", "locale");
CREATE INDEX IF NOT EXISTS "ArticleTranslation_articleId_idx" ON "ArticleTranslation"("articleId");

CREATE INDEX IF NOT EXISTS "FAQ_status_idx" ON "FAQ"("status");
CREATE INDEX IF NOT EXISTS "FAQ_category_idx" ON "FAQ"("category");
CREATE UNIQUE INDEX IF NOT EXISTS "FaqTranslation_faqId_locale_key" ON "FaqTranslation"("faqId", "locale");
CREATE INDEX IF NOT EXISTS "FaqTranslation_faqId_idx" ON "FaqTranslation"("faqId");

CREATE UNIQUE INDEX IF NOT EXISTS "PreviewToken_token_key" ON "PreviewToken"("token");
CREATE INDEX IF NOT EXISTS "PreviewToken_token_idx" ON "PreviewToken"("token");
CREATE INDEX IF NOT EXISTS "PreviewToken_expiresAt_idx" ON "PreviewToken"("expiresAt");

-- Foreign Keys
ALTER TABLE "SpecialityTranslation" ADD CONSTRAINT "SpecialityTranslation_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "Speciality"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TreatmentTranslation" ADD CONSTRAINT "TreatmentTranslation_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FacilityTranslation" ADD CONSTRAINT "FacilityTranslation_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FaqTranslation" ADD CONSTRAINT "FaqTranslation_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES "FAQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;
