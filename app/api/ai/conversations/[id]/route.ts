import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { jsonError, validateBody } from "@/lib/validation";
import { z } from "zod";

const updateConversationSchema = z.object({
  title: z.string().optional(),
  studyId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  model: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const { id: conversationId } = await params;

    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) {
      return jsonError("Conversation not found", 404);
    }

    if (conversation.userId !== auth.user.id && auth.user.role !== "ADMIN") {
      return jsonError("Forbidden: you cannot access another user's conversation", 403);
    }

    return NextResponse.json({ conversation });
  } catch (err: any) {
    console.error("Error fetching conversation:", err);
    return jsonError("Failed to fetch conversation", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const { id: conversationId } = await params;

    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return jsonError("Conversation not found", 404);
    }

    if (conversation.userId !== auth.user.id && auth.user.role !== "ADMIN") {
      return jsonError("Forbidden: you cannot modify another user's conversation", 403);
    }

    const validation = await validateBody(updateConversationSchema, request);
    if (!validation.ok) return validation.response;
    const body = validation.data;

    const updatedConversation = await prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        title: body.title,
        studyId: body.studyId,
        projectId: body.projectId,
        model: body.model,
      },
    });

    return NextResponse.json({ conversation: updatedConversation });
  } catch (err: any) {
    console.error("Error updating conversation:", err);
    return jsonError("Failed to update conversation", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const { id: conversationId } = await params;

    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return jsonError("Conversation not found", 404);
    }

    if (conversation.userId !== auth.user.id && auth.user.role !== "ADMIN") {
      return jsonError("Forbidden: you cannot delete another user's conversation", 403);
    }

    await prisma.aIConversation.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting conversation:", err);
    return jsonError("Failed to delete conversation", 500);
  }
}
