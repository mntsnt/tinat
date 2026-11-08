-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StudyFormat') THEN
    CREATE TYPE "StudyFormat" AS ENUM ('STANDARD', 'TINTOK');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StudyLinkType') THEN
    CREATE TYPE "StudyLinkType" AS ENUM ('TINTOK_VERSION');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "Study" ADD COLUMN IF NOT EXISTS "format" "StudyFormat" NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "Study" ADD COLUMN IF NOT EXISTS "parentStudyId" TEXT;
ALTER TABLE "Study" ADD COLUMN IF NOT EXISTS "linkType" "StudyLinkType";
ALTER TABLE "Study" ADD COLUMN IF NOT EXISTS "teaserLinkEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Study_parentStudyId_idx" ON "Study"("parentStudyId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Study_parentStudyId_fkey'
  ) THEN
    ALTER TABLE "Study" ADD CONSTRAINT "Study_parentStudyId_fkey" FOREIGN KEY ("parentStudyId") REFERENCES "Study"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Database CHECK constraint: Only a TINTOK study may reference a parent study
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'study_parent_format_check'
  ) THEN
    ALTER TABLE "Study" ADD CONSTRAINT "study_parent_format_check" CHECK (
      "parentStudyId" IS NULL OR "format" = 'TINTOK'
    );
  END IF;
END $$;
