import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }

    // 1. Fetch currently linked studies with aggregate metrics
    const linkedStudies = await prisma.projectLinkedStudy.findMany({
      where: { projectId },
      include: {
        study: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            category: true,
            participantTarget: true,
            rewardCredits: true,
            createdAt: true,
            _count: {
              select: {
                responses: true,
                questions: true,
              },
            },
          },
        },
        linkedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch available studies owned by the current user that aren't linked yet
    const linkedStudyIds = linkedStudies.map((ls) => ls.studyId);
    const availableStudies = await prisma.study.findMany({
      where: {
        researcherId: auth.userId,
        id: { notIn: linkedStudyIds },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        category: true,
        createdAt: true,
        _count: {
          select: {
            responses: true,
            questions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      linkedStudies,
      availableStudies,
    });
  } catch (error: any) {
    console.error("GET /api/projects/[id]/studies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch linked studies", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth || !auth.canManageStudies) {
      return NextResponse.json(
        { error: error || "Permission denied. Only Project Owners, PIs, or Research Leads can link data-collection studies." },
        { status: auth ? 403 : (status || 401) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { studyId, notes } = body;

    if (!studyId) {
      return NextResponse.json({ error: "studyId is required" }, { status: 400 });
    }

    // Verify study exists and user is either study researcher or admin
    const study = await prisma.study.findUnique({
      where: { id: studyId },
      select: { id: true, title: true, researcherId: true },
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    if (study.researcherId !== auth.userId && auth.userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "You can only link studies that you own or have permission to administer." },
        { status: 403 }
      );
    }

    const linked = await prisma.projectLinkedStudy.create({
      data: {
        projectId,
        studyId,
        linkedById: auth.userId,
        notes: notes?.trim() || null,
      },
      include: {
        study: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            category: true,
            participantTarget: true,
            rewardCredits: true,
            _count: {
              select: { responses: true, questions: true },
            },
          },
        },
        linkedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logProjectActivity({
      projectId,
      userId: auth.userId,
      action: "LINKED_STUDY",
      description: `Linked Tinat data-collection study "${study.title}" to this project`,
      metadata: { studyId, studyTitle: study.title },
    });

    return NextResponse.json({ linkedStudy: linked }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This study is already linked to this project" },
        { status: 409 }
      );
    }
    console.error("POST /api/projects/[id]/studies error:", error);
    return NextResponse.json(
      { error: "Failed to link study", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth || !auth.canManageStudies) {
      return NextResponse.json(
        { error: error || "Permission denied" },
        { status: auth ? 403 : (status || 401) }
      );
    }

    const { searchParams } = new URL(request.url);
    const studyId = searchParams.get("studyId");

    if (!studyId) {
      return NextResponse.json({ error: "studyId query param is required" }, { status: 400 });
    }

    const deleted = await prisma.projectLinkedStudy.deleteMany({
      where: {
        projectId,
        studyId,
      },
    });

    if (deleted.count > 0) {
      await logProjectActivity({
        projectId,
        userId: auth.userId,
        action: "UNLINKED_STUDY",
        description: `Unlinked study from project`,
        metadata: { studyId },
      });
    }

    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id]/studies error:", error);
    return NextResponse.json(
      { error: "Failed to unlink study", details: error.message },
      { status: 500 }
    );
  }
}
