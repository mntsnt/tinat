# Standard Operating Procedure: Account Compromise Response

**Document Reference:** RB-SEC-004  
**Applies to:** Participant, Researcher, and Administrator Accounts  
**Classification:** Operational Runbook

---

## 1. Detection Indicators

- Credential stuffing or brute force detection via rate limiter alerts on `/api/auth/login`.
- Unexpected IP location changes or abnormal rapid submission behavior.
- Suspicious role change requests or administrative elevation attempts without logged rationale.

---

## 2. Response Sequence by Account Role

### A. Participant Account Compromise
1. **Revoke Active JWT Sessions:**
   Invalidate user session cookies (`tinat-auth-token`).
2. **Review Wallet & Token Transactions:**
   Verify `TinatCreditTransaction` history. In accordance with platform invariants, credits cannot be transferred to other users or cashed out to external accounts (Telebirr/CBE quarantined), mitigating direct financial loss.
3. **Reset Password & Enforce Verification:**
   Generate secure password reset token and notify the user via registered email.

### B. Researcher Account Compromise
1. **Immediate Freeze of Associated Studies:**
   Pause all ACTIVE studies owned by the researcher to prevent unauthorized tampering with survey questions or fraudulent credit disbursements.
2. **Audit Export History:**
   Inspect `ActivityLog` for `EXPORT_RESPONSES` actions executed during the compromise window. Determine whether de-identified datasets were downloaded.
3. **Credential Invalidation & Re-authentication:**
   Require password reset and mandatory re-authentication.

### C. Administrator Account Compromise (Critical P0)
1. **Immediate Revocation of Admin Role:**
   Update database directly: `UPDATE "User" SET role = 'USER' WHERE id = 'compromised_id';`
2. **Review Four-Eyes Approvals:**
   Audit all study activations and credit adjustments signed by the compromised admin ID.
3. **Rotate Master Secrets:**
   Rotate `AUTH_SECRET`, database credentials, and Fayda OIDC assertion signing keys.
