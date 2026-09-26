import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTemplateById } from "@/lib/projects/templates";
import { calculateProjectMetrics } from "@/lib/projects/progress";
import { logProjectActivity } from "@/lib/projects/auth";
import {
  ProjectRole,
  ProjectStatus,
  ProjectVisibility,
  ProjectPhase,
  InvitationStatus,
} from "@/generated/prisma/enums";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "active"; // active, completed, archived, all, owned
    const search = searchParams.get("search")?.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const isGlobalAdmin = user.role === "ADMIN";

    // Where clause based on membership
    const baseWhere: any = isGlobalAdmin
      ? {}
      : {
          OR: [
            { projectLeadId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        };

    if (filter === "active") {
      baseWhere.status = ProjectStatus.ACTIVE;
      baseWhere.isArchived = false;
    } else if (filter === "completed") {
      baseWhere.status = ProjectStatus.COMPLETED;
      baseWhere.isArchived = false;
    } else if (filter === "archived") {
      baseWhere.isArchived = true;
    } else if (filter === "owned") {
      baseWhere.projectLeadId = user.id;
      baseWhere.isArchived = false;
    }

    if (search) {
      baseWhere.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { researchQuestion: { contains: search, mode: "insensitive" } },
            { institution: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const projects = await prisma.researchProject.findMany({
      where: baseWhere,
      include: {
        lead: {
          select: { id: true, name: true, email: true, avatarUrl: true, institution: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true, institution: true },
            },
          },
        },
        tasks: {
          select: { status: true, dueDate: true },
        },
        milestones: {
          select: { isCompleted: true },
        },
        _count: {
          select: {
            files: true,
            discussions: true,
            decisions: true,
            linkedStudies: true,
            outputs: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const enrichedProjects = projects.map((p) => {
      const stats = calculateProjectMetrics({
        tasks: p.tasks,
        milestones: p.milestones,
        membersCount: p.members.length,
        filesCount: p._count.files,
        sensitiveFilesCount: 0,
        discussionsCount: p._count.discussions,
        decisionsCount: p._count.decisions,
        linkedStudiesCount: p._count.linkedStudies,
        outputsCount: p._count.outputs,
      });

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        researchQuestion: p.researchQuestion,
        objective: p.objective,
        category: p.category,
        studyDesign: p.studyDesign,
        researchArea: p.researchArea,
        institution: p.institution,
        status: p.status,
        currentPhase: p.currentPhase,
        visibility: p.visibility,
        isArchived: p.isArchived,
        startDate: p.startDate,
        endDate: p.endDate,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        lead: p.lead,
        members: p.members.map((m) => ({
          id: m.id,
          role: m.role,
          title: m.title,
          user: m.user,
        })),
        stats,
      };
    });

    return NextResponse.json({ projects: enrichedProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      startDate,
      endDate,
      visibility,
      templateId,
      initialMembers,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Project title must be at least 3 characters long." },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { error: "Research category is required." },
        { status: 400 }
      );
    }

    const template = getTemplateById(templateId || "GENERAL");
    const inviteToken = crypto.randomBytes(16).toString("hex");

    // 1. Create Research Project
    const project = await prisma.researchProject.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        researchQuestion: researchQuestion?.trim() || null,
        objective: objective?.trim() || null,
        category: category.trim(),
        studyDesign: studyDesign?.trim() || template.studyDesign,
        researchArea: researchArea?.trim() || null,
        institution: institution?.trim() || null,
        projectLeadId: session.userId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        visibility: visibility || ProjectVisibility.TEAM,
        currentPhase: ProjectPhase.PLANNING,
        inviteToken,
      },
    });

    // 2. Add creator as PROJECT_OWNER in ProjectMember
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: session.userId,
        role: ProjectRole.PROJECT_OWNER,
        title: "Principal Investigator / Project Lead",
      },
    });

    // 3. Populate Template Milestones & Tasks
    if (template.milestones && template.milestones.length > 0) {
      for (const m of template.milestones) {
        const milestone = await prisma.projectMilestone.create({
          data: {
            projectId: project.id,
            title: m.title,
            description: m.description || null,
            phase: m.phase,
            order: m.order,
          },
        });

        if (m.tasks && m.tasks.length > 0) {
          for (const t of m.tasks) {
            await prisma.projectTask.create({
              data: {
                projectId: project.id,
                milestoneId: milestone.id,
                creatorId: session.userId,
                title: t.title,
                description: t.description || null,
                priority: t.priority,
                phase: t.phase,
                labels: t.labels || [],
              },
            });
          }
        }
      }
    }

    // 4. Populate Template Notes
    if (template.notes && template.notes.length > 0) {
      for (const n of template.notes) {
        await prisma.projectNote.create({
          data: {
            projectId: project.id,
            authorId: session.userId,
            category: n.category,
            title: n.title,
            content: n.content,
          },
        });
      }
    }

    // 5. Create Invitations if provided
    if (Array.isArray(initialMembers) && initialMembers.length > 0) {
      for (const m of initialMembers) {
        if (m.email && typeof m.email === "string" && m.email.includes("@")) {
          const token = crypto.randomBytes(24).toString("hex");
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiration

          await prisma.projectInvitation.create({
            data: {
              projectId: project.id,
              inviterId: session.userId,
              inviteeEmail: m.email.toLowerCase().trim(),
              role: m.role || ProjectRole.RESEARCHER,
              message: m.message || `You've been invited to join the research project: ${project.title}`,
              token,
              expiresAt,
            },
          });
        }
      }
    }

    // 6. Log Initial Activity
    await logProjectActivity({
      projectId: project.id,
      userId: session.userId,
      action: "CREATED_PROJECT",
      description: `Created research project "${project.title}" using template "${template.name}"`,
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
