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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isResolved = searchParams.get("isResolved");

    const where: any = { projectId };
    if (category) where.category = category;
    if (isResolved !== null && isResolved !== undefined) {
      where.isResolved = isResolved === "true";
    }

    const discussions = await prisma.projectDiscussion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ discussions });
  } catch (error: any) {
    console.error("GET /api/projects/[id]/discussions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussions", details: error.message },
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
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { title, content, category } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const discussion = await prisma.projectDiscussion.create({
      data: {
        projectId,
        authorId: auth.userId,
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || "General",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        replies: true,
      },
    });

    await logProjectActivity({
      projectId,
      userId: auth.userId,
      action: "STARTED_DISCUSSION",
      description: `Started discussion: ${discussion.title}`,
      metadata: { discussionId: discussion.id, category: discussion.category },
    });

    return NextResponse.json({ discussion }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/discussions error:", error);
    return NextResponse.json(
      { error: "Failed to create discussion", details: error.message },
      { status: 500 }
    );
  }
}
