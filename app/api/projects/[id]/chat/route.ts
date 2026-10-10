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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 150,
      select: {
        id: true,
        senderId: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            institution: true,
          },
        },
      },
    });

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("GET /api/projects/[id]/chat error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
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

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !("content" in body) || typeof body.content !== "string") {
      return NextResponse.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }
    const content = body.content.trim();
    if (!content) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }
    if (content.length > 1500) {
      return NextResponse.json({ error: "Messages must be 1,500 characters or fewer." }, { status: 400 });
    }

    const message = await prisma.projectChatMessage.create({
      data: {
        projectId,
        senderId: auth.userId,
        content,
      },
      select: {
        id: true,
        senderId: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            institution: true,
          },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[id]/chat error:", error);
    return NextResponse.json(
      { error: "Failed to post message" },
      { status: 500 }
    );
  }
}
