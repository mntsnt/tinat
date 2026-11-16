import { parseEtbCents } from "@/lib/payments/collectorCompensation";
import type { VerifyEtResult } from "@/lib/payments/verifyEt";

export function evaluateCollectorFundingResult(
  result: VerifyEtResult | undefined,
  expectedAmountCents: number
): {
  status: "VERIFIED" | "FAILED";
  verifiedAmountCents: number | null;
  currency: string;
  settlementMatched: boolean;
  failureReason: string | null;
} {
  const verifiedAmountCents = parseEtbCents(result?.amount);
  const currency = typeof result?.currency === "string" ? result.currency : "";
  const settlementMatched = result?.settlementAccountMatch?.matched === true;

  if (result?.processingStatus === "failed") {
    return {
      status: "FAILED",
      verifiedAmountCents,
      currency,
      settlementMatched,
      failureReason: "Verify.et could not verify the transaction.",
    };
  }

  const isVerified =
    result?.verified === true &&
    result.status === "success" &&
    currency === "ETB" &&
    verifiedAmountCents === expectedAmountCents &&
    settlementMatched;
  const failureReason = isVerified
    ? null
    : currency && currency !== "ETB"
      ? "The verified transaction currency was not ETB."
      : !currency
        ? "Verify.et did not confirm the transaction currency."
      : verifiedAmountCents !== expectedAmountCents
        ? "The verified payment amount did not match the required collector budget."
        : !settlementMatched
          ? "The payment was not confirmed as received by Tinat's settlement account."
          : "The transaction was not verified as successful.";

  return {
    status: isVerified ? "VERIFIED" : "FAILED",
    verifiedAmountCents,
    currency,
    settlementMatched,
    failureReason,
  };
}
