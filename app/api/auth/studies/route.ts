import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { QuestionType } from "../../../../generated/prisma/client";
import { logActivity } from "../../../../lib/activityLog";

/*
|--------------------------------------------------------------------------
| GET /api/auth/studies
|--------------------------------------------------------------------------
| Returns ACTIVE studies for participants.
*/
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

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
    /*
    |--------------------------------------------------------------------------
    | 1. Authentication
    |--------------------------------------------------------------------------
    */

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Get researcher
    |--------------------------------------------------------------------------
    */

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!user || user.role !== "RESEARCHER") {
      return NextResponse.json(
        {
          error: "Only researchers can create studies.",
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
      studyType = "FUNDED",
      category,
      objective,
      targetPopulation,
      estimatedMinutes,
      rewardCredits = 0,
      participantTarget,
      budgetCredits,
      questions,
      publishImmediately = false,
    } = body;

    const isFreeDataCollection = studyType === "FREE_DATA_COLLECTION" || rewardCredits === 0;

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

    let finalRewardCredits = 0;
    let finalBudgetCredits = 0;
    const finalStudyType = isFreeDataCollection ? "FREE_DATA_COLLECTION" : "FUNDED";

    if (!isFreeDataCollection) {
      if (!Number.isInteger(rewardCredits) || rewardCredits <= 0) {
        return NextResponse.json(
          {
            error: "Funded research requires a reward of at least 1 TC per participant.",
          },
          { status: 400 }
        );
      }

      finalRewardCredits = rewardCredits;
      const calculatedBudget = finalRewardCredits * parsedParticipantTarget;
      finalBudgetCredits =
        budgetCredits === undefined || budgetCredits === null || budgetCredits === ""
          ? calculatedBudget
          : Number(budgetCredits);

      if (parsedParticipantTarget > 0 && finalBudgetCredits < calculatedBudget) {
        return NextResponse.json(
          {
            error: "Budget is not enough to pay all participants.",
          },
          { status: 400 }
        );
      }
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
    const initialStatus = isFreeDataCollection && publishImmediately ? "ACTIVE" : "DRAFT";

    const study = await prisma.study.create({
      data: {
        title: title.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        status: initialStatus,
        studyType: finalStudyType,
        category: healthCategory,
        objective: typeof objective === "string" && objective.trim() ? objective.trim() : null,
        targetPopulation: typeof targetPopulation === "string" && targetPopulation.trim() ? targetPopulation.trim() : null,
        estimatedMinutes: Number(estimatedMinutes) > 0 ? Number(estimatedMinutes) : 5,
        tags: [healthCategory, isFreeDataCollection ? "Open Data Collection" : "Funded Research"],
        rewardCredits: finalRewardCredits,
        participantTarget: parsedParticipantTarget,
        budgetCredits: finalBudgetCredits,
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