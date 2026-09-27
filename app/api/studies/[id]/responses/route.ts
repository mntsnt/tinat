import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { collectionMethod, answers, collectionSessionId } = await req.json();

    if (collectionMethod === "FIELD_COLLECTED") {
      // Verify data collector authorization
      const assignment = await prisma.studyDataCollector.findUnique({
        where: { studyId_userId: { studyId: id, userId: user.id } }
      });

      if (!assignment) {
        return NextResponse.json({ error: "Not assigned to this study as a data collector." }, { status: 403 });
      }

      // Find an anonymous participant placeholder or create one per response?
      // "Do NOT automatically collect participant identity. A field-collected participant should remain anonymous."
      // Let's create an anonymous participant for each field response to satisfy the schema requirement.
      const anonParticipant = await prisma.user.create({
        data: {
          name: "Anonymous Participant",
          email: `anon-${Date.now()}-${Math.random().toString(36).substring(7)}@tinat.app`,
          passwordHash: "NONE",
          role: "PARTICIPANT"
        }
      });

      // Data Quality Check: extremely short answers array or empty
      if (!answers || answers.length === 0) {
        // We log a potential data-quality issue or return an error if it's strictly required
        // But for field collection, we'll log it as a warning in an AuditLog or similar if we had a dedicated table.
        // The user requirements said: "Use neutral terminology such as 'Potential data-quality issue'".
        console.warn(`Potential data-quality issue: Response submitted by collector ${user.id} with 0 answers.`);
      }

      let result;
      try {
        result = await prisma.$transaction(async (tx) => {
          // Find study to check budget
          const currentStudy = await tx.study.findUnique({
            where: { id },
            include: { _count: { select: { responses: true } } }
          });

          if (!currentStudy) throw new Error("Study not found");

          const remaining = currentStudy.budgetCredits - currentStudy.creditsPaid;
          if (currentStudy.rewardCredits > 0 && currentStudy.rewardCredits > remaining) {
            throw new Error("BUDGET_EXCEEDED");
          }

          const response = await tx.response.create({
            data: {
              studyId: id,
              participantId: anonParticipant.id,
              collectionMethod: "FIELD_COLLECTED",
              collectorId: user.id,
              collectionSessionId: collectionSessionId || undefined,
              answers: {
                create: answers
              }
            }
          });

          // Compensate the data collector
          if (currentStudy.rewardCredits > 0) {
            const wallet = await tx.wallet.upsert({
              where: { userId: user.id },
              update: {},
              create: { userId: user.id, balance: 0 }
            });

            await tx.wallet.update({
              where: { userId: user.id },
              data: { balance: { increment: currentStudy.rewardCredits } }
            });

            await tx.tinatCreditTransaction.create({
              data: {
                walletId: wallet.id,
                amount: currentStudy.rewardCredits,
                type: "EARN",
                reason: `Field collected data for study: ${currentStudy.title}`
              }
            });

            const newCreditsPaid = currentStudy.creditsPaid + currentStudy.rewardCredits;
            const newResponseCount = currentStudy._count.responses + 1;
            const targetReached = currentStudy.participantTarget > 0 && newResponseCount >= currentStudy.participantTarget;
            const budgetReached = currentStudy.budgetCredits > 0 && newCreditsPaid >= currentStudy.budgetCredits;

            await tx.study.update({
              where: { id },
              data: {
                creditsPaid: newCreditsPaid,
                status: targetReached || budgetReached ? "COMPLETED" : "ACTIVE"
              }
            });
          }

          return response;
        });
      } catch (err: any) {
        if (err.message === "BUDGET_EXCEEDED") {
          return NextResponse.json({ error: "This research study has no remaining funding." }, { status: 400 });
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
