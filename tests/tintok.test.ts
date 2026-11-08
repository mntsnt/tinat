import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import "dotenv/config";

process.env.AUTH_SECRET = process.env.AUTH_SECRET || "tinat-auth-secret-for-matrix-tests-min-32-chars!";
(process.env as Record<string, string>).NODE_ENV = "test";

import { prisma } from "../lib/prisma";
import {
  createTintokVersion,
  evaluateTintokEligibility,
} from "../lib/tintok/createVersion";
import { isCrossModeExcluded, getOrCreateParticipantLink } from "../lib/identity/linkService";
import { StudyFormat, StudyLinkType, StudyFundingType, QuestionType } from "../generated/prisma/client";

describe("Tintok Card-Style Micro-Study Format & Governance", () => {
  const timestamp = Date.now();
  let researcherUserId: string;
  let otherResearcherUserId: string;
  let participantUserId: string;
  let standardStudyId: string;
  let sensitiveStudyId: string;
  let minorsStudyId: string;

  before(async () => {
    // 1. Create test researchers (with accepted Code of Conduct and DPA)
    const researcher = await prisma.user.create({
      data: {
        name: "Test Researcher",
        email: `tintok-researcher-${timestamp}@example.com`,
        passwordHash: "dummy-hash",
        role: "RESEARCHER",
        isVerified: true,
        institution: "Addis Ababa University",
        codeOfConductAcceptedAt: new Date(),
        dpaAcceptedAt: new Date(),
      },
    });
    researcherUserId = researcher.id;

    const otherResearcher = await prisma.user.create({
      data: {
        name: "Other Researcher",
        email: `tintok-other-${timestamp}@example.com`,
        passwordHash: "dummy-hash",
        role: "RESEARCHER",
        isVerified: true,
        institution: "Jimma University",
        codeOfConductAcceptedAt: new Date(),
        dpaAcceptedAt: new Date(),
      },
    });
    otherResearcherUserId = otherResearcher.id;

    // 2. Create test participant
    const participant = await prisma.user.create({
      data: {
        name: "Test Participant",
        email: `tintok-part-${timestamp}@example.com`,
        passwordHash: "dummy-hash",
        role: "PARTICIPANT",
        isVerified: true,
      },
    });
    participantUserId = participant.id;

    // 3. Create a clean STANDARD parent study with various question types
    const parent = await prisma.study.create({
      data: {
        title: "Ethiopian Community Health Survey",
        description: "Comprehensive public health survey assessing community wellbeing in Oromia.",
        researcherId: researcherUserId,
        format: StudyFormat.STANDARD,
        status: "ACTIVE",
        fundingType: StudyFundingType.FUNDED,
        rewardCredits: 50,
        creditPerResponse: 50,
        creditBudget: 5000,
        creditsSpent: 500,
        budgetCredits: 5000,
        creditsPaid: 500,
        involvesMinors: false,
        containsSensitiveTopics: false,
        estimatedMinutes: 20,
        questions: {
          create: [
            {
              order: 1,
              type: QuestionType.SINGLE_CHOICE,
              text: "What is your primary source of drinking water?",
              required: true,
              options: {
                create: [
                  { text: "Piped water", value: "piped", order: 1 },
                  { text: "Protected spring", value: "spring", order: 2 },
                  { text: "Unprotected well", value: "well", order: 3 },
                ],
              },
            },
            {
              order: 2,
              type: QuestionType.MULTIPLE_CHOICE,
              text: "Which health services have you accessed in the past 6 months?",
              required: false,
              options: {
                create: [
                  { text: "Vaccination", value: "vaccine", order: 1 },
                  { text: "Maternal clinic", value: "maternal", order: 2 },
                  { text: "Dental care", value: "dental", order: 3 },
                ],
              },
            },
            {
              order: 3,
              type: QuestionType.LINEAR_SCALE,
              text: "How satisfied are you with local health post services?",
              required: true,
              scaleMin: 1,
              scaleMax: 5,
              scaleMinLabel: "Poor",
              scaleMaxLabel: "Excellent",
            },
            {
              order: 4,
              type: QuestionType.NUMBER,
              text: "How many kilometers is the nearest healthcare facility?",
              required: true,
            },
            {
              order: 5,
              type: QuestionType.SHORT_TEXT,
              text: "In one word or short phrase, what is your primary health concern?",
              required: false,
            },
            {
              order: 6,
              type: QuestionType.LONG_TEXT,
              text: "Please describe in detail your family's experience navigating local clinical referrals over the last 5 years.",
              required: false,
            },
            {
              order: 7,
              type: QuestionType.DATE,
              text: "When was your most recent medical examination date?",
              required: false,
            },
            {
              order: 8,
              type: QuestionType.MULTIPLE_CHOICE_GRID,
              text: "Rate your access to medications across the following conditions:",
              required: false,
              rows: {
                create: [{ text: "Hypertension", value: "htn", order: 1 }],
              },
              options: {
                create: [{ text: "Always Available", value: "avail", order: 1 }],
              },
            },
          ],
        },
      },
    });
    standardStudyId = parent.id;

    // 4. Create a parent study with involvesMinors = true
    const minorsParent = await prisma.study.create({
      data: {
        title: "Pediatric Nutrition Follow-up",
        researcherId: researcherUserId,
        format: StudyFormat.STANDARD,
        status: "ACTIVE",
        involvesMinors: true,
        containsSensitiveTopics: false,
      },
    });
    minorsStudyId = minorsParent.id;

    // 5. Create a parent study with containsSensitiveTopics = true
    const sensitiveParent = await prisma.study.create({
      data: {
        title: "Trauma and Stigmatized Health Survey",
        researcherId: researcherUserId,
        format: StudyFormat.STANDARD,
        status: "ACTIVE",
        involvesMinors: false,
        containsSensitiveTopics: true,
      },
    });
    sensitiveStudyId = sensitiveParent.id;
  });

  after(async () => {
    try {
      // Clean up test studies and users
      await prisma.answer.deleteMany({
        where: { response: { study: { researcherId: researcherUserId } } },
      });
      await prisma.response.deleteMany({
        where: { study: { researcherId: researcherUserId } },
      });
      await prisma.participantLink.deleteMany({
        where: { userId: participantUserId },
      });
      await prisma.consentForm.deleteMany({
        where: { study: { researcherId: researcherUserId } },
      });
      await prisma.question.deleteMany({
        where: { study: { researcherId: researcherUserId } },
      });
      await prisma.study.deleteMany({
        where: { researcherId: researcherUserId },
      });
      await prisma.study.deleteMany({
        where: { researcherId: otherResearcherUserId },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: [researcherUserId, otherResearcherUserId, participantUserId] },
        },
      });
    } catch {}
  });

  test("1. evaluateTintokEligibility: filters out unsupported formats (LONG_TEXT, DATE, GRID) and preselects eligible cards", async () => {
    const parent = await prisma.study.findUnique({
      where: { id: standardStudyId },
      include: {
        questions: {
          include: { options: true, rows: true },
          orderBy: { order: "asc" },
        },
      },
    });

    assert.ok(parent);
    const evaluation = evaluateTintokEligibility(parent as any);

    assert.strictEqual(evaluation.isEligible, true);
    assert.strictEqual(evaluation.eligibleQuestions.length, 5); // SINGLE_CHOICE, MULTIPLE_CHOICE, RATING, NUMBER, SHORT_TEXT
    assert.strictEqual(evaluation.skippedQuestions.length, 3); // LONG_TEXT, DATE, GRID_SINGLE
    assert.strictEqual(evaluation.preselectedQuestionIds.length, 5);

    // Verify skipped question reasons
    const skippedTypes = evaluation.skippedQuestions.map((q) => q.reason || "");
    assert.ok(skippedTypes.some((r) => r.toLowerCase().includes("long text")));
    assert.ok(skippedTypes.some((r) => r.toLowerCase().includes("date")));
    assert.ok(skippedTypes.some((r) => r.toLowerCase().includes("matrix") || r.toLowerCase().includes("grid")));
  });

  test("2. createTintokVersion: Happy path creates separate draft study with TINTOK format and fresh consent", async () => {
    const result = await createTintokVersion(
      standardStudyId,
      researcherUserId,
      {
        selectedQuestionIds: undefined, // defaults to preselected
        fundingType: StudyFundingType.FREE,
        teaserLinkEnabled: true,
      }
    );

    assert.ok(result.tintokStudyId);
    assert.strictEqual(result.copiedCount, 5);
    assert.strictEqual(result.skippedCount, 3);

    // Verify new study in database
    const tintokStudy = await prisma.study.findUnique({
      where: { id: result.tintokStudyId },
      include: {
        questions: { include: { options: true }, orderBy: { order: "asc" } },
        consentForms: true,
        parentStudy: true,
      },
    });

    assert.ok(tintokStudy);
    assert.strictEqual(tintokStudy.format, StudyFormat.TINTOK);
    assert.strictEqual(tintokStudy.status, "DRAFT");
    assert.strictEqual(tintokStudy.parentStudyId, standardStudyId);
    assert.strictEqual(tintokStudy.linkType, StudyLinkType.TINTOK_VERSION);
    assert.strictEqual(tintokStudy.teaserLinkEnabled, true);
    assert.strictEqual(tintokStudy.fundingType, StudyFundingType.FREE);
    assert.strictEqual(tintokStudy.budgetCredits, 0);
    assert.strictEqual(tintokStudy.creditsPaid, 0);
    assert.strictEqual(tintokStudy.creditsSpent, 0);
    assert.ok(tintokStudy.title.includes("Quick version"));

    // Verify questions copied
    assert.strictEqual(tintokStudy.questions.length, 5);
    assert.strictEqual(tintokStudy.questions[0].text, "What is your primary source of drinking water?");
    assert.strictEqual(tintokStudy.questions[0].options.length, 3);

    // Verify independent consent form created
    assert.strictEqual(tintokStudy.consentForms.length, 1);
    assert.ok(tintokStudy.consentForms[0].fullText.includes("Tintok"));
  });

  test("3. createTintokVersion: Rejects creation when parent involves minors (HTTP 422)", async () => {
    await assert.rejects(
      async () => {
        await createTintokVersion(minorsStudyId, researcherUserId);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 422);
        assert.ok(err.message.includes("minors"));
        return true;
      }
    );
  });

  test("4. createTintokVersion: Rejects creation when parent contains sensitive topics (HTTP 422)", async () => {
    await assert.rejects(
      async () => {
        await createTintokVersion(sensitiveStudyId, researcherUserId);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 422);
        assert.ok(err.message.includes("sensitive"));
        return true;
      }
    );
  });

  test("5. createTintokVersion: Blocks non-owner, non-admin researcher (HTTP 403)", async () => {
    await assert.rejects(
      async () => {
        await createTintokVersion(standardStudyId, otherResearcherUserId);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 403);
        assert.ok(err.message.includes("permission") || err.message.includes("owner"));
        return true;
      }
    );
  });

  test("6. createTintokVersion: Blocks second Tintok version when parent already has one", async () => {
    // standardStudyId already had a Tintok version created in test 2
    await assert.rejects(
      async () => {
        await createTintokVersion(standardStudyId, researcherUserId);
      },
      (err: any) => {
        assert.ok([400, 422].includes(err.statusCode));
        assert.ok(err.message.includes("already has") || err.message.includes("limit"));
        return true;
      }
    );
  });

  test("7. createTintokVersion: Blocks creating Tintok version from another Tintok study", async () => {
    // Find the existing Tintok child study
    const childStudy = await prisma.study.findFirst({
      where: { parentStudyId: standardStudyId },
    });
    assert.ok(childStudy);

    await assert.rejects(
      async () => {
        await createTintokVersion(childStudy.id, researcherUserId);
      },
      (err: any) => {
        assert.ok([400, 422].includes(err.statusCode));
        assert.ok(err.message.includes("STANDARD"));
        return true;
      }
    );
  });

  test("8. Participant Cross-Mode Exclusion: Participant who completed parent cannot take Tintok child", async () => {
    const childStudy = await prisma.study.findFirst({
      where: { parentStudyId: standardStudyId },
    });
    assert.ok(childStudy);

    // Record participant link on parent study
    await getOrCreateParticipantLink({
      userId: participantUserId,
      studyId: standardStudyId,
    });

    // Check exclusion on child study
    const exclusion = await isCrossModeExcluded({
      userId: participantUserId,
      studyId: childStudy.id,
    });

    assert.strictEqual(exclusion.excluded, true);
    assert.ok(exclusion.reason?.includes("standard version"));
  });

  test("9. Participant Cross-Mode Exclusion: Independent respondentCode spaces", async () => {
    const childStudy = await prisma.study.findFirst({
      where: { parentStudyId: standardStudyId },
    });
    assert.ok(childStudy);

    const parentLink = await getOrCreateParticipantLink({
      userId: participantUserId,
      studyId: standardStudyId,
    });

    const childLink = await getOrCreateParticipantLink({
      userId: participantUserId,
      studyId: childStudy.id,
    });

    // Codes must be different and unguessable
    assert.notStrictEqual(parentLink.respondentCode, childLink.respondentCode);
    assert.ok(parentLink.respondentCode.startsWith("resp_"));
    assert.ok(childLink.respondentCode.startsWith("resp_"));
  });

  test("10. Data Isolation: No responses, ethics approvals, consent records, or credit counters copied from parent", async () => {
    const childStudy = await prisma.study.findFirst({
      where: { parentStudyId: standardStudyId },
      include: {
        responses: true,
        ethicsApproval: true,
        likes: true,
        comments: true,
        ratings: true,
      },
    });
    assert.ok(childStudy);

    assert.strictEqual(childStudy.responses.length, 0);
    assert.strictEqual(childStudy.ethicsApproval, null);
    assert.strictEqual(childStudy.likes.length, 0);
    assert.strictEqual(childStudy.comments.length, 0);
    assert.strictEqual(childStudy.ratings.length, 0);
    assert.strictEqual(childStudy.creditsPaid, 0);
    assert.strictEqual(childStudy.creditsSpent, 0);
    assert.strictEqual(childStudy.fundingType, StudyFundingType.FREE);
  });

  test("11. Participant Cross-Mode Exclusion: Reverse exclusion when teaserLinkEnabled is false", async () => {
    // Create a Tintok version with teaserLinkEnabled = false
    const standaloneParent = await prisma.study.create({
      data: {
        title: "Standalone Nutrition Survey",
        researcherId: researcherUserId,
        format: StudyFormat.STANDARD,
        status: "ACTIVE",
        involvesMinors: false,
        containsSensitiveTopics: false,
        questions: {
          create: [
            {
              order: 1,
              type: QuestionType.SINGLE_CHOICE,
              text: "Dietary habits?",
              required: true,
            },
          ],
        },
      },
    });

    const childWithoutTeaser = await createTintokVersion(
      standaloneParent.id,
      researcherUserId,
      {
        teaserLinkEnabled: false,
        fundingType: StudyFundingType.FREE,
      }
    );

    // Participant completes the child without teaser link
    await getOrCreateParticipantLink({
      userId: participantUserId,
      studyId: childWithoutTeaser.tintokStudyId,
    });

    // Check exclusion on parent study
    const parentExclusion = await isCrossModeExcluded({
      userId: participantUserId,
      studyId: standaloneParent.id,
    });

    assert.strictEqual(parentExclusion.excluded, true);
    assert.ok(parentExclusion.reason?.includes("quick card version"));
  });
});
