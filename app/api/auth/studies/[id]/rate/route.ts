import { NextResponse } from "next/server";
import { getSession } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prisma";
import { logActivity } from "../../../../../../lib/activityLog";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.role !== "PARTICIPANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { rating, feedback } = body;

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    // Check if participant actually completed this study
    const response = await prisma.response.findUnique({
      where: {
        studyId_participantId: {
          studyId: id,
          participantId: session.userId,
        },
      },
    });

    if (!response) {
      return NextResponse.json({ error: "You can only rate studies you have completed" }, { status: 403 });
    }

    const studyRating = await prisma.studyRating.upsert({
      where: {
        userId_studyId: {
          userId: session.userId,
          studyId: id,
        },
      },
      update: {
        rating,
        feedback,
      },
      create: {
        userId: session.userId,
        studyId: id,
        rating,
        feedback,
      },
    });

    await logActivity({
  userId: session.userId,
  action: "STUDY_RATED",
  description: `Participant rated study ${id} with ${rating} stars`,
  resourceId: id,
  resourceType: "Study",
});

return NextResponse.json(studyRating);
  } catch (error) {
    console.error("Error rating study:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
