import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";
import { calculateProjectMetrics } from "@/lib/projects/progress";
import { ProjectStatus, ProjectPhase, ProjectVisibility } from "@/generated/prisma/enums";

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

    const project = await prisma.researchProject.findUnique({
      where: { id },
      include: {
        lead: {
          select: { id: true, name: true, email: true, avatarUrl: true, institution: true, bio: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true, institution: true, fieldOfStudy: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        milestones: {
          include: {
            tasks: {
              select: { id: true, status: true, title: true, priority: true, dueDate: true },
            },
          },
          orderBy: { order: "asc" },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
            creator: {
              select: { id: true, name: true },
            },
          },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        },
        files: {
          include: {
            uploader: {
              select: { id: true, name: true },
            },
            versions: {
              orderBy: { version: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        notes: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        },
        discussions: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            replies: {
              include: {
                author: { select: { id: true, name: true, avatarUrl: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        decisions: {
          include: {
            madeBy: { select: { id: true, name: true } },
          },
          orderBy: { decisionNumber: "desc" },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        linkedStudies: {
          include: {
            study: {
              select: {
                id: true,
                title: true,
                status: true,
                studyType: true,
                participantTarget: true,
                category: true,
                _count: {
                  select: { responses: true, questions: true },
                },
              },
            },
            linkedBy: { select: { id: true, name: true } },
          },
        },
        outputs: {
          orderBy: { createdAt: "desc" },
        },
        invitations: {
          where: { status: "PENDING" },
          include: {
            inviter: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const sensitiveFilesCount = project.files.filter((f) => f.isSensitiveHealthData).length;

    const stats = calculateProjectMetrics({
      tasks: project.tasks,
      milestones: project.milestones,
      membersCount: project.members.length,
      filesCount: project.files.length,
      sensitiveFilesCount,
      discussionsCount: project.discussions.length,
      decisionsCount: project.decisions.length,
      linkedStudiesCount: project.linkedStudies.length,
      outputsCount: project.outputs.length,
    });

    return NextResponse.json({
      project,
      auth,
      stats,
    });
  } catch (error) {
    console.error("Error fetching project details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canManageProject) {
      return NextResponse.json(
        { error: "Only project owners and principal investigators can edit project settings." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      researchQuestion,
      objective,
      category,
      studyDesign,
      researchArea,
      institution,
      status: newStatus,
      currentPhase,
      visibility,
      startDate,
      endDate,
      isArchived,
    } = body;

    const updateData: any = {};

    if (title && typeof title === "string" && title.trim().length >= 3) {
      updateData.title = title.trim();
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (researchQuestion !== undefined) updateData.researchQuestion = researchQuestion?.trim() || null;
    if (objective !== undefined) updateData.objective = objective?.trim() || null;
    if (category) updateData.category = category.trim();
    if (studyDesign) updateData.studyDesign = studyDesign.trim();
    if (researchArea !== undefined) updateData.researchArea = researchArea?.trim() || null;
    if (institution !== undefined) updateData.institution = institution?.trim() || null;
    if (newStatus && Object.values(ProjectStatus).includes(newStatus)) {
      updateData.status = newStatus;
    }
    if (currentPhase && Object.values(ProjectPhase).includes(currentPhase)) {
      updateData.currentPhase = currentPhase;
    }
    if (visibility && Object.values(ProjectVisibility).includes(visibility)) {
      updateData.visibility = visibility;
    }
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isArchived !== undefined) updateData.isArchived = Boolean(isArchived);

    const updated = await prisma.researchProject.update({
      where: { id },
      data: updateData,
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "UPDATED_PROJECT",
      description: `Updated project metadata and status (${updated.currentPhase})`,
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.isLead && auth.userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the project lead can archive or delete this research project." },
        { status: 403 }
      );
    }

    // Safe archiving preserves all research artifacts and audit trails
    await prisma.researchProject.update({
      where: { id },
      data: { isArchived: true, status: ProjectStatus.ARCHIVED },
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "ARCHIVED_PROJECT",
      description: "Archived research project workspace. Artifacts and logs preserved.",
    });

    return NextResponse.json({
      success: true,
      message: "Project archived successfully. Research artifacts preserved.",
    });
  } catch (error) {
    console.error("Error archiving project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
