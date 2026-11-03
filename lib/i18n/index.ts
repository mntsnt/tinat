import enMessages from "@/messages/en.json";
import amMessages from "@/messages/am.json";
import omMessages from "@/messages/om.json";
import tiMessages from "@/messages/ti.json";
import soMessages from "@/messages/so.json";
import translationStatus from "@/messages/status.json";

export type SupportedLocale = "en" | "am" | "om" | "ti" | "so";

export const SUPPORTED_LOCALES: { code: SupportedLocale; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  { code: "om", name: "Afaan Oromo", nativeName: "Afaan Oromo" },
  { code: "ti", name: "Tigrinya", nativeName: "ትግርኛ" },
  { code: "so", name: "Somali", nativeName: "Af-Soomaali" },
];

export const ALL_MESSAGES: Record<SupportedLocale, typeof enMessages> = {
  en: enMessages,
  am: amMessages as unknown as typeof enMessages,
  om: omMessages as unknown as typeof enMessages,
  ti: tiMessages as unknown as typeof enMessages,
  so: soMessages as unknown as typeof enMessages,
};

/**
 * Returns whether a locale is certified for production deployment.
 * Enforces rule: "Do not treat machine translation as final: mark every non-English string
 * NEEDS_HUMAN_REVIEW in a status file and only ship reviewed locales."
 */
export function isLocaleReviewed(locale: SupportedLocale): boolean {
  const meta = translationStatus.locales[locale];
  return meta ? meta.status === "REVIEWED" : false;
}

/**
 * Get effective locale for UI display.
 * If allowUnreviewed is false (e.g., standard production participant mode),
 * unreviewed locales fall back to 'en'.
 */
export function resolveEffectiveLocale(requestedLocale: string | null | undefined, allowUnreviewed = true): SupportedLocale {
  if (!requestedLocale) return "en";
  const normalized = requestedLocale.toLowerCase().slice(0, 2) as SupportedLocale;
  if (!SUPPORTED_LOCALES.some((l) => l.code === normalized)) {
    return "en";
  }
  if (!allowUnreviewed && !isLocaleReviewed(normalized)) {
    return "en";
  }
  return normalized;
}

/**
 * Type-safe path resolver for nested message keys (e.g. 'common.submit', 'study.complete')
 */
export function getMessage(locale: SupportedLocale, keyPath: string, allowUnreviewed = true): string {
  const effLocale = resolveEffectiveLocale(locale, allowUnreviewed);
  const dict = ALL_MESSAGES[effLocale] || enMessages;
  const fallbackDict = enMessages;

  const parts = keyPath.split(".");
  
  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      current = null;
      break;
    }
  }

  if (typeof current === "string") {
    return current;
  }

  // Fallback to English
  let fallback: any = fallbackDict;
  for (const part of parts) {
    if (fallback && typeof fallback === "object" && part in fallback) {
      fallback = fallback[part];
    } else {
      return keyPath;
    }
  }

  return typeof fallback === "string" ? fallback : keyPath;
}
