import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";

export const dynamic = "force-dynamic";

export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const reply = await prisma.projectDiscussionReply.create({
      data: {
        discussionId,
        authorId: auth.userId,
        content: content.trim(),
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
      },
    });

    await logProjectActivity({
      projectId,
      userId: auth.userId,
      action: "REPLIED_DISCUSSION",
      description: `Replied to discussion "${discussion.title}"`,
      metadata: { discussionId, replyId: reply.id },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error: any) {
    console.error("POST discussion reply error:", error);
    return NextResponse.json(
      { error: "Failed to post reply", details: error.message },
      { status: 500 }
    );
  }
}
