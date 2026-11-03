-- CreateEnum
CREATE TYPE "StudyFundingType" AS ENUM ('FREE', 'FUNDED');

-- CreateEnum
CREATE TYPE "LedgerAccountKind" AS ENUM ('SYSTEM_ISSUANCE', 'USER_WALLET');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'REWARD_CREDIT';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'ADMIN_ADJUSTMENT';

-- AlterTable Study
ALTER TABLE "Study" ADD COLUMN "fundingType" "StudyFundingType" NOT NULL DEFAULT 'FREE';
ALTER TABLE "Study" ADD COLUMN "creditPerResponse" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Study" ADD COLUMN "creditBudget" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Study" ADD COLUMN "creditsSpent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Study" ADD COLUMN "requiresReapproval" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing Study records
UPDATE "Study"
SET "fundingType" = CASE WHEN "studyType"::text = 'FUNDED' THEN 'FUNDED'::"StudyFundingType" ELSE 'FREE'::"StudyFundingType" END,
    "creditPerResponse" = CASE WHEN "studyType"::text = 'FUNDED' THEN "rewardCredits" ELSE 0 END,
    "creditBudget" = CASE WHEN "studyType"::text = 'FUNDED' THEN "budgetCredits" ELSE 0 END,
    "creditsSpent" = CASE WHEN "studyType"::text = 'FUNDED' THEN "creditsPaid" ELSE 0 END;

-- Add database CHECK constraints on Study
ALTER TABLE "Study" ADD CONSTRAINT "Study_funding_check"
CHECK (
  ("fundingType" = 'FREE' AND "creditPerResponse" = 0 AND "creditBudget" = 0) OR
  ("fundingType" = 'FUNDED' AND "creditPerResponse" > 0 AND "creditBudget" >= "creditPerResponse")
);

ALTER TABLE "Study" ADD CONSTRAINT "Study_creditsSpent_check"
CHECK ("creditsSpent" <= "creditBudget");

-- AlterTable Wallet
ALTER TABLE "Wallet" ADD COLUMN "pendingBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Wallet" ADD COLUMN "totalEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Wallet" ADD COLUMN "totalWithdrawn" INTEGER NOT NULL DEFAULT 0;

-- Backfill Wallet totals
UPDATE "Wallet" w
SET "totalEarned" = COALESCE((
  SELECT SUM("amount") FROM "TinatCreditTransaction" t
  WHERE t."walletId" = w."id" AND t."type"::text IN ('EARN', 'REFUND', 'REWARD_CREDIT')
), w."balance"),
"totalWithdrawn" = COALESCE((
  SELECT SUM("amount") FROM "TinatCreditTransaction" t
  WHERE t."walletId" = w."id" AND t."type"::text IN ('WITHDRAW', 'SPEND')
), 0);

-- Add database CHECK constraint on Wallet
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_balance_check"
CHECK ("balance" >= 0);

-- AlterTable TinatCreditTransaction
ALTER TABLE "TinatCreditTransaction" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "TinatCreditTransaction" ADD COLUMN "balanceAfter" INTEGER;

-- Create Indexes on TinatCreditTransaction
CREATE UNIQUE INDEX "TinatCreditTransaction_idempotencyKey_key" ON "TinatCreditTransaction"("idempotencyKey");
CREATE INDEX "TinatCreditTransaction_walletId_idx" ON "TinatCreditTransaction"("walletId");
CREATE INDEX "TinatCreditTransaction_type_idx" ON "TinatCreditTransaction"("type");

-- CreateTable LedgerAccount
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "kind" "LedgerAccountKind" NOT NULL,
    "userId" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable LedgerJournal
CREATE TABLE "LedgerJournal" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "studyId" TEXT,
    "responseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable LedgerEntry
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "LedgerAccount_userId_key" ON "LedgerAccount"("userId");
CREATE INDEX "LedgerAccount_kind_idx" ON "LedgerAccount"("kind");

CREATE UNIQUE INDEX "LedgerJournal_idempotencyKey_key" ON "LedgerJournal"("idempotencyKey");
CREATE UNIQUE INDEX "LedgerJournal_responseId_key" ON "LedgerJournal"("responseId");
CREATE INDEX "LedgerJournal_studyId_idx" ON "LedgerJournal"("studyId");

CREATE INDEX "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");
CREATE INDEX "LedgerEntry_journalId_idx" ON "LedgerEntry"("journalId");

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "LedgerJournal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed system issuance account and mirror existing user wallets into LedgerAccount
INSERT INTO "LedgerAccount" ("id", "kind", "userId", "balance", "createdAt", "updatedAt")
VALUES ('system_issuance_account', 'SYSTEM_ISSUANCE', NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "LedgerAccount" ("id", "kind", "userId", "balance", "createdAt", "updatedAt")
SELECT 'la_' || w."userId", 'USER_WALLET', w."userId", w."balance", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Wallet" w
ON CONFLICT ("userId") DO NOTHING;
