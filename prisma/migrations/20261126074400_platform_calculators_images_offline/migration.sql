ALTER TABLE "Study"
  ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "coverImageAspect" TEXT NOT NULL DEFAULT '16:9';

ALTER TABLE "Question"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "imageAspect" TEXT NOT NULL DEFAULT '4:3';

ALTER TABLE "QuestionOption"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

ALTER TABLE "Response"
  ADD COLUMN IF NOT EXISTS "submissionKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Response_submissionKey_key"
  ON "Response"("submissionKey");
