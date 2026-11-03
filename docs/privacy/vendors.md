# Third-Party Sub-Processors & Vendor Register
**Platform:** Tinat Health Research Ecosystem  
**Governance Standard:** Ethiopian Personal Data Protection Proclamation 1321/2024  
**Last Updated:** November 2026  
**Status:** Active Compliance Register  

---

## 1. Overview & Vendor Management Principles

Under Proclamation 1321/2024 Articles 19 and 20, Tinat maintains a public inventory of all third-party sub-processors, external APIs, and technical service providers. No participant data or clinical research records may be transmitted to any third party without a documented legal basis, valid data processing agreement (DPA), and explicit technical boundary controls.

---

## 2. Third-Party Service Providers Register

| Vendor / Service | Category | Data Transmitted | Security Controls | Country / Hosting Region | Transfer Mechanism | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Email Service (SMTP / SendGrid / Resend)** | Transactional Email | Recipient email address, recipient name, verification token links, system alert text. | TLS 1.3 in transit, API key restricted to transactional templates, zero answer payload. | `<!-- TODO: HUMAN TASK: Confirm hosting country (e.g. EU / US / Local) -->` | Standard Contractual Clauses (SCCs) / In-jurisdiction SMTP | ACTIVE (Operational) |
| **Fayda National ID Program (NIDP / eSignet)** | Identity Verification | Salted SHA-256 hash of Fayda FAN / FIN, verification timestamp, verification status. *No raw biometric data or photos stored.* | TLS 1.3, asymmetric PKI signature verification, hashed identifiers only. | Ethiopia (Federal Democratic Republic of Ethiopia) | Sovereign Domestic Infrastructure | ACTIVE (National Identity Flow) |
| **Google Cloud (Gemini API)** | External Artificial Intelligence | Cohort-level statistical summaries and questionnaire prompts *(Disabled by default)*. **NO direct participant names, emails, phones, or raw answers.** | TLS 1.3, API key rotation, isolated tenant boundary. Guarded by `AI_EXTERNAL_ENABLED=false`. | `<!-- TODO: HUMAN TASK: Confirm Google Cloud datacenter location (e.g. Belgium / US) -->` | Explicit Admin Toggle + De-identified Cohorts Only | **DISABLED BY DEFAULT** (`AI_EXTERNAL_ENABLED=false`) |
| **OpenRouter / AI Inference Providers** | External Artificial Intelligence | Cohort aggregate analysis prompts *(Disabled by default)*. **Zero participant identifiers.** | TLS 1.3, ephemeral processing, zero training retention agreements. | `<!-- TODO: HUMAN TASK: Confirm OpenRouter inference cluster locations -->` | Explicit Admin Toggle + De-identified Cohorts Only | **DISABLED BY DEFAULT** (`AI_EXTERNAL_ENABLED=false`) |
| **Object Storage (Local / AWS S3 / Cloudflare R2)** | File & Asset Storage | Study banner graphics, user profile avatars, research protocol attachments. | Encrypted at rest (AES-256), presigned expiring URLs, private bucket ACLs. | `<!-- TODO: HUMAN TASK: Finalize bucket region (In-country hosting required for clinical trials) -->` | Encrypted Storage Container | ACTIVE |
| **Database Host (PostgreSQL)** | Primary Data Store | All encrypted application tables, double-entry ledger, de-identified research answers. | PostgreSQL over TLS (SSL mode require), append-only trigger guards, restrictive database roles (`tinat_app_role`). | `<!-- TODO: HUMAN TASK: Verify dedicated local/cloud server location -->` | Primary Server Infrastructure | ACTIVE |
| **Legacy Payment Gateways (Chapa, Telebirr, CBE)** | Financial Gateways *(Quarantined)* | None during standard operation. Legacy transaction reference records only. | Quarantined behind `CASH_PAYMENTS_ENABLED=false` and `WITHDRAWALS_ENABLED=false`. | Ethiopia | Quarantined Feature Flags | **DISABLED** |

---

## 3. External AI Boundary Enforcement Policy

To guarantee strict compliance with Ethiopian health data sovereignty and ethical review standards:
1. **Zero-Trust AI Boundary:** The server-side feature flag `AI_EXTERNAL_ENABLED` defaults strictly to `false` in `lib/config/features.ts`.
2. **Server-Side Rejection:** All AI route handlers (`/api/ai/chat`, `/api/ai/analyze`, `executeAIChat`, `executeAIAnalysis`) reject incoming requests with HTTP `403 Forbidden` (`AI_EXTERNAL_DISABLED`) when the flag is disabled.
3. **No Direct PII to Models:** Even when enabled by an authorized administrator, prompts sent to AI models undergo programmatic aggregation via `computeStudyStatistics` and `formatStudyContext`—never transmitting raw participant IDs, names, emails, or unmasked records.

---

## 4. Human Tasks & Legal Review Placeholders

- `<!-- TODO: HUMAN TASK: Appoint legal counsel to review international data transfer adequacy under Proclamation 1321/2024 Art. 36 -->`
- `<!-- TODO: HUMAN TASK: Execute formal Data Processing Addenda (DPAs) with transactional email provider and cloud hosting provider -->`
- `<!-- TODO: HUMAN TASK: National ID Program (NIDP) Relying-Party Agreement execution and production credential sign-off -->`
