import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

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

// In-memory cache for fast lookups: email -> { code, token, expiresAt }
const activeCodes = new Map<string, { code: string; token: string; expiresAt: number }>();

export function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generateVerificationToken(payload: { userId: string; email: string; code: string }): Promise<string> {
  const normalizedEmail = payload.email.toLowerCase().trim();
  const token = await new SignJWT({
    userId: payload.userId,
    email: normalizedEmail,
    code: payload.code,
    type: "email_verification",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // 1. Store in memory cache
  activeCodes.set(normalizedEmail, {
    code: payload.code,
    token,
    expiresAt: expiresAt.getTime(),
  });

  // 2. Persist in database on User record so it survives server restarts and multi-process workers
  try {
    await prisma.user.updateMany({
      where: { email: normalizedEmail },
      data: {
        verificationCode: payload.code,
        verificationCodeExpiresAt: expiresAt,
      },
    });
  } catch (dbErr) {
    console.error("[Email Verification] Failed to persist code in DB:", dbErr);
  }

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

export async function validateVerificationCode(email: string, code: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedCode = code.trim();

  // 1. First check persistent database record
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        verificationCode: trimmedCode,
        verificationCodeExpiresAt: { gt: new Date() },
      },
    });
    if (user) {
      return true;
    }
  } catch (dbErr) {
    console.error("[Email Verification] DB lookup error:", dbErr);
  }

  // 2. Fallback to in-memory store
  const entry = activeCodes.get(normalizedEmail);
  if (entry) {
    if (Date.now() > entry.expiresAt) {
      activeCodes.delete(normalizedEmail);
      return false;
    }
    return entry.code === trimmedCode;
  }

  return false;
}

export async function clearVerificationEntry(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  activeCodes.delete(normalizedEmail);

  try {
    await prisma.user.updateMany({
      where: { email: normalizedEmail },
      data: {
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });
  } catch (dbErr) {
    console.error("[Email Verification] Failed to clear verification code in DB:", dbErr);
  }
}

export async function getActiveCodeForDebug(email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check DB
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        verificationCodeExpiresAt: { gt: new Date() },
      },
      select: { verificationCode: true },
    });
    if (user?.verificationCode) {
      return user.verificationCode;
    }
  } catch {}

  const entry = activeCodes.get(normalizedEmail);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.code;
}
