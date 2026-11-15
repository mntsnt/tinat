DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CollectorApplication" (
  "id" TEXT NOT NULL,
  "studyId" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CollectorApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CollectorApplication_studyId_applicantId_key"
  ON "CollectorApplication"("studyId", "applicantId");
CREATE INDEX IF NOT EXISTS "CollectorApplication_studyId_status_idx"
  ON "CollectorApplication"("studyId", "status");
CREATE INDEX IF NOT EXISTS "CollectorApplication_applicantId_idx"
  ON "CollectorApplication"("applicantId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CollectorApplication_studyId_fkey'
  ) THEN
    ALTER TABLE "CollectorApplication"
      ADD CONSTRAINT "CollectorApplication_studyId_fkey"
      FOREIGN KEY ("studyId") REFERENCES "Study"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CollectorApplication_applicantId_fkey'
  ) THEN
    ALTER TABLE "CollectorApplication"
      ADD CONSTRAINT "CollectorApplication_applicantId_fkey"
      FOREIGN KEY ("applicantId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
