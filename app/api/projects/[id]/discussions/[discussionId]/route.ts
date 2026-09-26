import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  try {
    const { id: projectId, discussionId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }

    const discussion = await prisma.projectDiscussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion || discussion.projectId !== projectId) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    // Can be updated by author or project manager
    if (discussion.authorId !== auth.userId && !auth.canManageProject) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { title, content, category, isResolved } = body;

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (content !== undefined) data.content = content.trim();
    if (category !== undefined) data.category = category.trim();
    if (isResolved !== undefined) data.isResolved = Boolean(isResolved);

    const updated = await prisma.projectDiscussion.update({
      where: { id: discussionId },
      data,
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
    });

    if (isResolved !== undefined) {
      await logProjectActivity({
        projectId,
        userId: auth.userId,
        action: isResolved ? "RESOLVED_DISCUSSION" : "REOPENED_DISCUSSION",
        description: `${isResolved ? "Resolved" : "Reopened"} discussion: "${updated.title}"`,
        metadata: { discussionId },
      });
    }

    return NextResponse.json({ discussion: updated });
  } catch (error: any) {
    console.error("PATCH discussion error:", error);
    return NextResponse.json(
      { error: "Failed to update discussion", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  try {
    const { id: projectId, discussionId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }

    const discussion = await prisma.projectDiscussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion || discussion.projectId !== projectId) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    if (discussion.authorId !== auth.userId && !auth.canManageProject) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await prisma.projectDiscussion.delete({
      where: { id: discussionId },
    });

    await logProjectActivity({
      projectId,
      userId: auth.userId,
      action: "DELETED_DISCUSSION",
      description: `Deleted discussion "${discussion.title}"`,
      metadata: { discussionId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE discussion error:", error);
    return NextResponse.json(
      { error: "Failed to delete discussion", details: error.message },
      { status: 500 }
    );
  }
}
