# Data Protection Impact Assessment (DPIA) Template
**Document Ref:** DPIA-TINAT-2026-001  
**Project:** Tinat Health Research Ecosystem  
**Governing Law:** Ethiopian Personal Data Protection Proclamation 1321/2024 (Particularly Art. 28)  
**Status:** DRAFT TEMPLATE  

---

<!-- TODO: HUMAN TASK: Conduct formal review with designated Data Protection Officer (DPO) and Institutional Review Board (IRB) -->

## 1. Description of Processing Operations
- **Nature of Processing:** Electronic capture, storage, pseudonymization, and statistical analysis of public health research surveys and demographic responses.
- **Scope of Data:** Personal demographic identifiers (name, email, phone, age, gender), national identity verification status (Fayda hash), and sensitive health questionnaires (symptoms, clinical history, behavioral determinants).
- **Context & Purpose:** Providing a trusted digital bridge between academic/clinical health researchers and voluntary participants in Ethiopia.
- **Data Subject Categories:** Adult participants (18+), vulnerable patient cohorts, academic researchers, and field data collectors.

---

## 2. Assessment of Necessity & Proportionality
- **Lawfulness of Processing:**
  - Explicit informed consent (Proclamation 1321/2024 Art. 6) for questionnaire participation.
  - Contractual necessity (Art. 7) for user account management and token reward administration.
- **Data Minimization:**
  - Research answers are physically separated from direct personal profiles.
  - Responses are attributed solely to non-guessable, cryptographically random `respondentCode` values.
  - Telemetry (IP hashes and device fingerprints) is automatically purged after 90 days.
- **Storage Limitation:**
  - Direct identifiers purged upon approved erasure requests (subject to 7-year statutory financial audit holds).

---

## 3. Assessment of Privacy & Security Risks

| Identified Risk | Likelihood | Impact | Severity | Technical & Organizational Safeguards | Residual Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Re-identification via Quasi-Identifiers** | Medium | High | HIGH | Small-cell suppression ($k=5$), age banding into 10-year brackets, geographic generalization to zone/region, free-text manual review flags. | LOW |
| **Unauthorized Linkage Unmasking** | Low | High | HIGH | `ParticipantLink` table isolated in `lib/identity/linkService.ts`. Unmasking requires verified Admin role, mandatory recorded justification, and append-only ActivityLog generation. | LOW |
| **Third-Party AI Data Exfiltration** | Medium | Critical | HIGH | `AI_EXTERNAL_ENABLED=false` server-side killswitch. External AI APIs rejected at route layer by default. | LOW |
| **Credential & Account Compromise** | Low | Medium | MEDIUM | Bcrypt password hashing (work factor 12), rate limiting on authentication routes (10/15min), admin re-authentication on critical actions. | LOW |

---

## 4. Consultation & Governance Sign-Off

- **Data Protection Officer Assessment:**  
  `<!-- TODO: HUMAN TASK: DPO formal opinion and recommendations on clinical data sensitivity -->`
- **Lead Principal Investigator / Chief Medical Officer:**  
  `<!-- TODO: HUMAN TASK: Medical ethics sign-off regarding vulnerable cohort protections -->`
- **Regulatory Authority Consultation:**  
  `<!-- TODO: HUMAN TASK: Submit summary to Ethiopian Data Protection Authority if residual high risk remains -->`

---

## 5. Review & Monitoring Schedule
- Periodic Review Interval: Every 12 months or upon material architecture change.
- Automated Audit Check: Nightly double-entry ledger reconciliation and automated 90-day retention purge jobs.
