# Standard Operating Procedure: Personal Data Breach Notification

**Document Reference:** RB-SEC-002  
**Applies to:** Tinat Health Research Ecosystem  
**Statutory Framework:** Article 26 & 27, Ethiopian Personal Data Protection Proclamation No. 1321/2024  
**Deadline:** Within 72 hours of becoming aware of a confirmed personal data breach

---

## 1. Statutory Mandate & Triggers

Under Ethiopian Proclamation 1321/2024, Tinat (acting as Data Processor or Data Controller) is legally obligated to report any verified security incident resulting in the accidental, unlawful destruction, loss, alteration, unauthorized disclosure of, or access to personal health or identity data.

### Mandatory Notification Triggers
- Exposure of the `ParticipantLink` database table mapping respondent codes to personal user accounts.
- Compromise of salt keys or National ID (Fayda) subject identifier records.
- Unauthorized export of raw un-deidentified health questionnaire datasets.

---

## 2. Notification Workflow (72-Hour Timeline)

```
Hour 0: Incident Confirmed
  │
  ├─► Hour 0-24: Forensic Assessment
  │     Determine scope: number of data subjects, categories of data (sensitive vs general).
  │
  ├─► Hour 24-48: Draft Regulatory Notice
  │     Complete Form DPA-BN-01 for the Ethiopian Personal Data Protection Authority.
  │
  ├─► Hour 48-72: Official Notification
  │     Deliver formal notice to Authority and affected research institutions (Data Controllers).
  │
  └─► Ongoing: Data Subject Communication (if high risk to rights and freedoms).
```

---

## 3. Regulatory Notice Template

The written notification to the Ethiopian Personal Data Protection Authority must include:
1. **Nature of the Personal Data Breach:** Technical circumstances and affected database tables.
2. **Categories & Approximate Number of Data Subjects:** Total participants impacted.
3. **Data Protection Officer / Technical Lead Contact:** Dedicated liaison name, email, phone.
4. **Likely Consequences:** Risks to participant privacy, social stigmatization risks.
5. **Mitigation Measures Taken:** Immediate key rotation, token revocation, patch deployment, participant link isolation.

---

## 4. Participant Communication Standard

When participant notification is required under Proclamation 1321/2024:
- Communications must be delivered in clear, plain language (Amharic, Afaan Oromoo, English).
- Detail exact steps participants can take to protect themselves (e.g. password resets, security inquiries).
- Provide a dedicated support channel: `contact.tinatapp@gmail.com`.
