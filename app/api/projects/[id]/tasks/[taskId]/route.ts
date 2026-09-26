import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";
import { ProjectTaskStatus, ProjectTaskPriority, ProjectPhase } from "@/generated/prisma/enums";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canEditTasks) {
      return NextResponse.json(
        { error: "You do not have permission to edit tasks in this project." },
        { status: 403 }
      );
    }

    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.projectId !== id) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      status: newStatus,
      priority,
      phase,
      dueDate,
      assigneeId,
      milestoneId,
      labels,
      subtasks,
    } = body;

    const updateData: any = {};
    if (title && typeof title === "string") updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (newStatus && Object.values(ProjectTaskStatus).includes(newStatus)) {
      updateData.status = newStatus;
      if (newStatus === ProjectTaskStatus.COMPLETED && !task.completedAt) {
        updateData.completedAt = new Date();
      } else if (newStatus !== ProjectTaskStatus.COMPLETED) {
        updateData.completedAt = null;
      }
    }
    if (priority && Object.values(ProjectTaskPriority).includes(priority)) {
      updateData.priority = priority;
    }
    if (phase && Object.values(ProjectPhase).includes(phase)) {
      updateData.phase = phase;
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (milestoneId !== undefined) updateData.milestoneId = milestoneId || null;
    if (Array.isArray(labels)) updateData.labels = labels;
    if (Array.isArray(subtasks)) updateData.subtasks = subtasks;

    const updated = await prisma.projectTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true } },
        milestone: { select: { id: true, title: true } },
      },
    });

    if (newStatus && newStatus !== task.status) {
      await logProjectActivity({
        projectId: id,
        userId: auth.userId,
        action: "TASK_STATUS_CHANGED",
        description: `Updated task "${updated.title}" to ${updated.status}`,
      });
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canEditTasks) {
      return NextResponse.json(
        { error: "You do not have permission to delete tasks." },
        { status: 403 }
      );
    }

    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.projectId !== id) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    await prisma.projectTask.delete({
      where: { id: taskId },
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "DELETED_TASK",
      description: `Deleted task "${task.title}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
