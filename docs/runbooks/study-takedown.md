# Standard Operating Procedure: Study Takedown & Ethics Suspension

**Document Reference:** RB-GOV-003  
**Applies to:** Tinat Platform Administration & Ethics Review Gate  
**Classification:** Operational Runbook

---

## 1. Grounds for Immediate Study Takedown

An active research study must be immediately suspended/taken down under the following conditions:
1. **Ethics Approval Expiry or Revocation:** The study's Institutional Review Board (IRB/NRERC) approval has expired or been revoked by the institutional committee.
2. **Deceptive or Coercive Inquiries:** Inquiries promising cash/monetary rewards in violation of the no-cash platform rule, or attempting to recruit minors without physical guardian infrastructure.
3. **Severe Participant Distress Reports:** Multiple reports through `/api/reports` citing traumatic triggering without adequate safety protocol or helpline support.
4. **Researcher Protocol Tampering:** Post-approval modification of question items without submitting amended ethics clearance.

---

## 2. Immediate Takedown Execution Steps

### Step 1: Admin Interface Action
1. Navigate to `/admin/moderation` or `/admin/studies/[id]`.
2. Set study status to `PAUSED` or check `Take Down Study` in the moderation triage panel.
3. System immediately blocks any new participant submissions (`POST /api/studies/[id]/submit` returns `400 STUDY_NOT_ACTIVE`).

### Step 2: API / Command-Line Emergency Takedown
If the admin UI is inaccessible, run authenticated API PATCH:
```bash
curl -X PATCH "https://tinat.et/api/admin/studies/{studyId}/status" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"status": "PAUSED"}'
```

### Step 3: Mandatory Activity Logging
Record formal reason in `ActivityLog`:
- `action`: `"STUDY_MODERATION_TAKEDOWN"`
- `resourceId`: `{studyId}`
- `description`: Detailed description of the violation, reporter ID, and admin ID.

### Step 4: Notification to Principal Investigator
Send formal notice to the researcher's registered email detailing:
- Exact grounds for suspension.
- Right to submit amended IRB clearance or lodge an appeal before the Ethics Advisory Board within 14 calendar days.
