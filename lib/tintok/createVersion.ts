import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { FEATURES, CREDITS_DISCLAIMER } from "@/lib/config/features";
import { StudyFormat, StudyLinkType, StudyStatus, StudyFundingType, QuestionType } from "@/generated/prisma/client";

export const TINTOK_SENSITIVE_TOPICS = [
  "hiv",
  "aids",
  "sti",
  "sexually transmitted",
  "syphilis",
  "gonorrhea",
  "abortion",
  "pregnancy termination",
  "sexual violence",
  "rape",
  "abuse",
  "domestic violence",
  "gender-based violence",
  "suicide",
  "suicidal",
  "self-harm",
  "substance abuse",
  "illicit drug",
  "narcotic",
  "addiction",
  "severe depression",
  "psychiatric",
  "minor",
  "child",
  "pediatric",
] as const;

export interface CreateTintokVersionOptions {
  selectedQuestionIds?: string[];
  teaserLinkEnabled?: boolean;
  fundingType?: "FREE" | "FUNDED";
  rewardCredits?: number;
  creditBudget?: number;
}

export interface QuestionEligibilityReport {
  questionId: string;
  order: number;
  text: string;
  type: QuestionType;
  eligible: boolean;
  reason?: string;
  optionCount?: number;
}

export interface TintokCopyReport {
  parentStudyId: string;
  tintokStudyId: string;
  copiedCount: number;
  skippedCount: number;
  copiedQuestions: QuestionEligibilityReport[];
  skippedQuestions: QuestionEligibilityReport[];
}

export class TintokValidationError extends Error {
  statusCode: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode = 422, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "TintokValidationError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Checks if a string contains any of the predefined sensitive research topics.
 */
export function containsSensitiveKeyword(text: string | null | undefined): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const topic of TINTOK_SENSITIVE_TOPICS) {
    const escaped = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(lower)) {
      return topic;
    }
  }
  return null;
}

/**
 * Evaluates whether a question from a standard study is eligible for the Tintok card-style format.
 */
export function evaluateQuestionForTintok(question: {
  id: string;
  order: number;
  text: string;
  type: QuestionType;
  options?: { id: string; text: string; value: string; order: number }[];
  rows?: { id: string; text: string }[];
}): QuestionEligibilityReport {
  const { id, order, text, type, options = [] } = question;

  // 1. Check sensitive text in question
  const matchedSensitive = containsSensitiveKeyword(text);
  if (matchedSensitive) {
    return {
      questionId: id,
      order,
      text,
      type,
      eligible: false,
      reason: `Question touches sensitive topic ("${matchedSensitive}") which is not permitted in micro-study card format.`,
    };
  }

  // 2. Filter by allowed question types
  // Allowed: SINGLE_CHOICE, DROPDOWN, YES_NO, MULTIPLE_CHOICE, LINEAR_SCALE, NUMBER, SHORT_TEXT
  const allowedTypes: QuestionType[] = [
    QuestionType.SINGLE_CHOICE,
    QuestionType.DROPDOWN,
    QuestionType.YES_NO,
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.LINEAR_SCALE,
    QuestionType.NUMBER,
    QuestionType.SHORT_TEXT,
  ];

  if (!allowedTypes.includes(type)) {
    let reason = `Question type ${type} is not supported in card format.`;
    if (type === QuestionType.MULTIPLE_CHOICE_GRID || type === QuestionType.CHECKBOX_GRID) {
      reason = "Matrix and grid questions are not supported in card format.";
    } else if (type === QuestionType.LONG_TEXT) {
      reason = "Long text responses are not supported in card format.";
    } else if (type === QuestionType.DATE || type === QuestionType.TIME) {
      reason = "Date and time questions are not supported in card format.";
    } else if (type === QuestionType.FILE_UPLOAD) {
      reason = "File uploads are not supported in card format.";
    }
    return {
      questionId: id,
      order,
      text,
      type,
      eligible: false,
      reason,
    };
  }

  // 3. Question text length limit
  if (text.length > FEATURES.TINTOK_MAX_QUESTION_TEXT_LENGTH) {
    return {
      questionId: id,
      order,
      text,
      type,
      eligible: false,
      reason: `Question text (${text.length} chars) exceeds the card limit of ${FEATURES.TINTOK_MAX_QUESTION_TEXT_LENGTH} characters.`,
    };
  }

  // 4. Short text specific validation (must be concise)
  if (type === QuestionType.SHORT_TEXT && text.length > FEATURES.TINTOK_MAX_SHORT_TEXT_LENGTH) {
    return {
      questionId: id,
      order,
      text,
      type,
      eligible: false,
      reason: `Open short-text question exceeds ${FEATURES.TINTOK_MAX_SHORT_TEXT_LENGTH} characters for mobile card display.`,
    };
  }

  // 5. Option limits for choice questions
  if (
    type === QuestionType.SINGLE_CHOICE ||
    type === QuestionType.DROPDOWN ||
    type === QuestionType.MULTIPLE_CHOICE ||
    type === QuestionType.YES_NO
  ) {
    if (options.length > 6) {
      return {
        questionId: id,
        order,
        text,
        type,
        eligible: false,
        reason: `Question has ${options.length} options, exceeding the card limit of 6 options.`,
        optionCount: options.length,
      };
    }
  }

  return {
    questionId: id,
    order,
    text,
    type,
    eligible: true,
    optionCount: options.length,
  };
}

/**
 * Evaluates all questions in a study and provides an overall eligibility report.
 */
export function evaluateTintokEligibility(study: {
  questions: {
    id: string;
    order: number;
    text: string;
    type: QuestionType;
    options?: { id: string; text: string; value: string; order: number }[];
    rows?: { id: string; text: string }[];
  }[];
  involvesMinors?: boolean;
  containsSensitiveTopics?: boolean;
}) {
  const eligibleQuestions: QuestionEligibilityReport[] = [];
  const skippedQuestions: QuestionEligibilityReport[] = [];

  for (const q of study.questions) {
    const report = evaluateQuestionForTintok(q);
    if (report.eligible) {
      eligibleQuestions.push(report);
    } else {
      skippedQuestions.push(report);
    }
  }

  const preselectedQuestionIds = eligibleQuestions
    .slice(0, FEATURES.DEFAULT_PRESELECTED_TINTOK_CARDS)
    .map((q) => q.questionId);

  return {
    isEligible: !study.involvesMinors && !study.containsSensitiveTopics && eligibleQuestions.length > 0,
    eligibleQuestions,
    skippedQuestions,
    preselectedQuestionIds,
  };
}

/**
 * Generates the standardized Tintok micro-study consent template.
 */
export function generateTintokConsentTemplate(studyTitle: string, isFunded: boolean, rewardCredits: number) {
  const creditsStatement = isFunded && rewardCredits > 0
    ? `${rewardCredits} Tinat Credits (TC) upon completion. ${CREDITS_DISCLAIMER}`
    : "No credits. This micro-study is conducted on a voluntary basis.";

  return {
    version: "1.0",
    keyInformation: {
      studyFormat: "TINTOK_MICRO_STUDY",
      studyTitle,
      estimatedMinutes: 2,
      voluntaryStatement: "Your participation is completely voluntary. You can exit this card survey at any time.",
      confidentialityStatement: "Your answers are confidential and recorded under an unguessable pseudonymized respondent code. No identifying data is shared with researchers.",
      compensationStatement: creditsStatement,
    },
    fullText: `# Micro-Study Informed Consent: ${studyTitle}

**About Tintok Micro-Studies**
You are invited to participate in a brief, card-style health questionnaire. This is an independent micro-study format designed for rapid, accessible health data collection.

- **Adults Only (18+)**: This survey is strictly for adult participants.
- **Voluntary Participation**: You are free to stop or exit at any card without penalty.
- **Data Protection & Privacy**: Answers are stored under a pseudonymized respondent code in compliance with the Ethiopian Personal Data Protection Proclamation 1321/2024. Researchers never receive your name or account ID.
- **Compensation**: ${creditsStatement}
- **Contact**: contact.tinatapp@gmail.com
`,
  };
}

/**
 * Core transactional service to create a separate, linked Tintok version of an existing STANDARD study.
 */
export async function createTintokVersion(
  parentStudyId: string,
  userId: string,
  options?: CreateTintokVersionOptions
): Promise<TintokCopyReport> {
  // 1. Feature Flag Check
  if (!FEATURES.TINTOK_ENABLED) {
    throw new TintokValidationError("Tintok micro-study creation is currently disabled.", 403, "FEATURE_DISABLED");
  }

  // 2. Researcher & Governance Checks
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      codeOfConductAcceptedAt: true,
      dpaAcceptedAt: true,
      institution: true,
    },
  });

  if (!user) {
    throw new TintokValidationError("User not found.", 401, "USER_NOT_FOUND");
  }

  if (!user.codeOfConductAcceptedAt) {
    throw new TintokValidationError(
      "You must accept the Researcher Code of Conduct before creating a Tintok study.",
      403,
      "CODE_OF_CONDUCT_REQUIRED"
    );
  }

  if (!user.dpaAcceptedAt) {
    throw new TintokValidationError(
      "You must accept the Data Processing Agreement (DPA) before creating a Tintok study.",
      403,
      "DPA_REQUIRED"
    );
  }

  // 3. Load Parent Study with authorization check
  const parent = await prisma.study.findUnique({
    where: { id: parentStudyId },
    include: {
      questions: {
        include: {
          options: { orderBy: { order: "asc" } },
          rows: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
      childStudies: {
        where: { linkType: StudyLinkType.TINTOK_VERSION },
        select: { id: true, status: true },
      },
    },
  });

  if (!parent) {
    throw new TintokValidationError("Parent research study not found.", 404, "STUDY_NOT_FOUND");
  }

  // Only owner or admin
  if (parent.researcherId !== userId && user.role !== "ADMIN") {
    throw new TintokValidationError(
      "Only the study owner or an administrator can create a Tintok version.",
      403,
      "FORBIDDEN"
    );
  }

  // Parent must be STANDARD format
  if (parent.format !== StudyFormat.STANDARD) {
    throw new TintokValidationError(
      "Only STANDARD format studies can be used to create a Tintok version.",
      422,
      "INVALID_PARENT_FORMAT"
    );
  }

  // 4. Sensitivity & Minors Gate (Strict Regulatory Requirement)
  if (parent.involvesMinors) {
    throw new TintokValidationError(
      "Studies involving minors cannot be converted to Tintok micro-study format. Card surveys are restricted to adult participants (18+).",
      422,
      "MINORS_NOT_PERMITTED"
    );
  }

  if (parent.containsSensitiveTopics) {
    throw new TintokValidationError(
      "Studies containing sensitive health topics are not permitted in Tintok micro-study format. Sensitive research requires full standard clinical protocol.",
      422,
      "SENSITIVE_TOPICS_NOT_PERMITTED"
    );
  }

  // Check parent title, description, category, and tags for sensitive terms
  const titleSensitive = containsSensitiveKeyword(parent.title);
  const descSensitive = containsSensitiveKeyword(parent.description);
  const objSensitive = containsSensitiveKeyword(parent.objective);
  const catSensitive = containsSensitiveKeyword(parent.category);
  const tagsSensitive = parent.tags.map(t => containsSensitiveKeyword(t)).find(Boolean);

  const matchedParentSensitive = titleSensitive || descSensitive || objSensitive || catSensitive || tagsSensitive;
  if (matchedParentSensitive) {
    throw new TintokValidationError(
      `Parent study touches sensitive topic ("${matchedParentSensitive}") which is not permitted in Tintok card format.`,
      422,
      "SENSITIVE_TOPICS_NOT_PERMITTED"
    );
  }

  // 5. Version limit check (At most MAX_TINTOK_VERSIONS_PER_STUDY)
  const activeTintokChildren = parent.childStudies.filter(
    (c) => c.status !== StudyStatus.COMPLETED
  );
  if (activeTintokChildren.length >= FEATURES.MAX_TINTOK_VERSIONS_PER_STUDY) {
    throw new TintokValidationError(
      `This study already has an active Tintok version (maximum ${FEATURES.MAX_TINTOK_VERSIONS_PER_STUDY} permitted).`,
      422,
      "VERSION_LIMIT_REACHED"
    );
  }

  // 6. Evaluate Questions
  const allEvaluations: QuestionEligibilityReport[] = parent.questions.map((q) =>
    evaluateQuestionForTintok(q)
  );

  const eligibleQuestions = allEvaluations.filter((e) => e.eligible);
  const skippedQuestions = allEvaluations.filter((e) => !e.eligible);

  if (eligibleQuestions.length === 0) {
    throw new TintokValidationError(
      "None of the parent study questions are eligible for the Tintok card format.",
      422,
      "NO_ELIGIBLE_QUESTIONS"
    );
  }

  // Determine questions to copy
  let targetQuestionIds: string[];
  if (options?.selectedQuestionIds && options.selectedQuestionIds.length > 0) {
    // Researcher explicitly provided checklist selection
    const selectedSet = new Set(options.selectedQuestionIds);
    // Validate all selected IDs exist in eligible list
    for (const id of options.selectedQuestionIds) {
      const found = eligibleQuestions.find((eq) => eq.questionId === id);
      if (!found) {
        throw new TintokValidationError(
          `Question ID "${id}" is either ineligible for card format or does not exist on parent study.`,
          422,
          "INVALID_QUESTION_SELECTION"
        );
      }
    }
    targetQuestionIds = parent.questions
      .filter((q) => selectedSet.has(q.id))
      .map((q) => q.id);
  } else {
    // Default preselected first N (default 5) eligible questions, keeping original order
    const preselectCount = Math.min(FEATURES.DEFAULT_PRESELECTED_TINTOK_CARDS, eligibleQuestions.length);
    targetQuestionIds = eligibleQuestions.slice(0, preselectCount).map((e) => e.questionId);
  }

  // Enforce card limit: at most MAX_TINTOK_CARDS
  if (targetQuestionIds.length > FEATURES.MAX_TINTOK_CARDS) {
    throw new TintokValidationError(
      `A Tintok study can have at most ${FEATURES.MAX_TINTOK_CARDS} cards. Selected ${targetQuestionIds.length}.`,
      422,
      "CARD_LIMIT_EXCEEDED"
    );
  }

  if (targetQuestionIds.length === 0) {
    throw new TintokValidationError("At least 1 card question must be selected.", 422, "ZERO_QUESTIONS_SELECTED");
  }

  const selectedSet = new Set(targetQuestionIds);
  const questionsToCopy = parent.questions.filter((q) => selectedSet.has(q.id));

  // Additional skipped questions that were eligible but not selected
  const notSelectedEligible = eligibleQuestions
    .filter((e) => !selectedSet.has(e.questionId))
    .map((e) => ({
      ...e,
      eligible: false,
      reason: "Not included in selected card set.",
    }));

  const finalSkippedQuestions = [...skippedQuestions, ...notSelectedEligible];
  const finalCopiedQuestions = eligibleQuestions.filter((e) => selectedSet.has(e.questionId));

  // Determine Funding
  const fundingType = options?.fundingType === "FUNDED" ? StudyFundingType.FUNDED : StudyFundingType.FREE;
  const rewardCredits = fundingType === StudyFundingType.FUNDED ? (options?.rewardCredits || 0) : 0;
  const creditBudget = fundingType === StudyFundingType.FUNDED ? (options?.creditBudget || 0) : 0;

  // Suffix title with "Quick version"
  const newTitle = `${parent.title.trim()} (Quick version)`.slice(0, 150);

  // 7. Atomic Database Transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create new Study
    const newStudy = await tx.study.create({
      data: {
        title: newTitle,
        description: parent.description,
        objective: parent.objective,
        category: parent.category,
        tags: parent.tags,
        estimatedMinutes: 2,
        format: StudyFormat.TINTOK,
        status: StudyStatus.DRAFT,
        parentStudyId: parent.id,
        linkType: StudyLinkType.TINTOK_VERSION,
        teaserLinkEnabled: Boolean(options?.teaserLinkEnabled),
        fundingType,
        rewardCredits,
        creditBudget,
        budgetCredits: creditBudget,
        creditsPaid: 0,
        creditsSpent: 0,
        participantTarget: parent.participantTarget || 0,
        targetPopulation: parent.targetPopulation,
        bannerTheme: parent.bannerTheme || "canopy",
        researcherId: parent.researcherId,
        containsSensitiveTopics: false,
        involvesMinors: false,
      },
    });

    // Copy selected questions
    for (let i = 0; i < questionsToCopy.length; i++) {
      const q = questionsToCopy[i];
      const newQuestion = await tx.question.create({
        data: {
          studyId: newStudy.id,
          text: q.text,
          type: q.type,
          required: q.required,
          isSkippable: q.isSkippable,
          preferNotToAnswerEnabled: q.preferNotToAnswerEnabled,
          order: i + 1,
          scaleMin: q.scaleMin,
          scaleMinLabel: q.scaleMinLabel,
          scaleMax: q.scaleMax,
          scaleMaxLabel: q.scaleMaxLabel,
        },
      });

      // Copy options if applicable
      if (q.options && q.options.length > 0) {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          // Shorten option label if too long
          const trimmedText = opt.text.length > FEATURES.TINTOK_MAX_OPTION_TEXT_LENGTH
            ? `${opt.text.slice(0, FEATURES.TINTOK_MAX_OPTION_TEXT_LENGTH - 3)}...`
            : opt.text;

          await tx.questionOption.create({
            data: {
              questionId: newQuestion.id,
              text: trimmedText,
              value: opt.value || trimmedText,
              order: j + 1,
            },
          });
        }
      }
    }

    // Generate independent ConsentForm from the Tintok micro-study template
    const consentTemplate = generateTintokConsentTemplate(
      newStudy.title,
      fundingType === StudyFundingType.FUNDED,
      rewardCredits
    );

    await tx.consentForm.create({
      data: {
        studyId: newStudy.id,
        version: 1,
        fullText: consentTemplate.fullText,
        keyInformation: consentTemplate.keyInformation,
        language: "en",
      },
    });

    // Audit Log Entry
    await logActivity({
      userId,
      action: "STUDY_TINTOK_VERSION_CREATED",
      description: `Created Tintok micro-study version "${newStudy.title}" (ID: ${newStudy.id}) from parent study "${parent.title}" (ID: ${parent.id}). Copied ${questionsToCopy.length} questions, skipped ${finalSkippedQuestions.length}.`,
      resourceId: newStudy.id,
      resourceType: "Study",
      metadata: {
        parentStudyId: parent.id,
        tintokStudyId: newStudy.id,
        copiedCount: questionsToCopy.length,
        skippedCount: finalSkippedQuestions.length,
        copiedQuestionIds: targetQuestionIds,
        skippedQuestionIds: finalSkippedQuestions.map((s) => s.questionId),
      },
    });

    return newStudy;
  });

  return {
    parentStudyId: parent.id,
    tintokStudyId: result.id,
    copiedCount: questionsToCopy.length,
    skippedCount: finalSkippedQuestions.length,
    copiedQuestions: finalCopiedQuestions,
    skippedQuestions: finalSkippedQuestions,
  };
}
