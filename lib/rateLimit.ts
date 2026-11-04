import { NextResponse } from "next/server";
import { jsonError } from "./validation";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export type RateLimitPreset =
  | "LOGIN"
  | "REGISTER"
  | "EMAIL_VERIFICATION"
  | "PASSWORD_RESET"
  | "SUBMISSION"
  | "CHAT";

const PRESET_CONFIGS: Record<RateLimitPreset, { max: number; windowMs: number }> = {
  LOGIN: { max: 25, windowMs: 15 * 60 * 1000 }, // 25 attempts / 15m
  REGISTER: { max: 30, windowMs: 60 * 60 * 1000 }, // 30 attempts / 1h
  EMAIL_VERIFICATION: { max: 30, windowMs: 15 * 60 * 1000 }, // 30 / 15m
  PASSWORD_RESET: { max: 15, windowMs: 15 * 60 * 1000 }, // 15 / 15m
  SUBMISSION: { max: 60, windowMs: 60 * 1000 }, // 60 / 1m
  CHAT: { max: 60, windowMs: 60 * 1000 }, // 60 / 1m
};

const store = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes
const GC_INTERVAL = 5 * 60 * 1000;
let lastGc = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastGc < GC_INTERVAL) return;
  lastGc = now;
  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function getClientIp(req: Request): string {
  const headers = req.headers;
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const parts = xForwardedFor.split(",");
    const clientIp = parts[0]?.trim();
    if (clientIp) return clientIp;
  }
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp?.trim()) return xRealIp.trim();
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();
  return "127.0.0.1";
}

/**
 * Checks and increments rate limit for a request.
 * Returns { allowed: true } or { allowed: false, response: NextResponse }
 */
export function checkRateLimit(
  req: Request,
  preset: RateLimitPreset,
  customIdentifier?: string
): { allowed: true } | { allowed: false; response: NextResponse } {
  if (process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true") {
    return { allowed: true };
  }

  cleanup();

  const config = PRESET_CONFIGS[preset];
  const ip = getClientIp(req);
  const key = `${preset}:${customIdentifier || ip}`;
  const now = Date.now();

  let record = store.get(key);

  if (!record || record.resetAt <= now) {
    record = { count: 1, resetAt: now + config.windowMs };
    store.set(key, record);
    return { allowed: true };
  }

  if (record.count >= config.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    const response = jsonError(
      "Too many requests. Please slow down and try again later.",
      429,
      "RATE_LIMITED",
      { retryAfterSeconds }
    );
    response.headers.set("Retry-After", String(retryAfterSeconds));
    return { allowed: false, response };
  }

  record.count += 1;
  return { allowed: true };
}
