import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import "dotenv/config";

process.env.AUTH_SECRET = process.env.AUTH_SECRET || "tinat-auth-secret-for-matrix-tests-min-32-chars!";
(process.env as Record<string, string>).NODE_ENV = "test";

import { prisma } from "../lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import {
  canStudyBecomeActive,
  pauseExpiredActiveStudies,
  requiresFourEyesApproval,
} from "../lib/ethics/service";
import {
  getOrCreateConsentForm,
  saveConsentForm,
  recordConsent,
  withdrawConsent,
} from "../lib/consent/service";
import { getOrCreateParticipantLink } from "../lib/identity/linkService";

describe("Tinat Ethics Approval Gate, Consent & Research Governance", () => {
  let researcherId: string;
  let admin1Id: string;
  let admin2Id: string;
  let participantId: string;
  let testStudyId: string;

  before(async () => {
    // 1. Create or fetch test users
    const researcher = await prisma.user.upsert({
      where: { email: "ethics-test-researcher@tinat.test" },
      update: {
        role: UserRole.RESEARCHER,
        codeOfConductAcceptedAt: new Date(),
        dpaAcceptedAt: new Date(),
      },
      create: {
        email: "ethics-test-researcher@tinat.test",
        name: "Dr. Ethics Researcher",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz012345",
        role: UserRole.RESEARCHER,
        isVerified: true,
        faydaVerified: true,
        codeOfConductAcceptedAt: new Date(),
        dpaAcceptedAt: new Date(),
      },
    });
    researcherId = researcher.id;

    const admin1 = await prisma.user.upsert({
      where: { email: "ethics-test-admin1@tinat.test" },
      update: { role: UserRole.ADMIN },
      create: {
        email: "ethics-test-admin1@tinat.test",
        name: "Ethics Admin One",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz012345",
        role: UserRole.ADMIN,
        isVerified: true,
      },
    });
    admin1Id = admin1.id;

    const admin2 = await prisma.user.upsert({
      where: { email: "ethics-test-admin2@tinat.test" },
      update: { role: UserRole.ADMIN },
      create: {
        email: "ethics-test-admin2@tinat.test",
        name: "Ethics Admin Two",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz012345",
        role: UserRole.ADMIN,
        isVerified: true,
      },
    });
    admin2Id = admin2.id;

    const participant = await prisma.user.upsert({
      where: { email: "ethics-test-participant@tinat.test" },
      update: { role: UserRole.PARTICIPANT },
      create: {
        email: "ethics-test-participant@tinat.test",
        name: "Ethics Participant",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz012345",
        role: UserRole.PARTICIPANT,
        isVerified: true,
      },
    });
    participantId = participant.id;

    // 2. Create baseline test study in DRAFT
    const study = await prisma.study.create({
      data: {
        title: "Observational Health Cohort Study",
        description: "Epidemiological study investigating adult health practices in Ethiopia.",
        researcherId,
        fundingType: "FUNDED",
        creditPerResponse: 10,
        creditBudget: 500,
        creditsSpent: 0,
        status: "DRAFT",
        populationDescription: "Adults aged 18-65 residing in Addis Ababa",
        recruitmentMethod: "Online voluntary cohort",
        containsSensitiveTopics: false,
        involvesMinors: false,
        questions: {
          create: [
            {
              text: "How often do you exercise per week?",
              type: "SHORT_TEXT",
              order: 1,
              required: true,
            },
          ],
        },
      },
    });
    testStudyId = study.id;
  });

  after(async () => {
    // Cleanup test records
    await prisma.response.deleteMany({ where: { studyId: testStudyId } });
    await prisma.consentRecord.deleteMany({ where: { consentForm: { studyId: testStudyId } } });
    await prisma.consentForm.deleteMany({ where: { studyId: testStudyId } });
    await prisma.ethicsApproval.deleteMany({ where: { studyId: testStudyId } });
    await prisma.participantLink.deleteMany({ where: { studyId: testStudyId } });
    await prisma.question.deleteMany({ where: { studyId: testStudyId } });
    await prisma.study.deleteMany({ where: { id: testStudyId } });
  });

  test("Part 1: Ethics Approval Gate prevents activation without verified, unexpired clearance", async () => {
    // 1. Initially, study has no ethics approval and is not exempt -> activation must be blocked
    const check1 = await canStudyBecomeActive(testStudyId);
    assert.strictEqual(check1.canActivate, false);
    assert.match(check1.error || "", /without submitted and verified Institutional Ethics Approval/i);

    // 2. Submit PENDING ethics approval
    const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // +1 year
    const approval = await prisma.ethicsApproval.create({
      data: {
        studyId: testStudyId,
        committeeName: "Addis Ababa University CHS Institutional Review Board",
        approvalNumber: "AAU-IRB-2026-0891",
        approvalDate: new Date(),
        expiryDate,
        documentPath: "aau_irb_approval.pdf",
        status: "PENDING",
      },
    });
    assert.strictEqual(approval.status, "PENDING");

    // Still blocked because status is PENDING, not VERIFIED
    const check2 = await canStudyBecomeActive(testStudyId);
    assert.strictEqual(check2.canActivate, false);
    assert.match(check2.error || "", /It must be VERIFIED before activation/i);

    // 3. Admin verifies approval
    await prisma.ethicsApproval.update({
      where: { id: approval.id },
      data: {
        status: "VERIFIED",
        verifiedByAdminId: admin1Id,
        verifiedAt: new Date(),
        adminNotes: "Accredited institutional IRB clearance confirmed.",
        checklist: {
          committeeRecognized: true,
          coversOnlineDataCollection: true,
          incentiveDescribedCorrectly: true,
          consentMatches: true,
        },
      },
    });

    // Now gate allows activation!
    const check3 = await canStudyBecomeActive(testStudyId);
    assert.strictEqual(check3.canActivate, true);

    // 4. Test expired approval handling
    await prisma.ethicsApproval.update({
      where: { id: approval.id },
      data: {
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      },
    });

    const check4 = await canStudyBecomeActive(testStudyId);
    assert.strictEqual(check4.canActivate, false);
    assert.match(check4.error || "", /Ethics approval expired/i);

    // 5. Auto-pause expired active study check
    await prisma.study.update({
      where: { id: testStudyId },
      data: { status: "ACTIVE", ethicsExempt: false },
    });

    const pausedCount = await pauseExpiredActiveStudies();
    assert.strictEqual(pausedCount >= 1, true);

    const pausedStudy = await prisma.study.findUnique({ where: { id: testStudyId } });
    assert.strictEqual(pausedStudy?.status, "PAUSED");

    // 6. Administrative exemption path
    await prisma.study.update({
      where: { id: testStudyId },
      data: {
        ethicsExempt: true,
        ethicsExemptionReason: "Institutional health system quality improvement review",
        ethicsExemptedByAdminId: admin1Id,
        ethicsExemptedAt: new Date(),
      },
    });

    const checkExempt = await canStudyBecomeActive(testStudyId);
    assert.strictEqual(checkExempt.canActivate, true);
  });

  test("Part 2: Consent Form Versioning preserves historic versions when records exist", async () => {
    // 1. Get or create initial version 1
    const formV1 = await getOrCreateConsentForm(testStudyId, "en");
    assert.strictEqual(formV1.version, 1);
    assert.strictEqual(typeof formV1.keyInformation, "object");

    // 2. If no records exist, saveConsentForm updates existing version
    const updatedV1 = await saveConsentForm(
      testStudyId,
      {
        keyInformation: { ...(formV1.keyInformation as any), purpose: "Updated Purpose Text" },
        fullText: "Updated Full Text v1",
        comprehensionQuestions: formV1.comprehensionQuestions as any,
      },
      "en"
    );
    assert.strictEqual(updatedV1.id, formV1.id);
    assert.strictEqual(updatedV1.version, 1);

    // 3. Create a participant link & consent record for version 1
    const { respondentCode } = await getOrCreateParticipantLink({
      userId: participantId,
      studyId: testStudyId,
    });

    const consentRecord = await prisma.consentRecord.create({
      data: {
        respondentCode,
        consentFormId: formV1.id,
        comprehensionAnswers: { voluntary_withdrawal: 0, credit_nature: 1, privacy_pseudonymization: 0 },
        language: "en",
      },
    });
    assert.ok(consentRecord.id);

    // 4. Now modify consent form: since records exist for v1, it MUST increment to version 2!
    const formV2 = await saveConsentForm(
      testStudyId,
      {
        keyInformation: { ...(formV1.keyInformation as any), purpose: "Version 2 Protocol Text" },
        fullText: "Full Text for Version 2",
        comprehensionQuestions: formV1.comprehensionQuestions as any,
      },
      "en"
    );
    assert.strictEqual(formV2.version, 2);
    assert.notStrictEqual(formV2.id, formV1.id);

    // Version 1 still exists in database intact
    const originalV1 = await prisma.consentForm.findUnique({ where: { id: formV1.id } });
    assert.strictEqual(originalV1?.version, 1);
  });

  test("Part 2: Comprehension Questions gate consent recording", async () => {
    const form = await getOrCreateConsentForm(testStudyId, "en");
    const { respondentCode } = await getOrCreateParticipantLink({
      userId: participantId,
      studyId: testStudyId,
    });

    // 1. Submitting incorrect answers fails
    const badResult = await recordConsent(
      respondentCode,
      form.id,
      {
        voluntary_withdrawal: 1, // Wrong (0 is correct)
        credit_nature: 1,
        privacy_pseudonymization: 0,
      },
      "en"
    );
    assert.strictEqual(badResult.passed, false);
    assert.deepStrictEqual(badResult.failedQuestionIds, ["voluntary_withdrawal"]);

    // 2. Submitting all correct answers succeeds
    const goodResult = await recordConsent(
      respondentCode,
      form.id,
      {
        voluntary_withdrawal: 0,
        credit_nature: 1,
        privacy_pseudonymization: 0,
      },
      "en"
    );
    assert.strictEqual(goodResult.passed, true);
    assert.ok(goodResult.consentRecord?.id);
  });

  test("Part 2: Participant Voluntary Withdrawal purges partial responses", async () => {
    const { respondentCode } = await getOrCreateParticipantLink({
      userId: participantId,
      studyId: testStudyId,
    });

    // 1. Simulate partial response
    const response = await prisma.response.create({
      data: {
        studyId: testStudyId,
        respondentCode,
      },
    });
    assert.ok(response.id);

    // Verify response exists
    const beforeCount = await prisma.response.count({
      where: { respondentCode, studyId: testStudyId },
    });
    assert.strictEqual(beforeCount, 1);

    // 2. Participant exercises voluntary withdrawal
    const withdrawResult = await withdrawConsent(
      respondentCode,
      testStudyId,
      "Participant requested immediate data purge."
    );
    assert.strictEqual(withdrawResult.success, true);
    assert.strictEqual(withdrawResult.purgedResponses, 1);

    // 3. Confirm response is purged from database
    const afterCount = await prisma.response.count({
      where: { respondentCode, studyId: testStudyId },
    });
    assert.strictEqual(afterCount, 0);

    // 4. Confirm consent record is marked with withdrawnAt timestamp
    const record = await prisma.consentRecord.findFirst({
      where: { respondentCode },
      orderBy: { acceptedAt: "desc" },
    });
    assert.ok(record?.withdrawnAt);
    assert.strictEqual(record?.withdrawalReason, "Participant requested immediate data purge.");
  });

  test("Part 3: Four-Eyes Approval policy enforces two distinct administrators for sensitive or large-budget studies", async () => {
    // 1. Sensitive study requires four eyes
    const sensitiveStudy = {
      containsSensitiveTopics: true,
      creditBudget: 200,
    };
    assert.strictEqual(requiresFourEyesApproval(sensitiveStudy), true);

    // 2. Large budget study (> 1000 TC) requires four eyes
    const highBudgetStudy = {
      containsSensitiveTopics: false,
      creditBudget: 1500,
    };
    assert.strictEqual(requiresFourEyesApproval(highBudgetStudy), true);

    // 3. Small non-sensitive study does NOT require four eyes
    const normalStudy = {
      containsSensitiveTopics: false,
      creditBudget: 200,
    };
    assert.strictEqual(requiresFourEyesApproval(normalStudy), false);
  });
});
