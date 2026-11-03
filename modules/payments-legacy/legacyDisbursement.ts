import { FEATURES } from "@/lib/config/features";
import { LegacyDisbursementParams, LegacyDisbursementResult } from "./types";

/**
 * Legacy payout / disbursement handling for Telebirr and CBE (Commercial Bank of Ethiopia).
 * @deprecated All withdrawals and payouts are permanently disabled per ADR 0001.
 * Gated behind FEATURES.WITHDRAWALS_ENABLED.
 */
export async function disburseToTelebirrOrCbe(params: LegacyDisbursementParams): Promise<LegacyDisbursementResult> {
  if (!FEATURES.WITHDRAWALS_ENABLED) {
    throw new Error(
      "[PAYMENT_SECURITY] Attempted to invoke legacy Telebirr/CBE disbursement while WITHDRAWALS_ENABLED is disabled."
    );
  }

  const secretKey = process.env.CHAPA_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CHAPA_SECRET_KEY is not configured.");
  }

  // Bank code mapping: 855 is Telebirr, 801 is CBE / Commercial Bank of Ethiopia
  const isTelebirr = params.method.toUpperCase() === "TELEBIRR";
  const bankCode = isTelebirr ? "855" : "801";
  const transferReference = `pay-${params.withdrawalId.slice(-10)}-${Date.now()}`;

  const response = await fetch("https://api.chapa.co/v1/transfers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_name: params.recipientName || "Tinat Participant",
      account_number: params.accountInfo,
      amount: params.amount,
      currency: "ETB",
      reference: transferReference,
      bank_code: bankCode,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== "success") {
    let errorDetail = "Disbursement gateway rejected the payout.";
    if (typeof data.message === "string") {
      errorDetail = data.message;
    } else if (typeof data.message === "object" && data.message !== null) {
      errorDetail = Object.values(data.message).flat().join(", ");
    } else if (data.error) {
      errorDetail = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
    }

    return {
      success: false,
      error: errorDetail,
      rawResponse: data,
    };
  }

  return {
    success: true,
    reference: transferReference,
    rawResponse: data,
  };
}
