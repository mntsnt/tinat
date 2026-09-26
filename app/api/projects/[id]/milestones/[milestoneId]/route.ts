import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";
import { ProjectPhase } from "@/generated/prisma/enums";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canEditTasks && !auth.canManageProject) {
      return NextResponse.json(
        { error: "You do not have permission to update milestones." },
        { status: 403 }
      );
    }

    const milestone = await prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone || milestone.projectId !== id) {
      return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, deadline, phase, isCompleted, order } = body;

    const updateData: any = {};
    if (title && typeof title === "string") updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (phase && Object.values(ProjectPhase).includes(phase)) updateData.phase = phase;
    if (order !== undefined) updateData.order = Number(order);

    if (typeof isCompleted === "boolean") {
      updateData.isCompleted = isCompleted;
      updateData.completedAt = isCompleted ? new Date() : null;
    }

    const updated = await prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    });

    if (isCompleted !== undefined && isCompleted !== milestone.isCompleted) {
      await logProjectActivity({
        projectId: id,
        userId: auth.userId,
        action: isCompleted ? "COMPLETED_MILESTONE" : "REOPENED_MILESTONE",
        description: `${isCompleted ? "Completed" : "Reopened"} milestone "${updated.title}"`,
      });
    }

    return NextResponse.json({ success: true, milestone: updated });
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canManageProject) {
      return NextResponse.json(
        { error: "Only project managers can delete milestones." },
        { status: 403 }
      );
    }

    const milestone = await prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone || milestone.projectId !== id) {
      return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
    }

    await prisma.projectMilestone.delete({
      where: { id: milestoneId },
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "DELETED_MILESTONE",
      description: `Deleted milestone "${milestone.title}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
