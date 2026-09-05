import { NextResponse } from "next/server";
import { getSession } from "../../../../../../../lib/auth";
import { prisma } from "../../../../../../../lib/prisma";
import { logActivity } from "../../../../../../../lib/activityLog";

const allowedStatuses = ["ACTIVE", "PAUSED", "COMPLETED"] as const;
type AllowedStatus = (typeof allowedStatuses)[number];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can manage studies." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const body = await request.json();
    const status = body?.status as string;

    if (!allowedStatuses.includes(status as AllowedStatus)) {
      return NextResponse.json(
        { error: "Invalid study status." },
        { status: 400 }
      );
    }

    const study = await prisma.study.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!study) {
      return NextResponse.json(
        { error: "Study not found." },
        { status: 404 }
      );
    }

    if (study.status === "COMPLETED") {
      return NextResponse.json(
        { error: "A completed study cannot be changed." },
        { status: 400 }
      );
    }

    if (study.status === "DRAFT" && status !== "ACTIVE" && status !== "COMPLETED") {
      return NextResponse.json(
        { error: "A draft study can only be activated or completed." },
        { status: 400 }
      );
    }

    if (status === "ACTIVE") {
      // Admin specific checks for activation
      if (study.budgetCredits <= 0 || study.rewardCredits <= 0) {
        return NextResponse.json(
          { error: "Cannot activate a study with zero budget or zero reward." },
          { status: 400 }
        );
      }
      
      const remaining = study.budgetCredits - study.creditsPaid;
      if (remaining < study.rewardCredits) {
        return NextResponse.json(
          { error: "Cannot activate a study without sufficient remaining budget." },
          { status: 400 }
        );
      }

      if (study._count.questions === 0) {
        return NextResponse.json(
          { error: "Cannot activate a study with no questions." },
          { status: 400 }
        );
      }
    }

    const updatedStudy = await prisma.study.update({
      where: {
        id,
      },
      data: {
        status: status as AllowedStatus,
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE_STUDY_STATUS",
      description: `Study ${id} status changed to ${status}`,
      resourceId: id,
      resourceType: "Study",
    });

    return NextResponse.json({
      message: "Study status updated successfully.",
      study: updatedStudy,
    });
  } catch (error) {
    console.error("Admin study status update error:", error);

    return NextResponse.json(
      { error: "Failed to update study status." },
      { status: 500 }
    );
  }
}
