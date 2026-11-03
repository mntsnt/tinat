# Standard Operating Procedure: Disaster Recovery & Data Resilience

**Document Reference:** RB-OPS-005  
**Applies to:** Production Database, Storage Assets, and Next.js Application  
**Target Recovery Objectives:** RTO < 2 hours | RPO < 15 minutes

---

## 1. Backup Topology & Architecture

Tinat operates PostgreSQL on automated snapshot and Write-Ahead Log (WAL) archiving schedules:
1. **Daily Full Logical Backups:** Executed daily at 02:00 EAT via `pg_dump` with AES-256 encryption.
2. **Continuous WAL Archiving:** Point-in-time recovery (PITR) capability preserving transaction states.
3. **Double-Entry Ledger Integrity:** In the event of restoration, run `scripts/reconcile-ledger.ts` to verify zero discrepancy between `LedgerEntry` sums, `LedgerAccount` balances, and user `Wallet` records.

---

## 2. Emergency Recovery Execution Steps

### Step 1: Provision Recovery PostgreSQL Instance
```bash
docker run -d --name tinat-db-recovery \
  -e POSTGRES_DB=tinat_db \
  -e POSTGRES_USER=tinat_admin \
  -e POSTGRES_PASSWORD=$SECURE_RESTORE_PW \
  -p 54345:5432 \
  postgres:16-alpine
```

### Step 2: Restore from Latest Valid Snapshot
```bash
pg_restore -h localhost -p 54345 -U tinat_admin -d tinat_db --clean --if-exists latest_backup.dump
```

### Step 3: Run Database Migrations & Re-verify Invariants
```bash
npx prisma migrate deploy
npx tsx scripts/reconcile-ledger.ts
```

### Step 4: Validate Append-Only Trigger Integrity
Verify that append-only ledger triggers (`prevent_ledger_journal_tampering`, `prevent_ledger_entry_tampering`) are active and reject UPDATE/DELETE statements.

### Step 5: Application Health Check & DNS Switch
Probe health check endpoint `/api/transparency` and switch DNS target to restored application cluster.
