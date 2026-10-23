import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess } from "@/lib/projects/auth";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string; discussionId: string; replyId: string }> }
) {
  try {
    const { id: projectId, discussionId, replyId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }

    const reply = await prisma.projectDiscussionReply.findUnique({
      where: { id: replyId },
      select: { discussion: { select: { id: true, projectId: true } } },
    });
    if (!reply || reply.discussion.id !== discussionId || reply.discussion.projectId !== projectId) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    await prisma.projectDiscussionReplyReaction.upsert({
      where: { replyId_userId: { replyId, userId: auth.userId } },
      update: {},
      create: { replyId, userId: auth.userId },
    });
    return NextResponse.json({ reacted: true });
  } catch (error) {
    console.error("PUT discussion reply reaction error:", error);
    return NextResponse.json({ error: "Could not react to reply" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; discussionId: string; replyId: string }> }
) {
  try {
    const { id: projectId, discussionId, replyId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }

    const reply = await prisma.projectDiscussionReply.findUnique({
      where: { id: replyId },
      select: { discussion: { select: { id: true, projectId: true } } },
    });
    if (!reply || reply.discussion.id !== discussionId || reply.discussion.projectId !== projectId) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    await prisma.projectDiscussionReplyReaction.deleteMany({
      where: { replyId, userId: auth.userId },
    });
    return NextResponse.json({ reacted: false });
  } catch (error) {
    console.error("DELETE discussion reply reaction error:", error);
    return NextResponse.json({ error: "Could not remove reply reaction" }, { status: 500 });
  }
}
