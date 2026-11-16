import { CollectorPayType } from "@/generated/prisma/client";

const MAX_ETB_MINOR_UNITS = 2_147_483_647;

export function parseEtbCents(value: unknown): number | null {
  const text =
    typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : typeof value === "string"
        ? value.trim()
        : "";
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return null;

  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= MAX_ETB_MINOR_UNITS ? cents : null;
}

export function calculateCollectorBudgetCents(params: {
  collectorPayType: CollectorPayType | null;
  collectorPayRateCents: number;
  collectorsNeeded: number;
  participantTarget: number;
}): number {
  const { collectorPayType, collectorPayRateCents, collectorsNeeded, participantTarget } = params;
  if (!collectorPayType || collectorPayRateCents <= 0 || collectorsNeeded <= 0) return 0;

  const units =
    collectorPayType === "FIXED" ? collectorsNeeded : participantTarget;
  const budget = units * collectorPayRateCents;
  if (!Number.isSafeInteger(budget) || budget > MAX_ETB_MINOR_UNITS) {
    throw new RangeError("Collector budget exceeds the supported ETB amount.");
  }
  return budget;
}

export function formatEtbCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
