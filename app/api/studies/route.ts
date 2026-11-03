import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activityLog";
import { isStudyBannerTheme } from "@/lib/studyBanners";
import { FEATURES, CREDITS_DISCLAIMER } from "@/lib/config/features";
import { checkResearcherAgreements } from "@/lib/governance/policies";

/*
|--------------------------------------------------------------------------
| GET /api/auth/studies
|--------------------------------------------------------------------------
| Returns ACTIVE studies for participants.
*/
export async function GET(request?: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;
/*
    |--------------------------------------------------------------------------
    | Participant studies
    |--------------------------------------------------------------------------
    */

    if (user.role === "PARTICIPANT") {
      const studies = await prisma.study.findMany({
        where: {
          status: "ACTIVE",
        },

        include: {
          researcher: {
            select: {
              name: true,
            },
          },

          _count: {
            select: {
              questions: true,
              responses: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        studies,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Researcher studies
    |--------------------------------------------------------------------------
    */

    if (user.role === "RESEARCHER") {
      const studies = await prisma.study.findMany({
        where: {
          researcherId: user.id,
        },

        include: {
          _count: {
            select: {
              questions: true,
              responses: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        studies,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */

    if (user.role === "ADMIN") {
      const studies = await prisma.study.findMany({
        include: {
          researcher: {
            select: {
              name: true,
              email: true,
            },
          },

          _count: {
            select: {
              questions: true,
              responses: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        studies,
      });
    }

    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 403 }
    );
  } catch (error) {
    console.error("Get studies error:", error);

    return NextResponse.json(
      { error: "Failed to load studies." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/auth/studies
|--------------------------------------------------------------------------
| Creates a new research study.
|
| IMPORTANT:
| A newly created study starts as DRAFT.
| The researcher must fund it through Chapa before
| the callback changes it to ACTIVE.
|--------------------------------------------------------------------------
*/

export async function POST(request: Request) {
  try {
    const auth = await requireRole(["RESEARCHER", "ADMIN"], request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    if (!user.isVerified) {
      return NextResponse.json(
        {
          error: "Please verify your email address before creating studies.",
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Read request body
    |--------------------------------------------------------------------------
    */

    const body = await request.json();

    const {
      title,
      description,
      bannerTheme = "canopy",
      fundingType,
      creditPerResponse,
      creditBudget,
      studyType = "FUNDED",
      category,
      objective,
      targetPopulation,
      populationDescription,
      recruitmentMethod,
      containsSensitiveTopics = false,
      involvesMinors = false,
      safetyProtocolText,
      estimatedMinutes,
      rewardCredits = 0,
      participantTarget,
      budgetCredits,
      questions,
      publishImmediately = false,
    } = body;

    // Prohibited Topic: Studies involving minors are blocked
    if (involvesMinors) {
      return NextResponse.json(
        { error: "Studies involving minors are not yet supported on Tinat." },
        { status: 400 }
      );
    }

    // Extra-Review Topic: Sensitive studies require safety/distress protocol
    if (containsSensitiveTopics && (!safetyProtocolText || !safetyProtocolText.trim())) {
      return NextResponse.json(
        { error: "A safety protocol (including support helplines) is required when research involves sensitive topics." },
        { status: 400 }
      );
    }

    // Governance: Researchers must accept Code of Conduct and DPA before creating studies
    const agreements = checkResearcherAgreements(user);
    if (!agreements.canCreateStudy && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: `You must accept the ${agreements.missing.join(" and ")} before creating studies on Tinat. Please review and accept them at /code-of-conduct and /dpa.`,
        },
        { status: 403 }
      );
    }

    if (!isStudyBannerTheme(bannerTheme)) {
      return NextResponse.json(
        { error: "Choose a valid study banner." },
        { status: 400 }
      );
    }

    const isFreeDataCollection = studyType === "FREE_DATA_COLLECTION" || rewardCredits === 0;

    /*
    |--------------------------------------------------------------------------
    | Fayda Verification Check
    |--------------------------------------------------------------------------
    | Researchers are required to verify themselves with their Ethiopian Fayda
    | National ID before publishing a research study.
    */
    if (publishImmediately && !user.faydaVerified) {
      return NextResponse.json(
        {
          error:
            "You must complete identity verification with your Ethiopian Fayda National ID before publishing a research study. Please verify in Settings.",
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Validate title
    |--------------------------------------------------------------------------
    */

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        {
          error: "Study title is required.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Validate reward & budget based on study type
    |--------------------------------------------------------------------------
    */

    const parsedParticipantTarget =
      participantTarget === undefined ||
      participantTarget === null ||
      participantTarget === ""
        ? 0
        : Number(participantTarget);

    if (
      !Number.isInteger(parsedParticipantTarget) ||
      parsedParticipantTarget < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Participant target must be a valid non-negative integer.",
        },
        { status: 400 }
      );
    }

    const isFree = isFreeDataCollection || fundingType === "FREE";
    const finalFundingType = isFree ? "FREE" : "FUNDED";
    const finalStudyType = isFree ? "FREE_DATA_COLLECTION" : "FUNDED";
    let finalCreditPerResponse = 0;
    let finalCreditBudget = 0;

    if (!isFree) {
      const perResp = Number(creditPerResponse || rewardCredits || 0);
      if (!Number.isInteger(perResp) || perResp <= 0) {
        return NextResponse.json(
          {
            error: "Funded research requires a reward of at least 1 TC per participant.",
          },
          { status: 400 }
        );
      }

      if (perResp > FEATURES.MAX_CREDITS_PER_RESPONSE) {
        return NextResponse.json(
          {
            error: `Reward cannot exceed the maximum limit of ${FEATURES.MAX_CREDITS_PER_RESPONSE} TC per participant.`,
          },
          { status: 400 }
        );
      }

      finalCreditPerResponse = perResp;
      const calculatedBudget = finalCreditPerResponse * parsedParticipantTarget;
      const reqBudget = creditBudget !== undefined && creditBudget !== null && creditBudget !== ""
        ? Number(creditBudget)
        : (budgetCredits !== undefined && budgetCredits !== null && budgetCredits !== "" ? Number(budgetCredits) : calculatedBudget);

      if (!Number.isInteger(reqBudget) || reqBudget < finalCreditPerResponse) {
        return NextResponse.json(
          {
            error: "Credit budget must be greater than or equal to credit per response.",
          },
          { status: 400 }
        );
      }

      if (reqBudget > FEATURES.MAX_CREDIT_BUDGET_PER_STUDY) {
        return NextResponse.json(
          {
            error: `Credit budget cannot exceed the maximum platform limit of ${FEATURES.MAX_CREDIT_BUDGET_PER_STUDY} TC.`,
          },
          { status: 400 }
        );
      }

      finalCreditBudget = reqBudget;
    }

    /*
    |--------------------------------------------------------------------------
    | 9. Validate questions
    |--------------------------------------------------------------------------
    */

    if (
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Add at least one question.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 10. Validate each question
    |--------------------------------------------------------------------------
    */

    for (const question of questions) {
      if (
        !question ||
        typeof question !== "object"
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid question data.",
          },
          { status: 400 }
        );
      }

      if (
        typeof question.text !== "string" ||
        !question.text.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "Every question needs text.",
          },
          { status: 400 }
        );
      }

      if (
        !Object.values(QuestionType).includes(
          question.type
        )
      ) {
        return NextResponse.json(
          {
            error:
              `Invalid question type: ${question.type}`,
          },
          { status: 400 }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Choice questions require options
      |--------------------------------------------------------------------------
      */

      if (
        question.type === "SINGLE_CHOICE" ||
        question.type === "MULTIPLE_CHOICE" ||
        question.type === "DROPDOWN" ||
        question.type === "MULTIPLE_CHOICE_GRID" ||
        question.type === "CHECKBOX_GRID"
      ) {
        if (
          !Array.isArray(question.options) ||
          question.options.length === 0
        ) {
          return NextResponse.json(
            {
              error:
                `Question "${question.text}" needs at least one option.`,
            },
            { status: 400 }
          );
        }

        for (const option of question.options) {
          if (
            typeof option !== "string" ||
            !option.trim()
          ) {
            return NextResponse.json(
              {
                error:
                  `Every option in "${question.text}" must have text.`,
              },
              { status: 400 }
            );
          }
        }
      }

      if (
        question.type === "MULTIPLE_CHOICE_GRID" ||
        question.type === "CHECKBOX_GRID"
      ) {
        if (!Array.isArray(question.rows) || question.rows.length === 0) {
          return NextResponse.json(
            { error: `Question "${question.text}" needs at least one row.` },
            { status: 400 }
          );
        }

        for (const row of question.rows) {
          if (typeof row !== "string" || !row.trim()) {
            return NextResponse.json(
              { error: `Every row in "${question.text}" must have text.` },
              { status: 400 }
            );
          }
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 11. Create study
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Status is DRAFT.
    |
    | After Chapa payment succeeds, the callback route
    | changes this to ACTIVE.
    |--------------------------------------------------------------------------
    */

    const healthCategory = typeof category === "string" && category.trim() ? category.trim() : "Other Health Research";
    // Funded studies require admin approval to activate; Free studies with verified Fayda can publish immediately
    // Studies require verified ethics approval or admin exemption to become ACTIVE
    const initialStatus = "DRAFT";

    const study = await prisma.study.create({
      data: {
        title: title.trim(),
        bannerTheme,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        status: initialStatus,
        fundingType: finalFundingType,
        creditPerResponse: finalCreditPerResponse,
        creditBudget: finalCreditBudget,
        creditsSpent: 0,
        requiresReapproval: false,
        studyType: finalStudyType,
        category: healthCategory,
        objective: typeof objective === "string" && objective.trim() ? objective.trim() : null,
        targetPopulation: typeof targetPopulation === "string" && targetPopulation.trim() ? targetPopulation.trim() : null,
        populationDescription: typeof populationDescription === "string" && populationDescription.trim() ? populationDescription.trim() : (typeof targetPopulation === "string" ? targetPopulation.trim() : "General adult cohort"),
        recruitmentMethod: typeof recruitmentMethod === "string" && recruitmentMethod.trim() ? recruitmentMethod.trim() : "Tinat verified cohort",
        containsSensitiveTopics: Boolean(containsSensitiveTopics),
        involvesMinors: false,
        safetyProtocolText: typeof safetyProtocolText === "string" && safetyProtocolText.trim() ? safetyProtocolText.trim() : null,
        estimatedMinutes: Number(estimatedMinutes) > 0 ? Number(estimatedMinutes) : 5,
        tags: [healthCategory, isFree ? "Open Data Collection" : "Funded Research"],
        rewardCredits: finalCreditPerResponse,
        participantTarget: parsedParticipantTarget,
        budgetCredits: finalCreditBudget,
        creditsPaid: 0,
        researcherId: user.id,

    questions: {
      create: questions.map(
        (
          question: {
            text: string;
            type: string;
            required?: boolean;
            options?: string[];
            rows?: string[];
            scaleMin?: number;
            scaleMax?: number;
            scaleMinLabel?: string;
            scaleMaxLabel?: string;
          },
          index: number
        ) => ({
          text: question.text.trim(),
          type: question.type as QuestionType,
          required: question.required ?? true,
          order: index,
          
          scaleMin: question.scaleMin,
          scaleMax: question.scaleMax,
          scaleMinLabel: question.scaleMinLabel,
          scaleMaxLabel: question.scaleMaxLabel,

          options: {
            create: Array.isArray(question.options)
              ? question.options.map((option, optionIndex) => ({
                  text: option.trim(),
                  value: option.trim(),
                  order: optionIndex,
                }))
              : [],
          },
          rows: {
            create: Array.isArray(question.rows)
              ? question.rows.map((row, rowIndex) => ({
                  text: row.trim(),
                  value: row.trim(),
                  order: rowIndex,
                }))
              : [],
          },
        })
      ),
    },
  },

  include: {
    questions: {
      include: {
        options: true,
        rows: true,
      },
      orderBy: {
        order: "asc",
      },
    },
  },
});

await logActivity({
  userId: user.id,
  action: "STUDY_CREATED",
  description: `Study "${title.trim()}" created`,
  resourceId: study.id,
  resourceType: "Study",
});

return NextResponse.json(
  {
    message:
      "Research study created successfully.",

    study,
  },
  { status: 201 }
);
  } catch (error) {
    console.error(
      "Study creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create research study.",
      },
      { status: 500 }
    );
  }
}