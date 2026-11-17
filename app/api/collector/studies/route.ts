import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const verification = await prisma.verification.findUnique({
      where: {
        userId_verificationType: {
          userId: user.id,
          verificationType: "DATA_COLLECTOR"
        }
      }
    });

    const isVerified = verification?.status === "VERIFIED";

    // Return all assigned studies for this data collector
    const assignedStudies = await prisma.studyDataCollector.findMany({
      where: {
        userId: user.id,
      },
      include: {
        study: {
          select: {
            id: true,
            title: true,
            status: true,
            studyType: true,
            rewardCredits: true,
            collectorPayType: true,
            collectorPayRateCents: true,
            researcher: { select: { name: true } },
            _count: {
              select: {
                responses: {
                  where: {
                    collectorId: user.id,
                    collectionMethod: "FIELD_COLLECTED",
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    const payouts = await prisma.collectorPayout.findMany({
      where: { collectorUserId: user.id },
      select: { amountCents: true },
    });
    const totalPaidCents = payouts.reduce((sum, p) => sum + p.amountCents, 0);

    return NextResponse.json({ studies: assignedStudies, totalPaidCents });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
