# Standard Operating Procedure: Incident Response Runbook

**Document Reference:** RB-SEC-001  
**Applies to:** Tinat Health Research Ecosystem  
**Statutory Framework:** Ethiopian Personal Data Protection Proclamation No. 1321/2024  
**Classification:** Internal Confidential / Administrative

---

## 1. Purpose & Incident Classification

This runbook establishes immediate containment, investigation, and remediation protocols for technical, operational, and ethical security incidents on Tinat.

### Severity Levels
- **P0 - Critical Breach:** Direct compromise of participant databases, unauthorized access to the `ParticipantLink` table, unencrypted exposure of National ID (Fayda) hashes, or system-wide outage.
- **P1 - High:** Researcher account compromise, publication of unverified sensitive/minor studies, or severe payment-regulation invariant violation.
- **P2 - Medium:** Single unauthorized study export attempt, rate-limit abuse, or non-critical authentication bypass attempt.
- **P3 - Low:** Minor spam, UI bug, or false positive moderation flag.

---

## 2. Immediate Incident Response Sequence (P0/P1)

```
[Phase 1: Detection & Triage] (0 - 15 mins)
      │
      ▼
[Phase 2: Immediate Containment] (15 - 45 mins)
      │ ├── Revoke compromised session tokens
      │ ├── Isolate affected database/API endpoints
      │ └── If data leakage suspected: Pause affected studies
      │
      ▼
[Phase 3: Forensic Audit & Evidence Preservation] (1 - 4 hours)
      │ ├── Query append-only ActivityLog & LedgerJournal
      │ ├── Extract append-only monitored audit trails
      │ └── Preserve database transaction snapshots
      │
      ▼
[Phase 4: Statutory Notification & Remediation] (< 72 hours)
      │ ├── Execute Breach Notification Runbook (RB-SEC-002)
      │ ├── Notify Data Protection Authority (Proclamation 1321/2024)
      │ └── Deploy technical patch & rotate keys
      │
      ▼
[Phase 5: Post-Incident Review & Ethics Board Debrief]
```

---

## 3. Immediate Containment Checklist

1. **Session & Credential Invalidation:**
   ```bash
   # Emergency admin revocation script
   npm run auth:revoke-sessions -- --userId=<compromisedUserId>
   ```
2. **Emergency Study Pause:**
   If a study is leaking data or violating ethical protocols:
   - Navigate to `/admin/moderation` or execute:
     `PATCH /api/admin/studies/[id]/status` with `{ "status": "PAUSED" }`
3. **Database Network Isolation:**
   - Verify connection firewalls on port 54345; limit database access strictly to production container VPC.
4. **Log Preservation:**
   - Snapshot table `ActivityLog` and Postgres WAL logs for forensic timeline reconstruction.
