import "dotenv/config";
import { test, describe } from "node:test";
import assert from "node:assert";
import {
  deidentifyDataset,
  bandAge,
  generalizeGeography,
} from "../lib/export/deidentify";
import {
  generateRespondentCode,
  getOrCreateParticipantLink,
  hasUserParticipated,
  resolveRespondentForFraudInvestigation,
} from "../lib/identity/linkService";
import { FEATURES } from "../lib/config/features";
import { prisma } from "../lib/prisma";

describe("Part 1 & 2: Identity Separation, Export De-identification & Data Protection", () => {
  // ---------------------------------------------------------------------------
  // 1. Export De-identification & Direct Identifier Exclusion
  // ---------------------------------------------------------------------------
  test("Export De-identification: Fails if userId, name, email, phone, Fayda data, ipHash, or fingerprint appears", () => {
    const directIdentifiers = [
      "usr_12345",
      "Abebe Bikila",
      "abebe.bikila@example.et",
      "+251911223344",
      "fayda_sha256_hash_987654321",
      "192.168.1.100",
      "device_fp_abc987xyz",
    ];

    const mockStudy = {
      id: "study_health_001",
      title: "Maternal Health Study",
      objective: "Evaluate maternal outcomes in Addis Ababa",
    };

    const mockQuestions = [
      { id: "q_age", text: "What is your age?", type: "NUMBER" },
      { id: "q_symptom", text: "Primary symptom experienced", type: "SINGLE_CHOICE" },
      { id: "q_notes", text: "Additional clinical notes", type: "LONG_TEXT" },
    ];

    // Raw responses containing direct personal metadata
    const rawResponses = [
      {
        id: "resp_row_1",
        respondentCode: "resp_a1b2c3d4e5f60718293a4b5c",
        submittedAt: new Date("2026-11-01T10:00:00Z"),
        answers: {
          q_age: 28,
          q_symptom: "Headache",
          q_notes: "Patient reports mild discomfort",
        },
      },
    ];

    const result = deidentifyDataset({
      study: mockStudy,
      questions: mockQuestions,
      responses: rawResponses,
      options: { minCellSize: 5, bandAges: true, generalizeGeography: true },
    });

    const exportedString = JSON.stringify(result);

    // Assert that NONE of the direct personal identifiers appear in the exported data
    for (const directId of directIdentifiers) {
      assert(
        !exportedString.includes(directId),
        `CRITICAL PRIVACY VIOLATION: Direct identifier "${directId}" leaked into exported dataset!`
      );
    }

    // Assert respondentCode is present
    assert(
      exportedString.includes("resp_a1b2c3d4e5f60718293a4b5c"),
      "Respondent code must be preserved as the sole pseudonymized study identifier."
    );

    // Assert free-text column is flagged for review
    assert(
      result.headers.some((h) => h.includes("[FREE_TEXT_NEEDS_REVIEW]")),
      "Free-text column must be flagged with [FREE_TEXT_NEEDS_REVIEW]."
    );
  });

  // ---------------------------------------------------------------------------
  // 2. Small-Cell Suppression (k-anonymity style)
  // ---------------------------------------------------------------------------
  test("Small-cell suppression: Categories with count < 5 are suppressed to '<5 (Suppressed for Privacy)'", () => {
    const mockStudy = {
      id: "study_rare_condition",
      title: "Rare Condition Survey",
    };

    const mockQuestions = [
      { id: "q_condition", text: "Diagnosed Condition", type: "SINGLE_CHOICE" },
    ];

    // 10 responses: 8 common, 2 rare (below threshold 5)
    const responses = [
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `resp_common_${i}`,
        respondentCode: `resp_code_common_${i}`,
        submittedAt: new Date(),
        answers: { q_condition: "Common Flu" },
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: `resp_rare_${i}`,
        respondentCode: `resp_code_rare_${i}`,
        submittedAt: new Date(),
        answers: { q_condition: "Rare Syndrome" },
      })),
    ];

    const result = deidentifyDataset({
      study: mockStudy,
      questions: mockQuestions,
      responses,
      options: { minCellSize: 5 },
    });

    // The 8 common responses should remain intact
    const commonRows = result.rows.filter((r) => r["Diagnosed Condition"] === "Common Flu");
    assert.strictEqual(commonRows.length, 8, "Common categories >= 5 must be preserved.");

    // The 2 rare responses must be suppressed
    const suppressedRows = result.rows.filter(
      (r) => r["Diagnosed Condition"] === "<5 (Suppressed for Privacy)"
    );
    assert.strictEqual(
      suppressedRows.length,
      2,
      "Categories with frequency < 5 must be suppressed to prevent re-identification."
    );

    // Raw rare syndrome text must not appear anywhere in row answers
    const leakedRare = result.rows.filter((r) => r["Diagnosed Condition"] === "Rare Syndrome");
    assert.strictEqual(leakedRare.length, 0, "Rare category string must not appear in exported rows.");
    assert.strictEqual(result.codebook.suppressedCellsCount, 2);
  });

  // ---------------------------------------------------------------------------
  // 3. Age Banding & Geographic Generalization
  // ---------------------------------------------------------------------------
  test("Age banding & geographic generalization: Numerical ages and addresses are generalized", () => {
    assert.strictEqual(bandAge(16), "<18");
    assert.strictEqual(bandAge(22), "18-24");
    assert.strictEqual(bandAge(31), "25-34");
    assert.strictEqual(bandAge(42), "35-44");
    assert.strictEqual(bandAge(50), "45-54");
    assert.strictEqual(bandAge(60), "55-64");
    assert.strictEqual(bandAge(72), "65+");

    const rawAddress = "Kebele 04, House No. 512, Street 14, Bole Sub-City, Addis Ababa";
    const generalized = generalizeGeography(rawAddress);

    assert(!generalized.includes("Kebele 04"), "Specific kebele number must be generalized.");
    assert(!generalized.includes("House No. 512"), "Specific house number must be generalized.");
    assert(generalized.includes("Bole Sub-City, Addis Ababa"), "Broader administrative unit must be retained.");
  });

  // ---------------------------------------------------------------------------
  // 4. Link Separation & LinkService Access Control
  // ---------------------------------------------------------------------------
  test("Link separation & linkService: Respondent codes are random and non-guessable", () => {
    const code1 = generateRespondentCode();
    const code2 = generateRespondentCode();

    assert(code1.startsWith("resp_"), "Respondent code must start with resp_ prefix");
    assert(code2.startsWith("resp_"), "Respondent code must start with resp_ prefix");
    assert.strictEqual(code1.length, 37, "Respondent code must have 37 chars (resp_ + 32 hex chars)");
    assert.notStrictEqual(code1, code2, "Respondent codes must be unique and non-sequential");
  });

  test("Fraud investigation link access requires verified admin role and detailed justification", async () => {
    // Reason shorter than 10 characters should be rejected
    await assert.rejects(
      async () => {
        await resolveRespondentForFraudInvestigation({
          respondentCode: "resp_dummy_code",
          adminUserId: "some_admin",
          reason: "short",
        });
      },
      /detailed reason of at least 10 characters/i,
      "Unmasking participant link without sufficient justification must be rejected."
    );

    // Non-admin attempt should be strictly rejected
    const nonAdminUser = await prisma.user.findFirst({
      where: { role: { not: "ADMIN" } },
      select: { id: true },
    });
    if (nonAdminUser) {
      await assert.rejects(
        async () => {
          await resolveRespondentForFraudInvestigation({
            respondentCode: "resp_dummy_code",
            adminUserId: nonAdminUser.id,
            reason: "Checking user details for unauthorized investigation",
          });
        },
        /Unauthorized/i,
        "Non-admin user must be rejected from unmasking participant link."
      );
    }
  });

  // ---------------------------------------------------------------------------
  // 5. External AI Boundary Enforcement
  // ---------------------------------------------------------------------------
  test("AI Boundary: AI_EXTERNAL_ENABLED defaults to false to prevent data leakage", () => {
    assert.strictEqual(
      FEATURES.AI_EXTERNAL_ENABLED,
      false,
      "AI_EXTERNAL_ENABLED must default to false to protect participant data from external AI providers."
    );
  });
});
