import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { jsonError, validateBody } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { getProviderForModel, isAIModelConfigured } from "@/lib/ai/providers";
import { MEDICAL_RESEARCH_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { computeStudyStatistics } from "@/lib/ai/data-analysis";
import { formatStudyContext } from "@/lib/ai/context";
import { getAIModel } from "@/lib/ai/models";
import { FEATURES } from "@/lib/config/features";
import { z } from "zod";

const postMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      return jsonError("Forbidden: you cannot access another user's conversation messages", 403);
    }

    const messages = await prisma.aIMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("Error fetching messages:", err);
    return jsonError("Failed to fetch messages", 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    if (!FEATURES.AI_EXTERNAL_ENABLED) {
      return jsonError(
        "External AI is disabled to protect research data. Enable AI_EXTERNAL_ENABLED only after approving external processing.",
        403
      );
    }

    const rateCheck = checkRateLimit(request, "CHAT", auth.user.id);
    if (!rateCheck.allowed) return rateCheck.response;

    const { id: conversationId } = await params;

    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        study: {
          include: {
            questions: { include: { options: true, rows: true } },
            responses: { include: { answers: true } },
          },
        },
      },
    });

    if (!conversation) {
      return jsonError("Conversation not found", 404);
    }

    if (conversation.userId !== auth.user.id && auth.user.role !== "ADMIN") {
      return jsonError("Forbidden: you cannot post to another user's conversation", 403);
    }

    const validation = await validateBody(postMessageSchema, request);
    if (!validation.ok) return validation.response;
    const { content } = validation.data;

    const modelInfo = getAIModel(conversation.model);
    if (!modelInfo) {
      return jsonError("This conversation's AI model is no longer available. Start a new chat.", 409);
    }
    if (!isAIModelConfigured(modelInfo.id)) {
      const keyName = modelInfo.providerId === "NVIDIA" ? "NVIDIA_API_KEY" : "GEMINI_API_KEY";
      return jsonError(`${modelInfo.provider} is not configured. Add ${keyName} to the server environment.`, 503);
    }

    // Save user message only after AI access and provider configuration are validated.
    const userMessage = await prisma.aIMessage.create({
      data: { conversationId, role: "USER", content },
    });

    // Build system prompt
    let systemPrompt = MEDICAL_RESEARCH_SYSTEM_PROMPT;

    if (conversation.study) {
      const summary = computeStudyStatistics(conversation.study);
      const contextText = formatStudyContext(summary);
      systemPrompt += `\n\n=======================================================\nCURRENT AUTHORIZED STUDY DATASET (STRICT GROUNDING CONTEXT):\n${contextText}\n=======================================================\nAlways ground your answers in the numbers and distributions above. If the user asks about a variable, relationship, or subgroup not collected in the data, state clearly: "The available dataset is insufficient to determine this."`;
    }

    // Get message history
    const history = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 20,
    });

    const aiMessages = history.reverse().map((msg) => ({
      role: msg.role.toLowerCase() as "user" | "assistant" | "system" | "tool",
      content: msg.content,
    }));

    // Generate AI response
    const provider = getProviderForModel(modelInfo.id);
    const aiResponse = await provider.chat(aiMessages, {
      model: modelInfo.modelCode,
      systemPrompt,
    });

    // Save AI message
    const assistantMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: aiResponse.content,
      },
    });

    // Save Usage
    await prisma.aIUsage.create({
      data: {
        conversationId,
        userId: auth.user.id,
        provider: modelInfo.providerId,
        model: aiResponse.modelUsed,
        totalTokens: aiResponse.tokensUsed || 0,
      },
    });

    return NextResponse.json({ message: assistantMessage, userMessage });
  } catch (err: any) {
    console.error("Error creating message:", err);
    if (
      typeof err?.statusCode === "number" &&
      typeof err?.code === "string" &&
      err.code.startsWith("NVIDIA_") &&
      typeof err?.message === "string"
    ) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }
    return jsonError("Failed to generate response", 500);
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
      return jsonError("Forbidden: you cannot delete messages in another user's conversation", 403);
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (messageId) {
      const message = await prisma.aIMessage.findFirst({
        where: { id: messageId, conversationId },
      });

      if (!message) {
        return jsonError("Message not found", 404);
      }

      await prisma.aIMessage.delete({
        where: { id: messageId },
      });

      return NextResponse.json({ success: true, messageId });
    }

    // Delete all messages in this conversation (clear history)
    await prisma.aIMessage.deleteMany({
      where: { conversationId },
    });

    return NextResponse.json({ success: true, cleared: true });
  } catch (err: any) {
    console.error("Error deleting message:", err);
    return jsonError("Failed to delete message", 500);
  }
}
