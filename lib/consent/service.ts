import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { CREDITS_DISCLAIMER } from "@/lib/config/features";

export interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export function getDefaultComprehensionQuestions(isFunded: boolean): ComprehensionQuestion[] {
  const questions: ComprehensionQuestion[] = [
    {
      id: "voluntary_withdrawal",
      question: "Can you stop and withdraw from this research study at any time without penalty or loss of benefits?",
      options: [
        "Yes, participation is completely voluntary and I can withdraw at any point.",
        "No, once started, I am obligated to complete all questions.",
      ],
      correctIndex: 0,
    },
    {
      id: "credit_nature",
      question: isFunded
        ? "Do Tinat Credits (TC) have real money value or can they be cashed out?"
        : "Will you receive cash payment for participating in this research study?",
      options: isFunded
        ? [
            "Yes, they can be withdrawn to Telebirr or CBE as cash.",
            "No, Tinat Credits are non-cash internal tokens with NO cash value and cannot be exchanged for money.",
          ]
        : [
            "No, this is a voluntary, non-compensated research study.",
            "Yes, cash payment will be disbursed upon completion.",
          ],
      correctIndex: isFunded ? 1 : 0,
    },
    {
      id: "privacy_pseudonymization",
      question: "How is your identity protected under Ethiopian Proclamation No. 1321/2024?",
      options: [
        "My answers are linked to a random pseudonymized respondent code; researchers cannot view my name or National ID.",
        "My personal contact details and National ID are directly shared with the researcher.",
      ],
      correctIndex: 0,
    },
  ];

  return questions;
}

export async function getOrCreateConsentForm(studyId: string, language = "en") {
  // Find current active / latest version
  const latestForm = await prisma.consentForm.findFirst({
    where: { studyId, language },
    orderBy: { version: "desc" },
  });

  if (latestForm) {
    return latestForm;
  }

  // Create default initial form
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: {
      researcher: {
        select: { name: true, institution: true, email: true },
      },
    },
  });

  if (!study) {
    throw new Error("Study not found.");
  }

  const isFunded = study.fundingType === "FUNDED" || (study.rewardCredits > 0 && study.fundingType !== "FREE");
  const creditsAmount = study.creditPerResponse || study.rewardCredits || 0;

  const keyInformation = {
    studyTitle: study.title,
    researcherName: study.researcher?.name || "Tinat Research Team",
    institution: study.researcher?.institution || "Tinat Health Research Network",
    estimatedMinutes: study.estimatedMinutes || 5,
    purpose: study.objective || study.description || "To investigate health and epidemiological indicators in Ethiopia.",
    voluntaryStatement:
      "Your participation is completely voluntary. You may refuse to participate or stop at any time without negative consequences.",
    compensationStatement: isFunded
      ? `Participants who complete this questionnaire receive ${creditsAmount} Tinat Credits (TC). ${CREDITS_DISCLAIMER}`
      : "This study provides no financial compensation or platform credits. Participation is voluntary.",
    confidentialityStatement:
      "In accordance with Ethiopian Personal Data Protection Proclamation No. 1321/2024, your answers are pseudonymized under a random respondent code. Your National ID and personal account are decoupled from your responses.",
    contactInfo: study.researcher?.email || "ethics@tinat.et",
  };

  const fullText = `# Informed Consent: ${study.title}

## Purpose of the Research
${study.description || study.objective || "Observational health research questionnaire."}

## Expected Duration & Procedures
Completing this survey requires approximately ${study.estimatedMinutes || 5} minutes. You will be asked questions regarding health and lifestyle experiences.

## Voluntary Participation & Right to Withdraw
Participation is entirely voluntary. You may withdraw at any time using the "Stop and Withdraw" control without penalty.

## Compensation & Tinat Credits
${keyInformation.compensationStatement}

## Privacy & Personal Data Protection
Your responses are collected under Ethiopian Proclamation No. 1321/2024. Responses are identified strictly by an unguessable, randomized respondent code and cannot be correlated with your identity by researchers.`;

  const comprehensionQuestions = getDefaultComprehensionQuestions(isFunded);

  return await prisma.consentForm.create({
    data: {
      studyId,
      version: 1,
      language,
      keyInformation: keyInformation as any,
      fullText,
      comprehensionQuestions: comprehensionQuestions as any,
    },
  });
}

/**
 * Saves a new consent form version or updates if no responses/records exist for current version.
 */
export async function saveConsentForm(
  studyId: string,
  data: {
    keyInformation: any;
    fullText: string;
    comprehensionQuestions: ComprehensionQuestion[];
  },
  language = "en"
) {
  const current = await prisma.consentForm.findFirst({
    where: { studyId, language },
    orderBy: { version: "desc" },
    include: {
      _count: {
        select: { records: true },
      },
    },
  });

  if (!current || current._count.records === 0) {
    if (current) {
      return await prisma.consentForm.update({
        where: { id: current.id },
        data: {
          keyInformation: data.keyInformation,
          fullText: data.fullText,
          comprehensionQuestions: data.comprehensionQuestions as any,
        },
      });
    } else {
      return await prisma.consentForm.create({
        data: {
          studyId,
          version: 1,
          language,
          keyInformation: data.keyInformation,
          fullText: data.fullText,
          comprehensionQuestions: data.comprehensionQuestions as any,
        },
      });
    }
  }

  // Records exist for current version: Increment version!
  return await prisma.consentForm.create({
    data: {
      studyId,
      version: current.version + 1,
      language,
      keyInformation: data.keyInformation,
      fullText: data.fullText,
      comprehensionQuestions: data.comprehensionQuestions as any,
    },
  });
}

/**
 * Validates comprehension answers and records participant consent.
 */
export async function recordConsent(
  respondentCode: string,
  consentFormId: string,
  answers: Record<string, number>,
  language = "en"
): Promise<{
  success: boolean;
  passed: boolean;
  failedQuestionIds?: string[];
  consentRecord?: any;
  error?: string;
}> {
  const form = await prisma.consentForm.findUnique({
    where: { id: consentFormId },
  });

  if (!form) {
    return { success: false, passed: false, error: "Consent form not found." };
  }

  const questions = (form.comprehensionQuestions as any as ComprehensionQuestion[]) || [];
  const failed: string[] = [];

  for (const q of questions) {
    const givenAnswer = answers[q.id];
    if (givenAnswer !== q.correctIndex) {
      failed.push(q.id);
    }
  }

  if (failed.length > 0) {
    return {
      success: false,
      passed: false,
      failedQuestionIds: failed,
      error: "All comprehension questions must be answered correctly before consenting.",
    };
  }

  // All comprehension checks passed: record consent
  const record = await prisma.consentRecord.create({
    data: {
      respondentCode,
      consentFormId,
      acceptedAt: new Date(),
      comprehensionAnswers: answers,
      language,
    },
  });

  return {
    success: true,
    passed: true,
    consentRecord: record,
  };
}

/**
 * Handles participant voluntary withdrawal: marks consent record and purges partial responses.
 */
export async function withdrawConsent(
  respondentCode: string,
  studyId: string,
  reason?: string
): Promise<{ success: boolean; purgedResponses: number }> {
  // Update consent record
  await prisma.consentRecord.updateMany({
    where: {
      respondentCode,
      consentForm: {
        studyId,
      },
    },
    data: {
      withdrawnAt: new Date(),
      withdrawalReason: reason || "Participant voluntarily stopped and withdrew from study.",
    },
  });

  // Purge any partial responses for this respondentCode
  const deleteResult = await prisma.response.deleteMany({
    where: {
      respondentCode,
      studyId,
    },
  });

  const link = await prisma.participantLink.findFirst({
    where: { respondentCode, studyId },
    select: { userId: true },
  });

  await logActivity({
    userId: link?.userId || "SYSTEM",
    action: "PARTICIPANT_WITHDREW_CONSENT",
    description: `Respondent ${respondentCode} withdrew consent from study ${studyId}. Purged ${deleteResult.count} partial responses.`,
    resourceId: studyId,
    resourceType: "Study",
  });

  return {
    success: true,
    purgedResponses: deleteResult.count,
  };
}
