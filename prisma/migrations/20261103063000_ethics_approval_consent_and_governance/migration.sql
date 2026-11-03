-- 1. Alter StudyType enum to add SURVEY and OBSERVATIONAL
ALTER TYPE "StudyType" ADD VALUE IF NOT EXISTS 'SURVEY';
ALTER TYPE "StudyType" ADD VALUE IF NOT EXISTS 'OBSERVATIONAL';

-- 2. Create Enums
DO $$ BEGIN
  CREATE TYPE "EthicsApprovalStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ModerationStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Add Study governance and ethics fields
ALTER TABLE "Study"
  ADD COLUMN IF NOT EXISTS "ethicsExempt" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ethicsExemptionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "ethicsExemptedByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "ethicsExemptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "populationDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "recruitmentMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "containsSensitiveTopics" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "involvesMinors" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "safetyProtocolText" TEXT,
  ADD COLUMN IF NOT EXISTS "firstApprovedByAdminId" TEXT,
  ADD COLUMN IF NOT EXISTS "secondApprovedByAdminId" TEXT;

-- 4. Add User governance acceptance fields
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "termsAcceptedVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "charterAcceptedVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "charterAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "codeOfConductAcceptedVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "codeOfConductAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dpaAcceptedVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "dpaAcceptedAt" TIMESTAMP(3);

-- 5. Add Question skippable and prefer not to answer options
ALTER TABLE "Question"
  ADD COLUMN IF NOT EXISTS "isSkippable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "preferNotToAnswerEnabled" BOOLEAN NOT NULL DEFAULT true;

-- 6. Create Table EthicsApproval
CREATE TABLE IF NOT EXISTS "EthicsApproval" (
  "id" TEXT NOT NULL,
  "studyId" TEXT NOT NULL,
  "committeeName" TEXT NOT NULL,
  "approvalNumber" TEXT NOT NULL,
  "approvalDate" TIMESTAMP(3) NOT NULL,
  "expiryDate" TIMESTAMP(3) NOT NULL,
  "documentPath" TEXT NOT NULL,
  "verifiedByAdminId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "status" "EthicsApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "adminNotes" TEXT,
  "checklist" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EthicsApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EthicsApproval_studyId_key" ON "EthicsApproval"("studyId");
CREATE INDEX IF NOT EXISTS "EthicsApproval_status_idx" ON "EthicsApproval"("status");
CREATE INDEX IF NOT EXISTS "EthicsApproval_expiryDate_idx" ON "EthicsApproval"("expiryDate");

-- 7. Create Table ConsentForm
CREATE TABLE IF NOT EXISTS "ConsentForm" (
  "id" TEXT NOT NULL,
  "studyId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "language" TEXT NOT NULL DEFAULT 'en',
  "keyInformation" JSONB NOT NULL,
  "fullText" TEXT NOT NULL,
  "comprehensionQuestions" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ConsentForm_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConsentForm_studyId_version_language_key" ON "ConsentForm"("studyId", "version", "language");
CREATE INDEX IF NOT EXISTS "ConsentForm_studyId_idx" ON "ConsentForm"("studyId");

-- 8. Create Table ConsentRecord
CREATE TABLE IF NOT EXISTS "ConsentRecord" (
  "id" TEXT NOT NULL,
  "respondentCode" TEXT NOT NULL,
  "consentFormId" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "comprehensionAnswers" JSONB NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'en',
  "withdrawnAt" TIMESTAMP(3),
  "withdrawalReason" TEXT,

  CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ConsentRecord_respondentCode_idx" ON "ConsentRecord"("respondentCode");
CREATE INDEX IF NOT EXISTS "ConsentRecord_consentFormId_idx" ON "ConsentRecord"("consentFormId");

-- 9. Create Table ModerationReport
CREATE TABLE IF NOT EXISTS "ModerationReport" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT,
  "studyId" TEXT,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "status" "ModerationStatus" NOT NULL DEFAULT 'OPEN',
  "resolutionNotes" TEXT,
  "resolvedByAdminId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "deadline" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ModerationReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ModerationReport_status_idx" ON "ModerationReport"("status");
CREATE INDEX IF NOT EXISTS "ModerationReport_deadline_idx" ON "ModerationReport"("deadline");
CREATE INDEX IF NOT EXISTS "ModerationReport_resourceId_resourceType_idx" ON "ModerationReport"("resourceId", "resourceType");

-- 10. Create Table EthicsBoardMember
CREATE TABLE IF NOT EXISTS "EthicsBoardMember" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "appointedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EthicsBoardMember_pkey" PRIMARY KEY ("id")
);

-- 11. Create Table EthicsBoardDecision
CREATE TABLE IF NOT EXISTS "EthicsBoardDecision" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "meetingDate" TIMESTAMP(3) NOT NULL,
  "summary" TEXT NOT NULL,
  "resolution" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EthicsBoardDecision_pkey" PRIMARY KEY ("id")
);

-- 12. Add Foreign Key Constraints safely
DO $$ BEGIN
  ALTER TABLE "EthicsApproval"
    ADD CONSTRAINT "EthicsApproval_studyId_fkey"
    FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "EthicsApproval"
    ADD CONSTRAINT "EthicsApproval_verifiedByAdminId_fkey"
    FOREIGN KEY ("verifiedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ConsentForm"
    ADD CONSTRAINT "ConsentForm_studyId_fkey"
    FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ConsentRecord"
    ADD CONSTRAINT "ConsentRecord_consentFormId_fkey"
    FOREIGN KEY ("consentFormId") REFERENCES "ConsentForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ModerationReport"
    ADD CONSTRAINT "ModerationReport_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ModerationReport"
    ADD CONSTRAINT "ModerationReport_studyId_fkey"
    FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 13. Grandfather existing active studies with recorded administrative ethics exemption
UPDATE "Study"
SET
  "ethicsExempt" = true,
  "ethicsExemptionReason" = 'Grandfathered baseline academic study prior to Ethics Gatekeeping enforcement (Proclamation 1321/2024 compliance policy)'
WHERE "status" = 'ACTIVE' AND "ethicsExempt" = false;
