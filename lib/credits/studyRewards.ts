import { FEATURES } from "@/lib/config/features";

/**
 * Platform Standard Participant Reward Calculation:
 *
 * In Tinat Research Platform, participant Tinat Credit (TC) rewards are
 * automatically calculated by the platform to ensure fair, transparent,
 * and standardized compensation across all studies.
 *
 * Researchers do not manually specify credit amounts. The platform determines
 * the reward based on:
 * 1. Time required to complete the study (`estimatedMinutes`)
 * 2. Number of questions in the study (`questionCount`)
 *
 * Deterministic formula:
 * - Base reward: 1 TC
 * - Duration factor: ~0.5 TC per minute (1 TC per 2 minutes)
 * - Depth factor: ~0.25 TC per question (1 TC per 4 questions)
 * - Minimum: 1 TC for any funded response
 * - Maximum: FEATURES.MAX_CREDITS_PER_RESPONSE (default 100 TC)
 */
export function calculateStudyRewardCredits(
  estimatedMinutes: number | null | undefined,
  questionCount: number | null | undefined
): number {
  const minutes = Math.max(1, Number(estimatedMinutes) || 5);
  const count = Math.max(1, Number(questionCount) || 1);

  const timeCredits = Math.round(minutes * 0.5);
  const questionCredits = Math.round(count * 0.25);
  const total = Math.max(1, 1 + timeCredits + questionCredits);

  const maxCredits = FEATURES.MAX_CREDITS_PER_RESPONSE || 100;
  return Math.min(total, maxCredits);
}
