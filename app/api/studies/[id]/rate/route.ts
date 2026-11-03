import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { hasUserParticipated } from "@/lib/identity/linkService";
import { logActivity } from "@/lib/activityLog";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;
    if (user.role !== "PARTICIPANT") {
      return jsonError("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { rating, feedback } = body;

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    // Check if participant actually completed this study via LinkService
    const completed = await hasUserParticipated({
      userId: user.id,
      studyId: id,
    });

    if (!completed) {
      return NextResponse.json({ error: "You can only rate studies you have completed" }, { status: 403 });
    }

    const studyRating = await prisma.studyRating.upsert({
      where: {
        userId_studyId: {
          userId: user.id,
          studyId: id,
        },
      },
      update: {
        rating,
        feedback,
      },
      create: {
        userId: user.id,
        studyId: id,
        rating,
        feedback,
      },
    });

    await logActivity({
      userId: user.id,
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
