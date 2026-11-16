CREATE TYPE "CollectorPayType" AS ENUM ('FIXED', 'PER_RESPONSE');
CREATE TYPE "CollectorFundingStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

ALTER TABLE "Study"
  ADD COLUMN "collectorsNeeded" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "collectorPayType" "CollectorPayType",
  ADD COLUMN "collectorPayRateCents" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "CollectorFundingVerification" (
  "id" TEXT NOT NULL,
  "studyId" TEXT NOT NULL,
  "researcherId" TEXT NOT NULL,
  "bank" TEXT NOT NULL,
  "transactionReference" TEXT NOT NULL,
  "verificationRequestId" TEXT,
  "expectedAmountCents" INTEGER NOT NULL,
  "verifiedAmountCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'ETB',
  "status" "CollectorFundingStatus" NOT NULL DEFAULT 'PENDING',
  "settlementMatched" BOOLEAN,
  "failureReason" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CollectorFundingVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollectorFundingVerification_verificationRequestId_key"
  ON "CollectorFundingVerification"("verificationRequestId");
CREATE UNIQUE INDEX "CollectorFundingVerification_bank_transactionReference_key"
  ON "CollectorFundingVerification"("bank", "transactionReference");
CREATE UNIQUE INDEX "CollectorFundingVerification_one_pending_per_study_key"
  ON "CollectorFundingVerification"("studyId")
  WHERE "status" = 'PENDING';
CREATE INDEX "CollectorFundingVerification_studyId_status_idx"
  ON "CollectorFundingVerification"("studyId", "status");
CREATE INDEX "CollectorFundingVerification_researcherId_idx"
  ON "CollectorFundingVerification"("researcherId");

ALTER TABLE "CollectorFundingVerification"
  ADD CONSTRAINT "CollectorFundingVerification_studyId_fkey"
  FOREIGN KEY ("studyId") REFERENCES "Study"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectorFundingVerification"
  ADD CONSTRAINT "CollectorFundingVerification_researcherId_fkey"
  FOREIGN KEY ("researcherId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VerifyEtWebhookEvent" (
  "eventId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerifyEtWebhookEvent_pkey" PRIMARY KEY ("eventId")
);

CREATE TABLE "CollectorPayout" (
  "id" TEXT NOT NULL,
  "studyId" TEXT NOT NULL,
  "collectorUserId" TEXT NOT NULL,
  "recordedByUserId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "paymentReference" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CollectorPayout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollectorPayout_paymentReference_key"
  ON "CollectorPayout"("paymentReference");
CREATE INDEX "CollectorPayout_studyId_collectorUserId_idx"
  ON "CollectorPayout"("studyId", "collectorUserId");
CREATE INDEX "CollectorPayout_recordedByUserId_idx"
  ON "CollectorPayout"("recordedByUserId");

ALTER TABLE "CollectorPayout"
  ADD CONSTRAINT "CollectorPayout_studyId_fkey"
  FOREIGN KEY ("studyId") REFERENCES "Study"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectorPayout"
  ADD CONSTRAINT "CollectorPayout_collectorUserId_fkey"
  FOREIGN KEY ("collectorUserId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectorPayout"
  ADD CONSTRAINT "CollectorPayout_recordedByUserId_fkey"
  FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
