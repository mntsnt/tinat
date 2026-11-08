import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authGuard";
import { checkRateLimit } from "@/lib/rateLimit";
import { jsonError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { executeBalancedReward } from "@/lib/ledger";
import { CREDITS_DISCLAIMER } from "@/lib/config/features";
import { getOrCreateParticipantLink, hasUserParticipated, isCrossModeExcluded } from "@/lib/identity/linkService";
import { checkPlatformConsent } from "@/lib/legal/consentService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["PARTICIPANT"], request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const rateCheck = checkRateLimit(request, "SUBMISSION", user.id);
    if (!rateCheck.allowed) return rateCheck.response;

    if (!user.isVerified) {
      return NextResponse.json(
        {
          error: "Please verify your email address before participating in research studies.",
        },
        { status: 403 }
      );
    }

    const consentCheck = await checkPlatformConsent(user.id);
    if (!consentCheck.hasValidConsent) {
      return NextResponse.json(
        {
          error: "You must review and accept the latest platform legal agreements before participating in research studies.",
          code: "PLATFORM_AGREEMENT_REQUIRED",
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
    // 7. Check remaining budget (FREE vs FUNDED)
    const isFundedStudy = study.fundingType === "FUNDED" || (study.rewardCredits > 0 && study.fundingType !== "FREE");
    const rewardPerResponse = isFundedStudy ? (study.creditPerResponse || study.rewardCredits) : 0;
    const currentBudget = isFundedStudy ? (study.creditBudget || study.budgetCredits) : 0;
    const currentSpent = isFundedStudy ? (study.creditsSpent || study.creditsPaid) : 0;
    const remainingCredits = currentBudget - currentSpent;

    if (isFundedStudy && rewardPerResponse > 0 && remainingCredits < rewardPerResponse) {
      // Pause study automatically per business rules
      await prisma.study.update({
        where: { id: study.id },
        data: { status: "PAUSED" },
      });

      return NextResponse.json(
        {
          error: "This research study has reached its credit budget and is paused. You can switch to voluntary participation (Free) to continue collecting responses.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 8. Read answers
    // ---------------------------------------------

    const body = await request.json();
    const answers = body?.answers;
    const responseLanguage = typeof body?.language === "string" ? body.language.slice(0, 10) : "en";

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

      // Participant Safety: Allow skipping questions when prefer not to answer is selected
      if (answer === "__PREFER_NOT_TO_ANSWER__") {
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
        const validRows = question.rows.map((r) => r.value);
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
        const validRows = question.rows.map((r) => r.value);
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
        // Check duplicate submission via LinkService
        const alreadyParticipated = await hasUserParticipated({
          userId: user.id,
          studyId,
          tx,
        });

        if (alreadyParticipated) {
          throw new Error("ALREADY_COMPLETED");
        }

        // Check cross-mode participation exclusion
        const crossModeCheck = await isCrossModeExcluded({
          userId: user.id,
          studyId,
          tx,
        });

        if (crossModeCheck.excluded) {
          throw new Error(crossModeCheck.reason || "CROSS_MODE_EXCLUDED");
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
        const isFundedInTx = currentStudy.fundingType === "FUNDED" || (currentStudy.rewardCredits > 0 && currentStudy.fundingType !== "FREE");
        const rewardAmount = isFundedInTx ? (currentStudy.creditPerResponse || currentStudy.rewardCredits) : 0;
        const budgetTotal = isFundedInTx ? (currentStudy.creditBudget || currentStudy.budgetCredits) : 0;
        const spentTotal = isFundedInTx ? (currentStudy.creditsSpent || currentStudy.creditsPaid) : 0;
        const remainingInTx = budgetTotal - spentTotal;

        if (isFundedInTx && rewardAmount > 0 && remainingInTx < rewardAmount) {
          await tx.study.update({
            where: { id: currentStudy.id },
            data: { status: "PAUSED" },
          });
          throw new Error("BUDGET_EXCEEDED");
        }

        // -----------------------------------------
        // Create response
        // -----------------------------------------

        // Generate or fetch unguessable random respondentCode
        const { respondentCode } = await getOrCreateParticipantLink({
          userId: user.id,
          studyId,
          tx,
        });

        const response =
          await tx.response.create({
            data: {
              studyId,
              respondentCode,
              language: responseLanguage,
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

          if (answer === "__PREFER_NOT_TO_ANSWER__") {
            await tx.answer.create({
              data: {
                responseId: response.id,
                questionId: question.id,
                textValue: "PREFER_NOT_TO_ANSWER",
              },
            });
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
                  typeof answer === "object"
                    ? JSON.stringify(answer)
                    : String(answer),
              },
            });
          }
        }

        // -----------------------------------------
        // Balanced double-entry credit issuance
        // -----------------------------------------

        let finalBalance = 0;

        if (isFundedInTx && rewardAmount > 0) {
          const rewardResult = await executeBalancedReward({
            studyId,
            participantId: user.id,
            responseId: response.id,
            amount: rewardAmount,
            studyTitle: currentStudy.title,
            tx,
          });

          finalBalance = rewardResult?.newBalance ?? 0;
        } else {
          // If free study, fetch current balance without modifying
          const userWallet = await tx.wallet.findUnique({
            where: { userId: user.id }
          });
          finalBalance = userWallet?.balance ?? 0;
        }

        // -----------------------------------------
        // Update study funding and completion
        // -----------------------------------------

        const newCreditsSpent = spentTotal + rewardAmount;
        const newResponseCount = currentStudy._count.responses + 1;
        const targetReached = currentStudy.participantTarget > 0 && newResponseCount >= currentStudy.participantTarget;
        const budgetReached = isFundedInTx && budgetTotal > 0 && newCreditsSpent >= budgetTotal;

        await tx.study.update({
          where: { id: studyId },
          data: {
            creditsSpent: newCreditsSpent,
            creditsPaid: newCreditsSpent,
            status: targetReached
              ? "COMPLETED"
              : budgetReached
              ? "PAUSED"
              : "ACTIVE",
          },
        });

        return {
          balance: finalBalance,
          creditsEarned: rewardAmount,
          studyCompleted: targetReached,
          budgetReached,
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
      (error.message.includes("CROSS_MODE_EXCLUDED") ||
        error.message.includes("answering modes"))
    ) {
      return NextResponse.json(
        {
          error: error.message.replace(/^CROSS_MODE_EXCLUDED:\s*/, ""),
          code: "CROSS_MODE_EXCLUDED",
        },
        { status: 400 }
      );
    }

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
          error: "This research study has reached its credit budget and is paused. You can switch to voluntary participation (Free) to continue collecting responses.",
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