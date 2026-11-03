import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";
import { executeBalancedReward } from "@/lib/ledger";
import { getOrCreateParticipantLink } from "@/lib/identity/linkService";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { collectionMethod, answers, collectionSessionId, language } = await req.json();
    const responseLanguage = typeof language === "string" ? language.slice(0, 10) : "en";

    if (collectionMethod === "FIELD_COLLECTED") {
      // Verify data collector authorization
      const assignment = await prisma.studyDataCollector.findUnique({
        where: { studyId_userId: { studyId: id, userId: user.id } }
      });

      if (!assignment) {
        return NextResponse.json({ error: "Not assigned to this study as a data collector." }, { status: 403 });
      }

      // Coded participant placeholder per Ethiopian Data Protection Proclamation principles
      const anonParticipant = await prisma.user.create({
        data: {
          name: "Coded Participant",
          email: `anon-${Date.now()}-${Math.random().toString(36).substring(7)}@tinat.app`,
          passwordHash: "NONE",
          role: "PARTICIPANT"
        }
      });

      if (!answers || answers.length === 0) {
        console.warn(`Potential data-quality issue: Response submitted by collector ${user.id} with 0 answers.`);
      }

      let result;
      try {
        result = await prisma.$transaction(async (tx) => {
          // Lock/fetch study to check status and budget
          const currentStudy = await tx.study.findUnique({
            where: { id },
            include: { _count: { select: { responses: true } } }
          });

          if (!currentStudy) throw new Error("Study not found");
          if (currentStudy.status !== "ACTIVE") throw new Error("STUDY_NOT_ACTIVE");

          const isFunded = currentStudy.fundingType === "FUNDED" ||
            (currentStudy.rewardCredits > 0 && currentStudy.fundingType !== "FREE");

          const rewardAmount = isFunded
            ? (currentStudy.creditPerResponse || currentStudy.rewardCredits)
            : 0;

          const budgetTotal = isFunded
            ? (currentStudy.creditBudget || currentStudy.budgetCredits)
            : 0;

          const spentTotal = isFunded
            ? (currentStudy.creditsSpent || currentStudy.creditsPaid)
            : 0;

          if (isFunded && rewardAmount > 0) {
            const remaining = budgetTotal - spentTotal;
            if (remaining < rewardAmount) {
              // Pause study automatically
              await tx.study.update({
                where: { id },
                data: { status: "PAUSED" }
              });
              throw new Error("BUDGET_EXCEEDED");
            }
          }

          const { respondentCode } = await getOrCreateParticipantLink({
            userId: anonParticipant.id,
            studyId: id,
            tx,
          });

          const response = await tx.response.create({
            data: {
              studyId: id,
              respondentCode,
              language: responseLanguage,
              collectionMethod: "FIELD_COLLECTED",
              collectorId: user.id,
              collectionSessionId: collectionSessionId || undefined,
              answers: {
                create: answers
              }
            }
          });

          // Compensate the data collector via balanced double-entry ledger
          if (isFunded && rewardAmount > 0) {
            await executeBalancedReward({
              studyId: id,
              participantId: user.id,
              responseId: response.id,
              amount: rewardAmount,
              studyTitle: currentStudy.title,
              tx,
            });

            const newCreditsSpent = spentTotal + rewardAmount;
            const newResponseCount = currentStudy._count.responses + 1;
            const targetReached = currentStudy.participantTarget > 0 && newResponseCount >= currentStudy.participantTarget;
            const budgetReached = budgetTotal > 0 && newCreditsSpent >= budgetTotal;

            await tx.study.update({
              where: { id },
              data: {
                creditsSpent: newCreditsSpent,
                creditsPaid: newCreditsSpent,
                status: targetReached ? "COMPLETED" : budgetReached ? "PAUSED" : "ACTIVE"
              }
            });
          }

          return response;
        });
      } catch (err: any) {
        if (err.message === "BUDGET_EXCEEDED") {
          return NextResponse.json({
            error: "This research study has reached its credit budget and is paused. You can switch to voluntary participation (Free) to continue collecting responses."
          }, { status: 400 });
        }
        if (err.message === "STUDY_NOT_ACTIVE") {
          return NextResponse.json({ error: "This research study is not currently active." }, { status: 400 });
        }
        if (err.message === "Study not found") {
          return NextResponse.json({ error: "Study not found." }, { status: 404 });
        }
        throw err;
      }
      return NextResponse.json({ success: true, response: result });
    }

    return NextResponse.json({ error: "Invalid collection method" }, { status: 400 });
  } catch (error) {
    console.error("Submit field response error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
