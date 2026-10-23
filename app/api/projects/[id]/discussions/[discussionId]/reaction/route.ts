import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess } from "@/lib/projects/auth";

export async function PUT(
  _request: Request,
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
      select: { projectId: true },
    });
    if (!discussion || discussion.projectId !== projectId) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    await prisma.projectDiscussionReaction.upsert({
      where: { discussionId_userId: { discussionId, userId: auth.userId } },
      update: {},
      create: { discussionId, userId: auth.userId },
    });
    return NextResponse.json({ reacted: true });
  } catch (error) {
    console.error("PUT discussion reaction error:", error);
    return NextResponse.json({ error: "Could not react to discussion" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
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
      select: { projectId: true },
    });
    if (!discussion || discussion.projectId !== projectId) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    await prisma.projectDiscussionReaction.deleteMany({
      where: { discussionId, userId: auth.userId },
    });
    return NextResponse.json({ reacted: false });
  } catch (error) {
    console.error("DELETE discussion reaction error:", error);
    return NextResponse.json({ error: "Could not remove discussion reaction" }, { status: 500 });
  }
}
