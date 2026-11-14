export const RESERVED_USERNAMES = new Set([
  "api",
  "admin",
  "dashboard",
  "login",
  "register",
  "logout",
  "participant",
  "researcher",
  "collector",
  "ask",
  "settings",
  "studies",
  "wallet",
  "profile",
  "projects",
  "support",
  "help",
  "terms",
  "privacy",
  "charter",
  "code-of-conduct",
  "transparency",
  "dpa",
  "forms",
  "ai",
  "tinat",
]);

export function validateUsername(raw: string): { ok: true; username: string } | { ok: false; error: string } {
  if (!raw || typeof raw !== "string") {
    return { ok: false, error: "Username is required." };
  }

  const clean = raw.trim().toLowerCase().replace(/^@/, "");

  if (!/^[a-z0-9_-]{3,30}$/.test(clean)) {
    return {
      ok: false,
      error: "Username must be 3-30 characters long and contain only lowercase letters, numbers, hyphens, or underscores.",
    };
  }

  if (RESERVED_USERNAMES.has(clean)) {
    return {
      ok: false,
      error: `The username "${clean}" is reserved. Please pick another one.`,
    };
  }

  return { ok: true, username: clean };
}
