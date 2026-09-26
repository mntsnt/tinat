import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess } from "@/lib/projects/auth";

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

    const messages = await prisma.projectChatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      take: 150,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("GET /api/projects/[id]/chat error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat messages", details: error.message },
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
    const { content, taskId, fileUrl } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    const message = await prisma.projectChatMessage.create({
      data: {
        projectId,
        senderId: auth.userId,
        content: content.trim(),
        taskId: taskId || null,
        fileUrl: fileUrl || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/chat error:", error);
    return NextResponse.json(
      { error: "Failed to post message", details: error.message },
      { status: 500 }
    );
  }
}
