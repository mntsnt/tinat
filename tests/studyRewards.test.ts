import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateStudyRewardCredits } from "../lib/credits/studyRewards";

describe("calculateStudyRewardCredits", () => {
  test("calculates standard 5-minute study with 5 questions", () => {
    // 1 base + round(5 * 0.5 = 2.5 -> 3) + round(5 * 0.25 = 1.25 -> 1) = 5 TC
    const credits = calculateStudyRewardCredits(5, 5);
    assert.equal(credits, 5);
  });

  test("calculates shorter 2-minute study with 2 questions", () => {
    // 1 base + round(2 * 0.5 = 1) + round(2 * 0.25 = 0.5 -> 1) = 3 TC
    const credits = calculateStudyRewardCredits(2, 2);
    assert.equal(credits, 3);
  });

  test("calculates 10-minute study with 10 questions", () => {
    // 1 base + round(10 * 0.5 = 5) + round(10 * 0.25 = 2.5 -> 3) = 9 TC
    const credits = calculateStudyRewardCredits(10, 10);
    assert.equal(credits, 9);
  });

  test("calculates 15-minute study with 20 questions", () => {
    // 1 base + round(15 * 0.5 = 7.5 -> 8) + round(20 * 0.25 = 5) = 14 TC
    const credits = calculateStudyRewardCredits(15, 20);
    assert.equal(credits, 14);
  });

  test("handles zero or null values gracefully", () => {
    const creditsNull = calculateStudyRewardCredits(null, null);
    assert.ok(creditsNull >= 1);

    const creditsZero = calculateStudyRewardCredits(0, 0);
    assert.ok(creditsZero >= 1);
  });

  test("respects upper boundary of 100 TC", () => {
    const creditsHuge = calculateStudyRewardCredits(500, 500);
    assert.equal(creditsHuge, 100);
  });
});
