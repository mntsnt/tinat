import { FEATURES } from "@/lib/config/features";
import { LegacyChapaInitParams, LegacyChapaInitResult, LegacyChapaVerifyResult } from "./types";

/**
 * Legacy Chapa payment integration module.
 * @deprecated All cash movement is permanently disabled per ADR 0001.
 * Gated behind FEATURES.CASH_PAYMENTS_ENABLED.
 */
export async function initializeChapaPayment(params: LegacyChapaInitParams): Promise<LegacyChapaInitResult> {
  if (!FEATURES.CASH_PAYMENTS_ENABLED) {
    throw new Error(
      "[PAYMENT_SECURITY] Attempted to invoke legacy Chapa initializePayment while CASH_PAYMENTS_ENABLED is disabled."
    );
  }

  const secretKey = process.env.CHAPA_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CHAPA_SECRET_KEY is not configured.");
  }

  const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(params.amount),
      currency: params.currency || "ETB",
      email: params.email,
      first_name: params.firstName || "Researcher",
      last_name: params.lastName || "User",
      tx_ref: params.txRef,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      customization: {
        title: params.title || "Tinat Research Study Funding",
        description: params.description || "Research Study Funding",
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== "success") {
    return {
      status: "failed",
      message: data.message || "Chapa initialization failed",
    };
  }

  return {
    status: "success",
    message: data.message || "Payment initialized",
    checkoutUrl: data.data?.checkout_url,
    reference: data.data?.reference || params.txRef,
  };
}

/**
 * Legacy Chapa transaction verification.
 * @deprecated Gated behind FEATURES.CASH_PAYMENTS_ENABLED.
 */
export async function verifyChapaTransaction(txRef: string): Promise<LegacyChapaVerifyResult> {
  if (!FEATURES.CASH_PAYMENTS_ENABLED) {
    throw new Error(
      "[PAYMENT_SECURITY] Attempted to invoke legacy Chapa verifyTransaction while CASH_PAYMENTS_ENABLED is disabled."
    );
  }

  const secretKey = process.env.CHAPA_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CHAPA_SECRET_KEY is not configured.");
  }

  const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      status: "failed",
      message: data.message || "Chapa verification failed",
    };
  }

  return data;
}
