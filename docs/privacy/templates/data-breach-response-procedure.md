# Data Breach Response & Notification Procedure
**Document Ref:** SOP-BREACH-2026-v1  
**Entity:** Tinat Research Technologies  
**Governing Standard:** Ethiopian Personal Data Protection Proclamation 1321/2024 (Art. 35)  
**Status:** DRAFT TEMPLATE  

---

<!-- TODO: HUMAN TASK: Formal review by Lead Security Officer, DPO, and External Legal Counsel -->

## 1. Objective & Regulatory Scope
Article 35 of the Ethiopian Personal Data Protection Proclamation 1321/2024 mandates that data controllers notify the Supervisory Authority without undue delay (and where feasible, within **72 hours** of becoming aware) of any personal data breach resulting in risk to the rights and freedoms of natural persons.

This procedure establishes the operational steps for detecting, containing, investigating, and reporting security incidents.

---

## 2. Breach Response Lifecycle

```
[Phase 1: Identification & Logging]
                ↓
[Phase 2: Containment & Triage (0 - 4 Hours)]
                ↓
[Phase 3: Forensic Investigation & Risk Assessment (4 - 24 Hours)]
                ↓
[Phase 4: Regulatory & Data Subject Notifications (24 - 72 Hours)]
                ↓
[Phase 5: Remediation & Post-Incident Review]
```

### Phase 1: Identification & Immediate Logging
1. Any developer, administrator, or researcher detecting an anomaly, unexpected data leak, unauthorized privilege escalation, or exfiltration must record the incident immediately via `/admin/incidents`.
2. The incident is classified in `IncidentLog`:
   - `type`: `PERSONAL_DATA_BREACH`, `UNAUTHORIZED_ACCESS_ATTEMPT`, etc.
   - `severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
   - `status`: `OPEN`.

### Phase 2: Containment & Emergency Triage (0–4 Hours)
1. **Isolate Affected Systems:**
   - If AI leak vector: verify `AI_EXTERNAL_ENABLED=false` is enforced.
   - If session or credential leak: rotate compromised JWT signing keys (`AUTH_SECRET`), invalidate active sessions.
   - If network or database exposure: restrict database firewall to known application VPC IPs.
2. Update `IncidentLog.status` to `CONTAINED`.

### Phase 3: Forensic Investigation & Risk Assessment (4–24 Hours)
The Data Protection Lead and Lead Engineer must answer:
1. What data was affected? (Direct identifiers, coded health answers, financial ledger balances).
2. Was the `ParticipantLink` table unmasked or exfiltrated?
3. Were quasi-identifiers exposed without small-cell suppression?
4. How many data subjects were impacted?

### Phase 4: Mandatory Notifications (Within 72 Hours)
1. **Notification to the Ethiopian Data Protection Authority:**
   - Must be submitted within **72 hours** if the breach presents a risk to participants.
   - Content: Nature of breach, categories and approximate number of data subjects, contact details of the DPO, likely consequences, and containment measures taken.
2. **Notification to Affected Participants:**
   - Required without undue delay if the breach is likely to result in a **high risk** to their rights (e.g., identity theft, clinical stigma, financial exposure).
   - Delivered via verified email with clear, non-technical guidance on protective measures.
3. Update `IncidentLog.status` to `NOTIFIED` and record `notifiedParties`.

### Phase 5: Remediation & Closure
1. Deploy code fixes and regression tests.
2. Perform double-entry ledger reconciliation (`scripts/reconcile-ledger.ts`) to verify balance integrity.
3. Update `IncidentLog.status` to `RESOLVED` and document remediation notes.

---

## 3. Incident Response Team Contact Directory

- **Lead Security Engineer:** `security@tinat.et` &bull; `<!-- TODO: HUMAN TASK: Nominate Primary Engineer -->`
- **Data Protection Officer (DPO):** `privacy@tinat.et` &bull; `<!-- TODO: HUMAN TASK: Nominate DPO -->`
- **Legal Counsel:** `legal@tinat.et` &bull; `<!-- TODO: HUMAN TASK: Nominate External Legal Advisor -->`
- **Ethiopian Data Protection Authority Hotline:** `<!-- TODO: HUMAN TASK: Insert regulatory breach hotline -->`
