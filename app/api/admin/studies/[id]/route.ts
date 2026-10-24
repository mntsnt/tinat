import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const study = await prisma.study.findUnique({
      where: { id },
      include: {
        researcher: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: true,
            fieldOfStudy: true,
            createdAt: true,
          },
        },
        questions: {
          include: {
            options: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            responses: true,
            questions: true,
          },
        },
      },
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    const remainingCredits = study.budgetCredits - study.creditsPaid;
    const participantTargetReached =
      study.participantTarget > 0 && study._count.responses >= study.participantTarget;
    const budgetValid =
      study.budgetCredits > 0 &&
      study.rewardCredits > 0 &&
      remainingCredits >= study.rewardCredits &&
      study.questions.length > 0;

    return NextResponse.json({
      study,
      metrics: {
        remainingCredits,
        participantTargetReached,
        budgetValid,
      },
    });
  } catch (error) {
    console.error("Admin study detail fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch study details" }, { status: 500 });
  }
}
