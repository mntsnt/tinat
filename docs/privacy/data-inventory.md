# Data Inventory & Classification Register
**Platform:** Tinat Health Research Ecosystem  
**Governance Standard:** Ethiopian Personal Data Protection Proclamation 1321/2024  
**Last Updated:** November 2026  
**Status:** Canonical Schema Audit  

---

## 1. Overview & Principles

Under Proclamation 1321/2024 and international health research ethics standards, Tinat maintains a strict inventory of all personal, health, and technical telemetry data processed across the platform.

### Classification Tiers
1. **Direct Personal Data (DPD):** Directly identifies a living natural person (e.g., full name, email, phone number, hashed national ID).
2. **Special Category / Sensitive Data (SCD):** Health conditions, survey answers, biographical demographic indicators.
3. **Pseudonymized Research Data (PRD):** Answers linked only to random, non-guessable `respondentCode` values; disconnected from identity tables.
4. **Financial & Token Ledger Data (FTD):** Double-entry audit trails and token balances (retained for statutory compliance).
5. **Technical Telemetry Data (TTD):** Network IP hashes, user agents, device fingerprints (retained for fraud mitigation).

---

## 2. Comprehensive Field-by-Field Register

| Model | Field | Classification | Purpose | Legal Basis (Proc. 1321/2024) | Retention Period | Access Roles | Exported to Researchers? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User** | `id` | DPD | Primary system identifier | Contractual Necessity (Art. 7) | Account duration + 30 days | Self, Admin, System | **NO** (Strictly excluded) |
| **User** | `name` | DPD | Account profile and display | Contractual Necessity (Art. 7) | Account duration | Self, Admin | **NO** (Strictly excluded) |
| **User** | `email` | DPD | Authentication, security alerts | Contractual Necessity (Art. 7) | Account duration | Self, Admin, System | **NO** (Strictly excluded) |
| **User** | `passwordHash` | DPD (Credential) | Secure authentication (bcrypt) | Contractual Necessity (Art. 7) | Account duration | System only | **NO** |
| **User** | `phone` | DPD | Optional contact & 2FA | Explicit Consent (Art. 6) | Account duration | Self, Admin | **NO** (Strictly excluded) |
| **User** | `institution` | DPD | Academic verification | Legitimate Interest | Account duration | Self, Admin, Public profile | **NO** (Excluded from answers) |
| **User** | `fieldOfStudy` | DPD | Academic verification | Legitimate Interest | Account duration | Self, Admin, Public profile | **NO** (Excluded from answers) |
| **User** | `yearOfStudy` | DPD | Academic demographic | Explicit Consent (Art. 6) | Account duration | Self, Admin | **NO** |
| **User** | `isVerified` | DPD (Status) | Email verification state | Security & Integrity | Account duration | Self, Admin, System | **NO** |
| **User** | `faydaVerified` | DPD (Status) | National ID verification flag | Legal Obligation & Consent | Account duration | Self, Admin, System | **NO** |
| **User** | `faydaFanHash` | DPD (Pseudonym) | Salted SHA-256 hash of Fayda FAN | Identity Uniqueness Guard | Account duration + statutory hold | System only | **NO** (Never disclosed) |
| **User** | `faydaVerifiedAt` | DPD | Verification timestamp | Audit compliance | Account duration | Self, Admin, System | **NO** |
| **User** | `privacyNoticeVersion` | DPD (Compliance) | Consent version tracking | Compliance (Art. 6) | Account duration + 7 years | Self, Admin, System | **NO** |
| **User** | `privacyAcceptedAt` | DPD (Compliance) | Consent timestamp tracking | Compliance (Art. 6) | Account duration + 7 years | Self, Admin, System | **NO** |
| **ParticipantLink** | `id` | PRD | Link record identifier | Fraud Prevention & Reward | Life of research study | System, Admin (Fraud Only) | **NO** (Reachable only via linkService) |
| **ParticipantLink** | `userId` | DPD (Relational) | Link back to participant | Reward distribution | Life of research study | System, Admin (Fraud Only) | **NO** (Isolated from exports) |
| **ParticipantLink** | `studyId` | Metadata | Study identifier | Research management | Life of research study | System, Admin (Fraud Only) | **NO** |
| **ParticipantLink** | `respondentCode` | PRD | Non-derivable random code (`resp_...`) | Pseudonymized answer linkage | Permanent research record | System, Researcher, Admin | **YES** (Sole respondent identifier) |
| **Response** | `id` | PRD | Response record identifier | Data management | Life of research study | System, Researcher, Admin | **YES** (Internal row reference) |
| **Response** | `respondentCode` | PRD | Non-derivable participant code | Research answer attribution | Permanent research record | System, Researcher, Admin | **YES** |
| **Response** | `studyId` | Metadata | Target study foreign key | Research linkage | Permanent research record | System, Researcher, Admin | **YES** |
| **Response** | `submittedAt` | PRD | Submission timestamp | Scientific timeline | Permanent research record | System, Researcher, Admin | **YES** (ISO Timestamp) |
| **Response** | `collectionMethod` | Metadata | Self-service vs Field collector | Quality assurance | Permanent research record | System, Researcher, Admin | **YES** |
| **Response** | `collectorId` | DPD (Staff) | Assigned data collector | Chain of custody | Life of study + 3 years | Admin, Collector | **NO** (Masked on public export) |
| **Response** | `collectionSessionId`| Metadata | Offline collection session batch | Batch synchronization | 90 days post-sync | Admin, Collector | **NO** |
| **Response** | `ipHash` | TTD | Salted hash of IP address | Fraud mitigation | **90 days (Auto-purged)** | System only | **NO** (Stripped on export) |
| **Response** | `deviceFingerprint`| TTD | Client hardware hash | Anti-sybil detection | **90 days (Auto-purged)** | System only | **NO** (Stripped on export) |
| **Answer** | `questionId` | Metadata | Survey question identifier | Research data | Permanent research record | System, Researcher, Admin | **YES** |
| **Answer** | `textValue` | SCD / PRD | Participant text response | Scientific Research (Art. 8) | Permanent research record | System, Researcher, Admin | **YES** (Flagged `[FREE_TEXT_NEEDS_REVIEW]`) |
| **Answer** | `numberValue` | SCD / PRD | Numeric participant response | Scientific Research (Art. 8) | Permanent research record | System, Researcher, Admin | **YES** (Banded if age) |
| **Wallet** | `balance` | FTD | Current Tinat Credits balance | Performance of Contract | Account duration + 7 years | Self, Admin, System | **NO** |
| **Wallet** | `totalEarned` | FTD | Historical total credits earned | Performance of Contract | Account duration + 7 years | Self, Admin, System | **NO** |
| **TinatCreditTransaction** | `amount` | FTD | Transaction credit delta | Accounting audit trail | 7 years (Statutory financial hold) | Self, Admin, System | **NO** |
| **TinatCreditTransaction** | `reason` | FTD | Reason / study reference | Accounting audit trail | 7 years (Statutory financial hold) | Self, Admin, System | **NO** |
| **LedgerJournal** | `idempotencyKey` | FTD | Duplicate transaction guard | Double-entry integrity | Permanent append-only ledger | System only | **NO** |
| **LedgerEntry** | `amount` | FTD | Debit/credit line amount | Balanced accounting | Permanent append-only ledger | System, Admin | **NO** |
| **ActivityLog** | `action` | Audit | User or administrative action | Security & Audit compliance | 2 years | Admin, System | **NO** |
| **ActivityLog** | `metadata` | Audit | Action payload details | Security forensic audit | 2 years | Admin, System | **NO** |
| **DataSubjectRequest** | `type` | Compliance | ACCESS, ERASURE, RECTIFY, CONSENT | Legal Obligation (Art. 24) | 5 years post-resolution | Self, Admin, System | **NO** |
| **DataSubjectRequest** | `dueDate` | Compliance | 30-day statutory deadline | Legal Obligation (Art. 24) | 5 years post-resolution | Self, Admin, System | **NO** |
| **IncidentLog** | `type` | Security | Breach / vulnerability category | Legal Obligation (Art. 35) | 10 years (Statutory record) | Admin only | **NO** |
| **IncidentLog** | `dataAffected` | Security | Description of impacted records | Legal Obligation (Art. 35) | 10 years (Statutory record) | Admin only | **NO** |
| **Verification** | `nationalId` | DPD (Legacy) | Government ID number (Legacy) | Manual admin verification | Deprecated / Pending Migration | Admin only | **NO** (Strictly excluded) |

---

## 3. Data Protection Authority (DPA) Disclosure Placeholders

- **Data Controller:** Tinat Research Technologies, Addis Ababa, Ethiopia.
- **Data Protection Officer (DPO):** `<!-- TODO: HUMAN TASK: Nominate and appoint registered DPO per Proclamation 1321/2024 -->`
- **Supervisory Authority:** Ethiopian Data Protection Authority / National Regulatory Commission (`<!-- TODO: HUMAN TASK: Register platform data controller processing activities -->`)
- **Cross-Border Transfer Policy:** All clinical, health research, and personal demographic records are stored within jurisdiction unless an adequacy decision or standard contractual clauses apply (`<!-- TODO: HUMAN TASK: Finalize hosting infrastructure location -->`).
