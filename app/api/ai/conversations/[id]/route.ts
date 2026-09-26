import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId, userId: session.userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (err: any) {
    console.error("Error fetching conversation:", err);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const updatedConversation = await prisma.aIConversation.update({
      where: { id: conversationId, userId: session.userId },
      data: {
        title: body.title,
        studyId: body.studyId,
        projectId: body.projectId,
        model: body.model,
      }
    });

    return NextResponse.json({ conversation: updatedConversation });
  } catch (err: any) {
    console.error("Error updating conversation:", err);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.aIConversation.delete({
      where: { id: conversationId, userId: session.userId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting conversation:", err);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
