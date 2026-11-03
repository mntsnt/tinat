-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DataSubjectRequestType') THEN
    CREATE TYPE "DataSubjectRequestType" AS ENUM ('ACCESS', 'RECTIFICATION', 'ERASURE', 'WITHDRAW_CONSENT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DataSubjectRequestStatus') THEN
    CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED');
  END IF;
END $$;

-- CreateTable ParticipantLink
CREATE TABLE IF NOT EXISTS "ParticipantLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "respondentCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantLink_pkey" PRIMARY KEY ("id")
);

-- Unique indexes on ParticipantLink must exist before ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS "ParticipantLink_respondentCode_key" ON "ParticipantLink"("respondentCode");
CREATE UNIQUE INDEX IF NOT EXISTS "ParticipantLink_studyId_userId_key" ON "ParticipantLink"("studyId", "userId");
CREATE INDEX IF NOT EXISTS "ParticipantLink_studyId_idx" ON "ParticipantLink"("studyId");
CREATE INDEX IF NOT EXISTS "ParticipantLink_userId_idx" ON "ParticipantLink"("userId");

-- CreateTable DataSubjectRequest
CREATE TABLE IF NOT EXISTS "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DataSubjectRequestType" NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "details" JSONB,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- Update User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyNoticeVersion" TEXT NOT NULL DEFAULT '1.0';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP(3);

-- Update IncidentLog table
ALTER TABLE "IncidentLog" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'SECURITY_INCIDENT';
ALTER TABLE "IncidentLog" ADD COLUMN IF NOT EXISTS "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "IncidentLog" ADD COLUMN IF NOT EXISTS "dataAffected" TEXT;
ALTER TABLE "IncidentLog" ADD COLUMN IF NOT EXISTS "notifiedParties" TEXT;
ALTER TABLE "IncidentLog" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'OPEN';

-- Update Response table: Add respondentCode, ipHash, deviceFingerprint
ALTER TABLE "Response" ADD COLUMN IF NOT EXISTS "respondentCode" TEXT;
ALTER TABLE "Response" ADD COLUMN IF NOT EXISTS "ipHash" TEXT;
ALTER TABLE "Response" ADD COLUMN IF NOT EXISTS "deviceFingerprint" TEXT;

-- Data Migration: Populate respondentCode for any existing Response records
UPDATE "Response"
SET "respondentCode" = 'resp_' || substr(md5(random()::text || id), 1, 24)
WHERE "respondentCode" IS NULL;

-- Data Migration: Populate ParticipantLink from existing (studyId, participantId)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Response' AND column_name = 'participantId'
  ) THEN
    INSERT INTO "ParticipantLink" ("id", "userId", "studyId", "respondentCode", "createdAt")
    SELECT 
      'pl_' || substr(md5(random()::text || r.id), 1, 20),
      r."participantId",
      r."studyId",
      r."respondentCode",
      r."submittedAt"
    FROM "Response" r
    WHERE r."participantId" IS NOT NULL
    ON CONFLICT ("studyId", "userId") DO NOTHING;
  END IF;
END $$;

-- Enforce NOT NULL on Response.respondentCode
ALTER TABLE "Response" ALTER COLUMN "respondentCode" SET NOT NULL;

-- Drop foreign key and unique constraint on Response.participantId if they exist
ALTER TABLE "Response" DROP CONSTRAINT IF EXISTS "Response_participantId_fkey";
DROP INDEX IF EXISTS "Response_studyId_participantId_key";

-- Drop participantId column from Response to physically enforce link separation
ALTER TABLE "Response" DROP COLUMN IF EXISTS "participantId";

-- Create indexes for Response
CREATE UNIQUE INDEX IF NOT EXISTS "Response_respondentCode_key" ON "Response"("respondentCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Response_studyId_respondentCode_key" ON "Response"("studyId", "respondentCode");
CREATE INDEX IF NOT EXISTS "Response_studyId_idx" ON "Response"("studyId");

-- Create indexes for DataSubjectRequest & IncidentLog
CREATE INDEX IF NOT EXISTS "DataSubjectRequest_userId_idx" ON "DataSubjectRequest"("userId");
CREATE INDEX IF NOT EXISTS "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");
CREATE INDEX IF NOT EXISTS "IncidentLog_status_idx" ON "IncidentLog"("status");

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ParticipantLink_userId_fkey') THEN
    ALTER TABLE "ParticipantLink" ADD CONSTRAINT "ParticipantLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ParticipantLink_studyId_fkey') THEN
    ALTER TABLE "ParticipantLink" ADD CONSTRAINT "ParticipantLink_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DataSubjectRequest_userId_fkey') THEN
    ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
