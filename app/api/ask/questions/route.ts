import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.askProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!profile) {
      return NextResponse.json({
        profile: null,
        questions: [],
        stats: { total: 0, unanswered: 0, answered: 0, public: 0 },
      });
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "unanswered";

    let statusFilter: any = { not: "DELETED" };
    if (tab === "unanswered") {
      statusFilter = "UNANSWERED";
    } else if (tab === "answered") {
      statusFilter = "ANSWERED";
    } else if (tab === "archived") {
      statusFilter = "ARCHIVED";
    }

    const [questions, unansweredCount, answeredCount, archivedCount, publicCount] =
      await Promise.all([
        prisma.askQuestion.findMany({
          where: {
            profileId: profile.id,
            status: statusFilter,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.askQuestion.count({
          where: { profileId: profile.id, status: "UNANSWERED" },
        }),
        prisma.askQuestion.count({
          where: { profileId: profile.id, status: "ANSWERED" },
        }),
        prisma.askQuestion.count({
          where: { profileId: profile.id, status: "ARCHIVED" },
        }),
        prisma.askQuestion.count({
          where: { profileId: profile.id, status: "ANSWERED", isPublic: true },
        }),
      ]);

    return NextResponse.json({
      profile,
      questions,
      stats: {
        total: unansweredCount + answeredCount + archivedCount,
        unanswered: unansweredCount,
        answered: answeredCount,
        archived: archivedCount,
        public: publicCount,
      },
    });
  } catch (error) {
    console.error("Error fetching ask questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
