/**
 * Legacy payment types for Chapa, Telebirr, and Commercial Bank of Ethiopia (CBE) integrations.
 * Deprecated per ADR 0001. Kept only for historical auditing behind disabled feature flags.
 */

export interface LegacyChapaInitParams {
  amount: number;
  currency: string;
  email: string;
  firstName?: string;
  lastName?: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
  title?: string;
  description?: string;
}

export interface LegacyChapaInitResult {
  status: string;
  message: string;
  checkoutUrl?: string;
  reference?: string;
}

export interface LegacyChapaVerifyResult {
  status: string;
  message: string;
  data?: {
    status?: string;
    amount?: string | number;
    reference?: string;
  };
}

export interface LegacyDisbursementParams {
  withdrawalId: string;
  amount: number;
  method: "TELEBIRR" | "CBE" | "BANK_TRANSFER" | string;
  accountInfo: string;
  recipientName: string;
}

export interface LegacyDisbursementResult {
  success: boolean;
  reference?: string;
  rawResponse?: unknown;
  error?: string;
}
