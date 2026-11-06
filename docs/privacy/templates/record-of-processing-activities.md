# Record of Processing Activities (ROPA)
**Document Ref:** ROPA-TINAT-2026-v1  
**Entity:** Tinat Research Technologies  
**Governing Standard:** Ethiopian Personal Data Protection Proclamation 1321/2024 (Art. 29)  
**Status:** DRAFT TEMPLATE  

---

<!-- TODO: HUMAN TASK: Complete regulatory registration with the Ethiopian Data Protection Authority -->

## 1. Controller & Governance Details
- **Data Controller:** Tinat Research Technologies, Addis Ababa, Ethiopia
- **Representative:** `<!-- TODO: HUMAN TASK: Nominate Managing Director / General Counsel -->`
- **Data Protection Officer (DPO):** `contact.tinatapp@gmail.com` &bull; `<!-- TODO: HUMAN TASK: Register official DPO -->`

---

## 2. Inventory of Processing Activities

### Activity 1: Participant Identity Verification & Account Management
- **Purpose:** Onboarding research participants, verifying email and Fayda national ID uniqueness, securing user sessions.
- **Data Categories:** Full name, email address, phone, password hash, Fayda hashed identifier (`faydaFanHash`), verification dates.
- **Data Subjects:** Research participants, researchers, field data collectors.
- **Legal Basis:** Performance of Contract (Art. 7) & Legal Obligation.
- **Recipients:** Internal system, national identity provider (Fayda eSignet).
- **Retention Period:** Duration of user account + statutory financial retention.
- **Security Measures:** Bcrypt hashing, salted SHA-256 for National ID, HTTPS/TLS 1.3, rate limiting.

### Activity 2: Research Study Participation & Answer Collection
- **Purpose:** Administering health questionnaires, gathering clinical and public health survey responses.
- **Data Categories:** Questionnaire answers (numerical, categorical, free text), submission timestamps, collection method (self vs field collector).
- **Data Subjects:** Enrolled research study respondents.
- **Legal Basis:** Explicit Informed Consent (Art. 6) & Scientific Research (Art. 8).
- **Recipients:** Author of study (researcher), verified platform administrators.
- **Retention Period:** Permanent scientific archive in de-identified, coded form.
- **Security Measures:** Coded Link Separation (`ParticipantLink`), non-guessable `respondentCode`, direct identifiers physically excluded from `Response` model.

### Activity 3: Tinat Credits Double-Entry Accounting
- **Purpose:** Allocating non-cash Tinat Credit tokens to participants completing funded research.
- **Data Categories:** Wallet balance, transaction ledger entries, idempotency keys, study references.
- **Data Subjects:** Participants earning credits.
- **Legal Basis:** Performance of Contract (Art. 7).
- **Recipients:** Participant, platform administrators, financial audit authorities.
- **Retention Period:** 7 years statutory accounting hold.
- **Security Measures:** Append-only database triggers, double-entry balanced accounting (system issuance vs participant wallet), non-cash token invariants.

### Activity 4: Research Export De-Identification & Dissemination
- **Purpose:** Exporting research datasets to institutional investigators in CSV/Excel format.
- **Data Categories:** De-identified answers tagged by `respondentCode`.
- **Data Subjects:** Study respondents.
- **Legal Basis:** Scientific Research (Art. 8) under Consent.
- **Recipients:** Approved research principal investigators.
- **Retention Period:** Dependent on researcher protocol.
- **Security Measures:** De-identification engine: removal of direct identifiers, age banding into 10-year brackets, geographic generalization, small-cell suppression ($k=5$), free-text review flags, ActivityLog export audit.

---

## 3. Technical & Organizational Safeguards (Summary)
- **Encryption:** TLS 1.3 in transit; PostgreSQL encrypted tables at rest.
- **Access Controls:** Role-based access control (`ADMIN`, `RESEARCHER`, `PARTICIPANT`, `DATA_COLLECTOR`) enforced server-side on every route handler.
- **Deny-by-Default:** Centralized guards (`requireUser`, `requireRole`, `requireProjectMember`, `requireStudyOwnerOrAdmin`).
- **Telemetry Sanitization:** Automated nightly cron purging IP hashes and device fingerprints older than 90 days.
- **Audit Trails:** Append-only ActivityLog recording all security events, exports, and fraud unmasking operations.
