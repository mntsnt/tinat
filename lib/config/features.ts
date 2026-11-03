/**
 * Centralized feature flags and platform limits for Tinat Research Platform.
 * Follows binding product decisions and ADR 0001:
 * 1. Zero real-money withdrawals (WITHDRAWALS_ENABLED=false by default).
 * 2. Zero-cost study creation without cash payment gateways (CASH_PAYMENTS_ENABLED=false by default).
 * 3. Tinat Credits have strictly no cash value.
 */

export const FEATURES = {
  WITHDRAWALS_ENABLED: process.env.WITHDRAWALS_ENABLED === "true",
  CASH_PAYMENTS_ENABLED: process.env.CASH_PAYMENTS_ENABLED === "true",
  AI_EXTERNAL_ENABLED: process.env.AI_EXTERNAL_ENABLED === "true",
  MAX_CREDITS_PER_RESPONSE: Number(process.env.MAX_CREDITS_PER_RESPONSE || 100),
  MAX_CREDIT_BUDGET_PER_STUDY: Number(process.env.MAX_CREDIT_BUDGET_PER_STUDY || 10000),
} as const;

export const CREDITS_DISCLAIMER =
  "Tinat Credits have no cash value and cannot be exchanged for money.";

export const VOLUNTARY_RESEARCH_NOTICE =
  "No credits. This research is voluntary.";

/**
 * Validates startup safety invariants for payment-regulation risk.
 * If either real-money flag is enabled in production, a loud warning is logged
 * and a verified LEGAL_APPROVAL_REF environment variable is strictly required.
 */
export function validateStartupFeatureFlags(env = process.env): void {
  const isProduction = env.NODE_ENV === "production";
  const withdrawalsEnabled = env.WITHDRAWALS_ENABLED === "true";
  const cashPaymentsEnabled = env.CASH_PAYMENTS_ENABLED === "true";

  if (isProduction && (withdrawalsEnabled || cashPaymentsEnabled)) {
    const legalApprovalRef = env.LEGAL_APPROVAL_REF?.trim();

    if (!legalApprovalRef) {
      const banner = `
********************************************************************************
[CRITICAL REGULATORY VIOLATION] STARTUP ABORTED
Real-money movement is enabled in production (WITHDRAWALS_ENABLED=${withdrawalsEnabled}, CASH_PAYMENTS_ENABLED=${cashPaymentsEnabled}),
but LEGAL_APPROVAL_REF is missing or empty.
Per National Bank of Ethiopia directives (ONPS/01/2020) and ADR 0001,
cash movement cannot be enabled without explicit legal and regulatory approval.
********************************************************************************`;
      console.error(banner);
      throw new Error(
        "CRITICAL REGULATORY ERROR: Real-money features enabled in production without mandatory LEGAL_APPROVAL_REF."
      );
    }

    const warning = `
********************************************************************************
[REGULATORY AUDIT NOTICE]
Real-money features are active in production environment.
Legal Approval Reference: ${legalApprovalRef}
WITHDRAWALS_ENABLED=${withdrawalsEnabled} | CASH_PAYMENTS_ENABLED=${cashPaymentsEnabled}
********************************************************************************`;
    console.warn(warning);
  }
}

// Enforce validation during module startup
try {
  validateStartupFeatureFlags();
} catch (e) {
  // In test environments or when explicitly testing, let the caller catch
  if (process.env.NODE_ENV === "production") {
    throw e;
  }
}

/**
 * Centralized formatter for Tinat Credits.
 * Always formats whole integer credits with the unit 'TC'.
 */
export function formatCredits(amount: number | null | undefined): string {
  const safeInt = Math.floor(amount ?? 0);
  return `${safeInt} TC`;
}
