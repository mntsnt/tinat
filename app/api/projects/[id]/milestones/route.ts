import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";
import { ProjectPhase } from "@/generated/prisma/enums";

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

    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId: id },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    const enriched = milestones.map((m) => {
      const total = m.tasks.length;
      const completed = m.tasks.filter((t) => t.status === "COMPLETED").length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : m.isCompleted ? 100 : 0;
      return {
        ...m,
        progress,
        totalTasks: total,
        completedTasks: completed,
      };
    });

    return NextResponse.json({ milestones: enriched });
  } catch (error) {
    console.error("Error fetching milestones:", error);
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

    if (!auth.canManageProject && !auth.canMakeDecisions) {
      return NextResponse.json(
        { error: "You do not have permission to define project milestones." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, deadline, phase, order } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Milestone title is required." }, { status: 400 });
    }

    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId: id,
        title: title.trim(),
        description: description?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        phase: phase || ProjectPhase.PLANNING,
        order: order !== undefined ? Number(order) : 0,
      },
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "CREATED_MILESTONE",
      description: `Created milestone "${milestone.title}"`,
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
