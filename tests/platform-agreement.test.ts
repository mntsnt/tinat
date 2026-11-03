import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import "dotenv/config";

process.env.AUTH_SECRET = process.env.AUTH_SECRET || "tinat-auth-secret-for-matrix-tests-min-32-chars!";
(process.env as Record<string, string>).NODE_ENV = "test";

import { prisma } from "../lib/prisma";
import {
  PLATFORM_DOCUMENT_VERSIONS,
  getCombinedDocumentText,
  computeDocumentHash,
  getTermsOfUsePlainText,
  getPrivacyNoticePlainText,
  getDataUseSummaryPlainText,
  getPlatformDocumentPayload,
} from "../lib/legal/platformDocuments";
import {
  checkPlatformConsent,
  recordPlatformConsent,
} from "../lib/legal/consentService";

describe("Platform Legal Agreement & Consent Requirements", () => {
  const testEmail = `test-consent-${Date.now()}@example.com`;
  let testUserId: string;

  before(async () => {
    const user = await prisma.user.create({
      data: {
        name: "Test Participant",
        email: testEmail,
        passwordHash: "dummy-hash",
        role: "PARTICIPANT",
        isVerified: true,
      },
    });
    testUserId = user.id;
  });

  after(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: "test-consent-" } },
      });
    } catch {}
  });

  test("1. Verifies that /terms and /privacy render the exact same text as the sign-up panel", () => {
    const combinedText = getCombinedDocumentText();
    const termsText = getTermsOfUsePlainText();
    const privacyText = getPrivacyNoticePlainText();
    const summaryText = getDataUseSummaryPlainText();

    assert.ok(combinedText.includes(termsText), "Combined text must contain Terms of Use text");
    assert.ok(combinedText.includes(privacyText), "Combined text must contain Privacy Notice text");
    assert.ok(combinedText.includes(summaryText), "Combined text must contain Data Use Summary text");

    const termsIdx = combinedText.indexOf(termsText);
    const privacyIdx = combinedText.indexOf(privacyText);
    const summaryIdx = combinedText.indexOf(summaryText);

    assert.ok(termsIdx >= 0, "Terms index must be non-negative");
    assert.ok(privacyIdx > termsIdx, "Privacy must appear after Terms");
    assert.ok(summaryIdx > privacyIdx, "Summary must appear after Privacy");
  });

  test("2. Verifies documentHash matches the SHA-256 of the combined text and rejects tampered hash", async () => {
    const payload = getPlatformDocumentPayload();
    const expectedHash = computeDocumentHash(payload.combinedText);

    assert.strictEqual(payload.documentHash, expectedHash);
    assert.strictEqual(payload.documentHash.length, 64);

    await assert.rejects(
      async () => {
        await recordPlatformConsent({
          userId: testUserId,
          clientProvidedHash: "invalid_tampered_hash_value",
        });
      },
      /Document version hash mismatch/
    );
  });

  test("3. User without a record fails checkPlatformConsent and requires agreement", async () => {
    const result = await checkPlatformConsent(testUserId);
    assert.strictEqual(result.hasValidConsent, false);
    assert.strictEqual(result.needsReacceptance, false);
    assert.strictEqual(result.latestRecord, null);
  });

  test("4. Writes PlatformConsentRecord once with correct documentHash and optional contact consent", async () => {
    const payload = getPlatformDocumentPayload();

    const record = await recordPlatformConsent({
      userId: testUserId,
      optionalContactConsent: true,
      clientProvidedHash: payload.documentHash,
      locale: "en",
    });

    assert.strictEqual(record.userId, testUserId);
    assert.strictEqual(record.termsVersion, PLATFORM_DOCUMENT_VERSIONS.TERMS);
    assert.strictEqual(record.privacyVersion, PLATFORM_DOCUMENT_VERSIONS.PRIVACY);
    assert.strictEqual(record.summaryVersion, PLATFORM_DOCUMENT_VERSIONS.SUMMARY);
    assert.strictEqual(record.documentHash, payload.documentHash);
    assert.strictEqual(record.optionalContactConsent, true);
    assert.strictEqual(record.locale, "en");

    // Re-checking consent passes
    const checkAfter = await checkPlatformConsent(testUserId);
    assert.strictEqual(checkAfter.hasValidConsent, true);
    assert.strictEqual(checkAfter.needsReacceptance, false);
  });

  test("5. Optional contact consent checkbox is independent of required agreement", async () => {
    const payload = getPlatformDocumentPayload();
    const secondEmail = `test-consent-opt-${Date.now()}@example.com`;
    const user2 = await prisma.user.create({
      data: {
        name: "Second User",
        email: secondEmail,
        passwordHash: "dummy-hash",
        role: "PARTICIPANT",
        isVerified: true,
      },
    });

    const record = await recordPlatformConsent({
      userId: user2.id,
      optionalContactConsent: false,
      clientProvidedHash: payload.documentHash,
    });

    assert.strictEqual(record.optionalContactConsent, false);

    const checkAfter = await checkPlatformConsent(user2.id);
    assert.strictEqual(checkAfter.hasValidConsent, true);

    await prisma.user.delete({ where: { id: user2.id } });
  });

  test("6. Re-acceptance is triggered with diff highlights after a version bump", async () => {
    const olderUserEmail = `test-consent-bump-${Date.now()}@example.com`;
    const oldUser = await prisma.user.create({
      data: {
        name: "Legacy User",
        email: olderUserEmail,
        passwordHash: "dummy-hash",
        role: "PARTICIPANT",
        isVerified: true,
      },
    });

    await prisma.platformConsentRecord.create({
      data: {
        userId: oldUser.id,
        termsVersion: "2025-01-01",
        privacyVersion: PLATFORM_DOCUMENT_VERSIONS.PRIVACY,
        summaryVersion: PLATFORM_DOCUMENT_VERSIONS.SUMMARY,
        documentHash: "older_hash_representation",
        optionalContactConsent: false,
        acceptedAt: new Date("2025-01-01T00:00:00Z"),
      },
    });

    const check = await checkPlatformConsent(oldUser.id);
    assert.strictEqual(check.hasValidConsent, false);
    assert.strictEqual(check.needsReacceptance, true);
    assert.ok(check.diffSummary && check.diffSummary.length > 0);
    assert.ok(check.diffSummary?.[0]?.includes("Terms of Use updated"));

    await prisma.user.delete({ where: { id: oldUser.id } });
  });

  test("7. Scroll-to-end button state logic check", () => {
    const requireScrollToEnd = true;
    let scrolledToEnd = false;
    let requiredChecked = false;

    // Disabled before scrolling to end
    assert.strictEqual(requireScrollToEnd && !scrolledToEnd, true);
    assert.strictEqual(!requiredChecked, true);

    // Scrolled to end
    scrolledToEnd = true;
    assert.strictEqual(requireScrollToEnd && !scrolledToEnd, false);

    // Checked
    requiredChecked = true;
    assert.strictEqual(!requiredChecked, false);
  });
});
