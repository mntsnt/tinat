# Platform Privacy Notice Template
**Document Ref:** PRIVACY-NOTICE-v1.0  
**Effective Date:** `<!-- TODO: HUMAN TASK: Insert effective date upon legal sign-off -->`  
**Governing Law:** Ethiopian Personal Data Protection Proclamation 1321/2024 (Articles 15-18)  
**Status:** DRAFT TEMPLATE  

---

<!-- TODO: HUMAN TASK: Legal counsel review before public deployment -->

## 1. Who We Are (Data Controller)
Tinat Research Technologies ("Tinat", "we", "us") operates an academic and clinical health research platform designed to connect verified participants with institutional research studies in Ethiopia.
- **Physical Address:** `<!-- TODO: HUMAN TASK: Insert registered corporate address in Addis Ababa, Ethiopia -->`
- **Data Protection Officer (DPO):** `privacy@tinat.et` &bull; `<!-- TODO: HUMAN TASK: Designate and register DPO name -->`
- **Supervisory Regulator:** Ethiopian Data Protection Authority

---

## 2. Personal Data We Collect
1. **Account Registration Data:** Full name, verified email address, optional contact phone number, academic institution, field of study, and encrypted password hash.
2. **National Identity Verification:** Salted SHA-256 cryptographic hash of your national identity via the Fayda eSignet identity flow. We do not store raw National Identification Numbers (FAN) or biometric prints.
3. **Research Participation Data:** Questionnaire answers, survey choices, and demographic details.
4. **Platform & Token Ledger Data:** Double-entry Tinat Credit token balances, reward transaction journals, and audit logs.
5. **Security Telemetry:** Salted IP hashes and device fingerprints (automatically expunged after 90 days).

---

## 3. Confidential & Coded Linkage (Not Anonymous)
Under Proclamation 1321/2024, research answers are **confidential and coded (pseudonymized)**, not anonymous:
- When you answer a study, your responses are tagged with a non-guessable, randomly generated `respondentCode`.
- Your personal identity is separated from your answers and stored in a secure server-side link table reachable only by automated credit reward distribution and fraud prevention logic.
- Researchers receive only de-identified responses tagged by Respondent Code. Researchers never receive your name, phone number, email, or direct identifiers.
- Unmasking of a participant link is strictly prohibited except in formal, documented investigations of multi-accounting research fraud authorized by platform administrators and recorded in the permanent audit log.

---

## 4. Legal Bases for Processing (Proclamation 1321/2024)
- **Explicit Consent (Art. 6):** For your voluntary participation in research questionnaires and optional demographic profiling.
- **Contractual Performance (Art. 7):** To create your account, provide platform dashboards, and distribute Tinat Credit rewards.
- **Legal & Regulatory Compliance:** For statutory retention of financial audit records and data protection requests.
- **Legitimate Scientific Research (Art. 8):** For academic synthesis, statistical cohort reporting, and public health policy development.

---

## 5. Third-Party Sub-Processors & Data Transfers
- **Transactional Email:** For security codes and verification links.
- **Fayda eSignet:** For national identity uniqueness verification.
- **External AI Boundaries:** Third-party AI model providers (e.g., Google Cloud, OpenRouter) are **disabled by default** (`AI_EXTERNAL_ENABLED=false`). No participant health data is transmitted to third-party AI models without explicit administrative activation.
- `<!-- TODO: HUMAN TASK: Confirm cross-border transfer agreements and data center sovereignty -->`

---

## 6. Your Statutory Rights as a Data Subject
Under Articles 21–27 of Proclamation 1321/2024, you have enforceable rights:
1. **Right to Access & Data Portability (Art. 21):** Download your personal data in structured JSON format via Settings &gt; Data Protection.
2. **Right to Rectification (Art. 22):** Correct inaccurate or incomplete profile details at any time.
3. **Right to Erasure (Art. 24):** Request account deletion. Direct identifiers will be purged within the 30-day statutory timeline. (Notice: Financial double-entry ledger lines must be retained under statutory banking audit requirements).
4. **Right to Withdraw Consent (Art. 6(3)):** Withdraw consent for optional processing without affecting past research.
5. **Right to Lodge a Complaint (Art. 27):** File a complaint with the Ethiopian Data Protection Authority.

---

## 7. Retention Periods
- **Direct Identifiers:** Life of account + 30 days post-erasure.
- **Research Responses:** Retained as de-identified scientific records under Respondent Codes.
- **Technical Telemetry:** 90 days (automated cryptographic purge).
- **Double-Entry Ledgers:** 7 years (statutory accounting audit requirement).
