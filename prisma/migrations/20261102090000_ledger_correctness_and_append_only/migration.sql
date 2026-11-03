-- CreateTable
CREATE TABLE IF NOT EXISTS "IncidentLog" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'HIGH',
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IncidentLog_category_idx" ON "IncidentLog"("category");
CREATE INDEX IF NOT EXISTS "IncidentLog_severity_idx" ON "IncidentLog"("severity");
CREATE INDEX IF NOT EXISTS "IncidentLog_createdAt_idx" ON "IncidentLog"("createdAt");

-- CHECK Constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LedgerEntry_amount_check') THEN
    ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_amount_check" CHECK ("amount" <> 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TinatCreditTransaction_amount_check') THEN
    ALTER TABLE "TinatCreditTransaction" ADD CONSTRAINT "TinatCreditTransaction_amount_check" CHECK ("amount" <> 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LedgerAccount_user_wallet_balance_check') THEN
    ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_user_wallet_balance_check" CHECK ("kind" != 'USER_WALLET' OR "balance" >= 0);
  END IF;
END $$;

-- Append-Only Trigger Function
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger records are immutable and append-only. Prohibited % operation on table %', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_ledger_journal ON "LedgerJournal";
CREATE TRIGGER trg_immutable_ledger_journal
BEFORE UPDATE OR DELETE ON "LedgerJournal"
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

DROP TRIGGER IF EXISTS trg_immutable_ledger_entry ON "LedgerEntry";
CREATE TRIGGER trg_immutable_ledger_entry
BEFORE UPDATE OR DELETE ON "LedgerEntry"
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

DROP TRIGGER IF EXISTS trg_immutable_credit_tx ON "TinatCreditTransaction";
CREATE TRIGGER trg_immutable_credit_tx
BEFORE UPDATE OR DELETE ON "TinatCreditTransaction"
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- Database Role Definition
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tinat_app_role') THEN
    CREATE ROLE tinat_app_role;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO tinat_app_role;
GRANT SELECT, INSERT ON "LedgerJournal", "LedgerEntry", "TinatCreditTransaction" TO tinat_app_role;
REVOKE UPDATE, DELETE, TRUNCATE ON "LedgerJournal", "LedgerEntry", "TinatCreditTransaction" FROM tinat_app_role;
