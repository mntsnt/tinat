-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DATA_COLLECTOR';

-- AlterTable
ALTER TABLE "Response" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en';

-- CreateTable
CREATE TABLE IF NOT EXISTS "StudyTranslation" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "safetyProtocolText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuestionTranslation" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StudyTranslation_studyId_language_key" ON "StudyTranslation"("studyId", "language");
CREATE INDEX IF NOT EXISTS "StudyTranslation_studyId_idx" ON "StudyTranslation"("studyId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "QuestionTranslation_questionId_language_key" ON "QuestionTranslation"("questionId", "language");
CREATE INDEX IF NOT EXISTS "QuestionTranslation_questionId_idx" ON "QuestionTranslation"("questionId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StudyTranslation_studyId_fkey'
  ) THEN
    ALTER TABLE "StudyTranslation" ADD CONSTRAINT "StudyTranslation_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuestionTranslation_questionId_fkey'
  ) THEN
    ALTER TABLE "QuestionTranslation" ADD CONSTRAINT "QuestionTranslation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
