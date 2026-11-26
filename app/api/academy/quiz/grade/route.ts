import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAcademyAccess } from "@/lib/academy/access";
import { getModuleBySlug } from "@/lib/academy/content";

export async function POST(req: NextRequest) {
  try {
    const { session, user } = await getAcademyAccess();
    if (!session?.userId) {
      return NextResponse.json({ error: "Sign in to access the Academy" }, { status: 401 });
    }
    if (user?.role !== "RESEARCHER" || !user.isVerified) {
      return NextResponse.json({ error: "Researcher access required" }, { status: 403 });
    }

    const body = await req.json();
    const { moduleSlug, answers } = body as {
      moduleSlug: string;
      answers: Record<string, any>;
    };

    if (!moduleSlug || !answers) {
      return NextResponse.json({ error: "Missing moduleSlug or answers payload" }, { status: 400 });
    }

    const academyModule = getModuleBySlug(moduleSlug);
    if (!academyModule || !academyModule.quiz) {
      return NextResponse.json({ error: "Quiz not found for this module" }, { status: 404 });
    }

    const questionBank = academyModule.quiz.questionBank;
    let correctCount = 0;
    const totalQuestions = Object.keys(answers).length;

    const feedback: Record<
      string,
      { isCorrect: boolean; explanation: string; correctValue?: any }
    > = {};

    for (const [qId, userAnswer] of Object.entries(answers)) {
      const q = questionBank.find((item) => item.id === qId);
      if (!q) continue;

      let isQuestionCorrect = false;

      if (
        q.type === "single-choice" ||
        q.type === "true-false-justification" ||
        q.type === "scenario" ||
        q.type === "critical-appraisal"
      ) {
        const correctOpt = q.options?.find((o) => o.isCorrect);
        isQuestionCorrect = correctOpt ? correctOpt.id === userAnswer : false;
      } else if (q.type === "multiple-select") {
        const correctOptIds = q.options?.filter((o) => o.isCorrect).map((o) => o.id).sort() || [];
        const userOptIds = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
        isQuestionCorrect =
          correctOptIds.length === userOptIds.length &&
          correctOptIds.every((id, idx) => id === userOptIds[idx]);
      } else if (q.type === "numeric") {
        const numVal = Number(userAnswer);
        if (Number.isFinite(numVal) && q.targetNumericValue !== undefined) {
          const tol = q.numericTolerance ?? 0.05;
          isQuestionCorrect = Math.abs(numVal - q.targetNumericValue) <= tol;
        }
      } else if (q.type === "fill-blank") {
        const cleaned = String(userAnswer || "").trim().toLowerCase();
        isQuestionCorrect = (q.acceptedBlanks || []).some(
          (b) => b.trim().toLowerCase() === cleaned
        );
      }

      if (isQuestionCorrect) {
        correctCount++;
      }

      feedback[qId] = {
        isCorrect: isQuestionCorrect,
        explanation: q.explanation,
      };
    }

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= academyModule.quiz.passPercentage;

    await prisma.academyQuizAttempt.create({
      data: {
        userId: session.userId,
        moduleSlug,
        score,
        totalQuestions,
        correctCount,
        passed,
        answersPayload: { answers, feedback },
      },
    });

    return NextResponse.json({
      moduleSlug,
      score,
      totalQuestions,
      correctCount,
      passed,
      passPercentage: academyModule.quiz.passPercentage,
      feedback,
    });
  } catch (err: any) {
    console.error("Quiz grading error:", err);
    return NextResponse.json({ error: "Failed to grade quiz" }, { status: 500 });
  }
}
