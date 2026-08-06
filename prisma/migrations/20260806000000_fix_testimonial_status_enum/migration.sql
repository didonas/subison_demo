-- AlterTable: Safely align Testimonial.status with TestimonialStatus enum declared in Prisma schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TestimonialStatus') THEN
    CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');
  END IF;
END $$;

ALTER TABLE "Testimonial" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Testimonial"
  ALTER COLUMN "status" TYPE "TestimonialStatus"
  USING (
    CASE "status"::text
      WHEN 'PUBLISHED' THEN 'APPROVED'::"TestimonialStatus"
      WHEN 'DRAFT' THEN 'PENDING_REVIEW'::"TestimonialStatus"
      WHEN 'ARCHIVED' THEN 'ARCHIVED'::"TestimonialStatus"
      WHEN 'APPROVED' THEN 'APPROVED'::"TestimonialStatus"
      WHEN 'PENDING_REVIEW' THEN 'PENDING_REVIEW'::"TestimonialStatus"
      WHEN 'REJECTED' THEN 'REJECTED'::"TestimonialStatus"
      ELSE 'PENDING_REVIEW'::"TestimonialStatus"
    END
  );

ALTER TABLE "Testimonial" ALTER COLUMN "status" SET DEFAULT 'PENDING_REVIEW'::"TestimonialStatus";
