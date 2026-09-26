import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";
import { ProjectTaskStatus, ProjectTaskPriority, ProjectPhase } from "@/generated/prisma/enums";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    const { searchParams } = new URL(req.url);
    const phase = searchParams.get("phase");
    const taskStatus = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");

    const where: any = { projectId: id };
    if (phase && Object.values(ProjectPhase).includes(phase as ProjectPhase)) {
      where.phase = phase;
    }
    if (taskStatus && Object.values(ProjectTaskStatus).includes(taskStatus as ProjectTaskStatus)) {
      where.status = taskStatus;
    }
    if (priority && Object.values(ProjectTaskPriority).includes(priority as ProjectTaskPriority)) {
      where.priority = priority;
    }
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    const tasks = await prisma.projectTask.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true } },
        milestone: { select: { id: true, title: true, phase: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canEditTasks) {
      return NextResponse.json(
        { error: "You do not have permission to create tasks in this project." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      status: taskStatus,
      priority,
      phase,
      dueDate,
      assigneeId,
      milestoneId,
      labels,
      subtasks,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 });
    }

    const task = await prisma.projectTask.create({
      data: {
        projectId: id,
        creatorId: auth.userId,
        assigneeId: assigneeId || null,
        milestoneId: milestoneId || null,
        title: title.trim(),
        description: description?.trim() || null,
        status: taskStatus || ProjectTaskStatus.TODO,
        priority: priority || ProjectTaskPriority.MEDIUM,
        phase: phase || ProjectPhase.PLANNING,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: Array.isArray(labels) ? labels : [],
        subtasks: Array.isArray(subtasks) ? subtasks : [],
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true } },
        milestone: { select: { id: true, title: true } },
      },
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "CREATED_TASK",
      description: `Created task "${task.title}"`,
      metadata: { taskId: task.id, priority: task.priority },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
