import { SignJWT, jwtVerify } from "jose";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "tinat-fallback-secret-for-dev-verification";
  return new TextEncoder().encode(secret);
}

interface VerificationPayload {
  userId: string;
  email: string;
  code: string;
  type: "email_verification";
}

// In-memory store for active verification requests: email -> { code, token, expiresAt }
// Also survives client interaction within the running server instance
const activeCodes = new Map<string, { code: string; token: string; expiresAt: number }>();

export function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generateVerificationToken(payload: { userId: string; email: string; code: string }): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email.toLowerCase().trim(),
    code: payload.code,
    type: "email_verification",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());

  // Store in memory cache (expires in 24 hours)
  activeCodes.set(payload.email.toLowerCase().trim(), {
    code: payload.code,
    token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  return token;
}

export async function verifyVerificationToken(token: string): Promise<VerificationPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.type !== "email_verification") {
      return null;
    }
    return {
      userId: payload.userId as string,
      email: (payload.email as string).toLowerCase().trim(),
      code: payload.code as string,
      type: "email_verification",
    };
  } catch (error) {
    console.error("[Email Verification] Token verification error:", error);
    return null;
  }
}

export function validateVerificationCode(email: string, code: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const entry = activeCodes.get(normalizedEmail);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    activeCodes.delete(normalizedEmail);
    return false;
  }
  return entry.code === code.trim();
}

export function clearVerificationEntry(email: string) {
  activeCodes.delete(email.toLowerCase().trim());
}

export function getActiveCodeForDebug(email: string): string | null {
  const entry = activeCodes.get(email.toLowerCase().trim());
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.code;
}
