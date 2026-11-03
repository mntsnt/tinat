# Researcher Data Processing Agreement (DPA)
**Document Ref:** DPA-RESEARCHER-v1  
**Parties:** Tinat Research Technologies ("Platform / Data Processor") and Research Institution / Principal Investigator ("Researcher / Data Controller")  
**Governing Law:** Ethiopian Personal Data Protection Proclamation 1321/2024 (Art. 19)  
**Status:** DRAFT TEMPLATE  

---

<!-- TODO: HUMAN TASK: Legal counsel review and institutional sign-off prior to granting study publication permissions -->

## 1. Scope & Purpose of Data Processing
This Agreement governs the collection, processing, and export of participant research answers by the Researcher using the Tinat platform for the scientific study titled `[Insert Study Title]`.

---

## 2. Obligations of the Researcher
The Researcher represents, warrants, and covenants that:
1. **Institutional Review & Ethics Approval:** The study protocol has obtained verified ethical clearance from an accredited Institutional Review Board (IRB) or Independent Ethics Committee (IEC).
2. **Confidentiality & Non-Reidentification:**
   - The Researcher acknowledges that data received is **coded and confidential, not anonymous**.
   - The Researcher covenants **NEVER to attempt re-identification** of any participant by linking the provided `respondentCode` with external datasets, public registers, or demographic cross-referencing.
   - The Researcher shall not solicit or collect direct personal identifiers (such as national IDs, exact physical home addresses, or phone numbers) within free-text questionnaire prompts.
3. **Purpose Limitation:** Data exported from the platform shall be used strictly for the approved research objectives described in the registered protocol and for no commercial marketing or unauthorized third-party sharing.
4. **Security of Exported Data:** The Researcher shall maintain physical, organizational, and cryptographic controls (minimum AES-256 encryption at rest) on all downloaded CSV/Excel datasets.
5. **Breach Notification:** The Researcher shall notify Tinat within **24 hours** of discovering any loss, unauthorized disclosure, or suspected compromise of exported research data.

---

## 3. Obligations of Tinat (Platform)
1. **Data Minimization & De-Identification:** Tinat shall apply its automated de-identification engine to all exports:
   - Suppressing categories with counts below 5 ($k=5$).
   - Banding numerical ages into demographic brackets.
   - Generalizing geographic references.
   - Flagging free-text fields with `[FREE_TEXT_NEEDS_REVIEW]`.
2. **Access Isolation:** Tinat shall maintain the `ParticipantLink` table in complete cryptographic separation from researcher endpoints.
3. **Data Subject Rights Support:** Tinat shall notify the Researcher if a participant exercises their statutory right to erasure or consent withdrawal requiring dataset updates.

---

## 4. Execution & Institutional Signatures

- **For Tinat Research Technologies:**  
  `Name: ______________________`  
  `Title: Head of Research Governance`  
  `Date: ______________________`  

- **For the Research Institution / Principal Investigator:**  
  `<!-- TODO: HUMAN TASK: Counterparty name, institution, and institutional ethics clearance number -->`  
  `Principal Investigator Name: ______________________`  
  `Institution / University: ______________________`  
  `Ethics Approval Ref (IRB/IEC): ______________________`  
  `Date: ______________________`  
