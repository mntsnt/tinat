import crypto from "node:crypto";

export interface VerifyEtResult {
  processingStatus?: string;
  status?: string;
  verified?: boolean;
  amount?: string | number;
  currency?: string;
  settlementAccountMatch?: {
    matched?: boolean;
  };
}

export interface VerifyEtSubmitResponse {
  success?: boolean;
  message?: string;
  requestId?: string;
  verification?: VerifyEtResult;
  data?: VerifyEtResult[];
}

export function isValidVerifyEtSignature(params: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
  now?: number;
}): boolean {
  const { rawBody, timestamp, signature, secret, now = Date.now() } = params;
  const sentAt = Date.parse(timestamp);
  if (!secret || !Number.isFinite(sentAt) || Math.abs(now - sentAt) > 5 * 60 * 1000) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest();

  return signature.split(",").some((part) => {
    const provided = part.trim().replace(/^sha256=/, "");
    if (!/^[\da-f]{64}$/i.test(provided)) return false;

    const actual = Buffer.from(provided, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  });
}

export async function submitVerifyEtCheck(params: {
  bank: string;
  reference: string;
  accountSuffix?: string;
  phone?: string;
  idempotencyKey: string;
}): Promise<VerifyEtSubmitResponse> {
  const apiKey = process.env.VERIFY_ET_API_KEY;
  if (!apiKey) {
    throw new Error("VERIFY_ET_API_KEY is not configured.");
  }

  const waitMs = params.bank === "telebirr" ? 8000 : 5000;
  const response = await fetch(`https://verify.et/api/verify?waitMs=${waitMs}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify({
      bank: params.bank,
      reference: params.reference,
      ...(params.accountSuffix ? { accountSuffix: params.accountSuffix } : {}),
      ...(params.phone ? { phone: params.phone } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });

  const body = (await response.json()) as VerifyEtSubmitResponse;
  if (!response.ok && response.status !== 202) {
    throw new Error(body.message || `Verify.et returned HTTP ${response.status}.`);
  }

  return body;
}
