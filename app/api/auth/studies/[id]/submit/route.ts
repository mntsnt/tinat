import { NextResponse } from "next/server";
import { getSession } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prisma";
import { logActivity } from "../../../../../../lib/activityLog";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ---------------------------------------------
    // 1. Authentication
    // ---------------------------------------------

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // ---------------------------------------------
    // 2. Make sure user is a participant
    // ---------------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!user || user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          error: "Only participants can submit research.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------
    // 3. Get study ID
    // ---------------------------------------------

    const { id: studyId } = await params;

    // ---------------------------------------------
    // 4. Load study
    // ---------------------------------------------

    const study = await prisma.study.findUnique({
      where: {
        id: studyId,
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
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    if (!study) {
      return NextResponse.json(
        { error: "Research study not found." },
        { status: 404 }
      );
    }

    // ---------------------------------------------
    // 5. Study must be active
    // ---------------------------------------------

    if (study.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "This research study is not currently available.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 6. Check participant target
    // ---------------------------------------------

    if (
      study.participantTarget > 0 &&
      study._count.responses >= study.participantTarget
    ) {
      // Automatically complete the study
      await prisma.study.update({
        where: {
          id: study.id,
        },
        data: {
          status: "COMPLETED",
        },
      });

      return NextResponse.json(
        {
          error:
            "This research study has reached its participant limit.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 7. Check remaining budget
    // ---------------------------------------------

    const remainingCredits =
      study.budgetCredits - study.creditsPaid;

    if (remainingCredits < study.rewardCredits) {
      await prisma.study.update({
        where: {
          id: study.id,
        },
        data: {
          status: "COMPLETED",
        },
      });

      return NextResponse.json(
        {
          error:
            "This research study has no remaining funding.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 8. Read answers
    // ---------------------------------------------

    const body = await request.json();
    const answers = body?.answers;

    if (
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers)
    ) {
      return NextResponse.json(
        { error: "Invalid answers." },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 9. Validate required questions
    // ---------------------------------------------

    for (const question of study.questions) {
      const answer = answers[question.id];

      if (!question.required) {
        continue;
      }

      const empty =
        answer === undefined ||
        answer === null ||
        answer === "" ||
        (Array.isArray(answer) && answer.length === 0) ||
        (typeof answer === "object" && !Array.isArray(answer) && Object.keys(answer).length === 0);

      if (empty) {
        return NextResponse.json(
          {
            error: `Please answer: ${question.text}`,
          },
          { status: 400 }
        );
      }
    }

    // ---------------------------------------------
    // 10. Validate answer types
    // ---------------------------------------------

    for (const question of study.questions) {
      const answer = answers[question.id];

      if (
        answer === undefined ||
        answer === null ||
        answer === ""
      ) {
        continue;
      }

      // NUMBER
      if (question.type === "NUMBER") {
        const number = Number(answer);
        if (!Number.isFinite(number)) return NextResponse.json({ error: `"${question.text}" must be a valid number.` }, { status: 400 });
      }

      // YES / NO
      if (question.type === "YES_NO") {
        if (answer !== "Yes" && answer !== "No") return NextResponse.json({ error: `Invalid answer for "${question.text}".` }, { status: 400 });
      }

      // SINGLE CHOICE & DROPDOWN
      if (question.type === "SINGLE_CHOICE" || question.type === "DROPDOWN") {
        const validValues = question.options.map((o) => o.value);
        if (typeof answer !== "string" || !validValues.includes(answer)) {
          return NextResponse.json({ error: `Invalid choice for "${question.text}".` }, { status: 400 });
        }
      }

      // MULTIPLE CHOICE
      if (question.type === "MULTIPLE_CHOICE") {
        if (!Array.isArray(answer)) return NextResponse.json({ error: `Invalid choices for "${question.text}".` }, { status: 400 });
        const validValues = question.options.map((o) => o.value);
        if (!answer.every((v) => typeof v === "string" && validValues.includes(v))) {
          return NextResponse.json({ error: `Invalid choices for "${question.text}".` }, { status: 400 });
        }
      }

      // DATE
      if (question.type === "DATE") {
        if (typeof answer !== "string" || Number.isNaN(Date.parse(answer))) {
          return NextResponse.json({ error: `Invalid date for "${question.text}".` }, { status: 400 });
        }
      }
      
      // TIME
      if (question.type === "TIME") {
        if (typeof answer !== "string" || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(answer)) {
          return NextResponse.json({ error: `Invalid time for "${question.text}".` }, { status: 400 });
        }
      }

      // LINEAR SCALE
      if (question.type === "LINEAR_SCALE") {
        const num = Number(answer);
        if (!Number.isInteger(num) || num < (question.scaleMin || 1) || num > (question.scaleMax || 5)) {
          return NextResponse.json({ error: `Invalid scale value for "${question.text}".` }, { status: 400 });
        }
      }

      // FILE UPLOAD (Mock validation)
      if (question.type === "FILE_UPLOAD") {
        if (typeof answer !== "string" || !answer.startsWith("pending_upload_url/")) {
          return NextResponse.json({ error: `Invalid file upload for "${question.text}".` }, { status: 400 });
        }
      }

      // MULTIPLE CHOICE GRID
      if (question.type === "MULTIPLE_CHOICE_GRID") {
        if (typeof answer !== "object" || Array.isArray(answer)) return NextResponse.json({ error: `Invalid grid for "${question.text}".` }, { status: 400 });
        const validRows = (question.rows as any[]).map(r => r.value);
        const validCols = question.options.map(o => o.value);
        for (const [row, col] of Object.entries(answer as Record<string, string>)) {
          if (!validRows.includes(row) || !validCols.includes(col)) {
            return NextResponse.json({ error: `Invalid grid selection for "${question.text}".` }, { status: 400 });
          }
        }
      }

      // CHECKBOX GRID
      if (question.type === "CHECKBOX_GRID") {
        if (typeof answer !== "object" || Array.isArray(answer)) return NextResponse.json({ error: `Invalid grid for "${question.text}".` }, { status: 400 });
        const validRows = (question.rows as any[]).map(r => r.value);
        const validCols = question.options.map(o => o.value);
        for (const [row, cols] of Object.entries(answer as Record<string, string[]>)) {
          if (!validRows.includes(row) || !Array.isArray(cols) || !cols.every(c => validCols.includes(c))) {
            return NextResponse.json({ error: `Invalid grid selection for "${question.text}".` }, { status: 400 });
          }
        }
      }
    }

    // ---------------------------------------------
    // 11. Create response + answers + credit
    //     inside ONE transaction
    // ---------------------------------------------

    const result = await prisma.$transaction(
      async (tx) => {
        // Check duplicate submission again
        const existingResponse =
          await tx.response.findUnique({
            where: {
              studyId_participantId: {
                studyId,
                participantId: user.id,
              },
            },
          });

        if (existingResponse) {
          throw new Error("ALREADY_COMPLETED");
        }

        // Get current study state again
        const currentStudy =
          await tx.study.findUnique({
            where: {
              id: studyId,
            },
            include: {
              _count: {
                select: {
                  responses: true,
                },
              },
            },
          });

        if (!currentStudy) {
          throw new Error("STUDY_NOT_FOUND");
        }

        if (currentStudy.status !== "ACTIVE") {
          throw new Error("STUDY_NOT_ACTIVE");
        }

        // Check participant limit inside transaction
        if (
          currentStudy.participantTarget > 0 &&
          currentStudy._count.responses >=
            currentStudy.participantTarget
        ) {
          throw new Error("PARTICIPANT_LIMIT");
        }

        // Check funding inside transaction
        const remaining =
          currentStudy.budgetCredits -
          currentStudy.creditsPaid;

        if (
          currentStudy.rewardCredits > remaining
        ) {
          throw new Error("BUDGET_EXCEEDED");
        }

        // -----------------------------------------
        // Create response
        // -----------------------------------------

        const response =
          await tx.response.create({
            data: {
              studyId,
              participantId: user.id,
            },
          });

        // -----------------------------------------
        // Save answers
        // -----------------------------------------

        for (const question of study.questions) {
          const answer =
            answers[question.id];

          if (
            answer === undefined ||
            answer === null ||
            answer === ""
          ) {
            continue;
          }

          if (question.type === "NUMBER") {
            await tx.answer.create({
              data: {
                responseId: response.id,
                questionId: question.id,
                numberValue: Number(answer),
              },
            });
          } else {
            await tx.answer.create({
              data: {
                responseId: response.id,
                questionId: question.id,
                textValue:
                  Array.isArray(answer)
                    ? JSON.stringify(answer)
                    : String(answer),
              },
            });
          }
        }

        // -----------------------------------------
        // Get/create wallet and conditionally award credits
        // -----------------------------------------

        const wallet =
          await tx.wallet.upsert({
            where: {
              userId: user.id,
            },
            update: {},
            create: {
              userId: user.id,
              balance: 0,
            },
          });

        let currentBalance = wallet.balance;

        if (currentStudy.rewardCredits > 0) {
          const updatedWallet = await tx.wallet.update({
            where: {
              userId: user.id,
            },
            data: {
              balance: {
                increment: currentStudy.rewardCredits,
              },
            },
          });
          currentBalance = updatedWallet.balance;

          await tx.tinatCreditTransaction.create({
            data: {
              walletId: wallet.id,
              amount: currentStudy.rewardCredits,
              type: "EARN",
              reason: `Completed health research study: ${currentStudy.title}`,
            },
          });
        }

        // -----------------------------------------
        // Update study funding and completion
        // -----------------------------------------

        const newCreditsPaid =
          currentStudy.creditsPaid +
          currentStudy.rewardCredits;

        const newResponseCount =
          currentStudy._count.responses + 1;

        const targetReached =
          currentStudy.participantTarget > 0 &&
          newResponseCount >=
            currentStudy.participantTarget;

        const budgetReached =
          currentStudy.budgetCredits > 0 &&
          newCreditsPaid >=
            currentStudy.budgetCredits;

        await tx.study.update({
          where: {
            id: studyId,
          },
          data: {
            creditsPaid: newCreditsPaid,

            status:
              targetReached || budgetReached
                ? "COMPLETED"
                : "ACTIVE",
          },
        });

        return {
          balance: currentBalance,

          creditsEarned:
            currentStudy.rewardCredits,

          studyCompleted:
            targetReached || budgetReached,
        };
      }
    );

    // ---------------------------------------------
    // 12. Success
    // ---------------------------------------------

    await logActivity({
      userId: user.id,
      action: "STUDY_SUBMITTED",
      description: `Participant submitted responses for study ${studyId}`,
      resourceId: studyId,
      resourceType: "Study",
    });

    return NextResponse.json({
      message:
        "Research completed successfully.",

      creditsEarned:
        result.creditsEarned,

      newBalance:
        result.balance,

      studyCompleted:
        result.studyCompleted,
    });
  } catch (error) {
    // ---------------------------------------------
    // Known errors
    // ---------------------------------------------

    if (
      error instanceof Error &&
      error.message === "ALREADY_COMPLETED"
    ) {
      return NextResponse.json(
        {
          error:
            "You have already completed this study.",
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "STUDY_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error: "Research study not found.",
        },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "STUDY_NOT_ACTIVE"
    ) {
      return NextResponse.json(
        {
          error:
            "This research study is no longer active.",
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "PARTICIPANT_LIMIT"
    ) {
      return NextResponse.json(
        {
          error:
            "This research study has reached its participant limit.",
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "BUDGET_EXCEEDED"
    ) {
      return NextResponse.json(
        {
          error:
            "This research study has insufficient remaining funding.",
        },
        { status: 400 }
      );
    }

    console.error(
      "Study submission error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to submit research response.",
      },
      { status: 500 }
    );
  }
}