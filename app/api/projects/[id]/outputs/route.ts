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

    const outputs = await prisma.projectOutput.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ outputs });
  } catch (error: any) {
    console.error("GET /api/projects/[id]/outputs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch outputs", details: error.message },
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
    if (!auth || !auth.canEditTasks) {
      return NextResponse.json(
        { error: error || "Permission denied" },
        { status: auth ? 403 : (status || 401) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      title,
      type = "RESEARCH_PAPER",
      status: outputStatus = "DRAFT",
      targetJournal,
      linkUrl,
      fileUrl,
      submissionDeadline,
      publicationDate,
      contributors = [],
      manuscriptSections,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const output = await prisma.projectOutput.create({
      data: {
        projectId,
        title: title.trim(),
        type,
        status: outputStatus,
        targetJournal: targetJournal?.trim() || null,
        linkUrl: linkUrl?.trim() || null,
        fileUrl: fileUrl?.trim() || null,
        submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : null,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        contributors: Array.isArray(contributors) ? contributors : [],
        manuscriptSections: manuscriptSections || {
          titleAndAbstract: "NOT_STARTED",
          introduction: "NOT_STARTED",
          methods: "NOT_STARTED",
          results: "NOT_STARTED",
          discussion: "NOT_STARTED",
          references: "NOT_STARTED",
        },
      },
    });

    await logProjectActivity({
      projectId,
      userId: auth.userId,
      action: "CREATED_OUTPUT",
      description: `Created research output: "${output.title}" (${output.type})`,
      metadata: { outputId: output.id, type: output.type },
    });

    return NextResponse.json({ output }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/outputs error:", error);
    return NextResponse.json(
      { error: "Failed to create output", details: error.message },
      { status: 500 }
    );
  }
}
