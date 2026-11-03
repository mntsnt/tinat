import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { jsonError, validateBody } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { getProviderForModel } from "@/lib/ai/providers";
import { MEDICAL_RESEARCH_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { computeStudyStatistics } from "@/lib/ai/data-analysis";
import { formatStudyContext } from "@/lib/ai/context";
import { AVAILABLE_MODELS } from "@/lib/ai/models";
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

    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId,
        role: "USER",
        content,
      },
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
    const modelInfo =
      AVAILABLE_MODELS.find(
        (model) => model.id === conversation.model || model.modelCode === conversation.model
      ) || AVAILABLE_MODELS[0];
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
    const providerEnum = modelInfo.provider.toLowerCase().includes("google")
      ? "GEMINI"
      : "OPENROUTER";
    await prisma.aIUsage.create({
      data: {
        conversationId,
        userId: auth.user.id,
        provider: providerEnum as any,
        model: aiResponse.modelUsed,
        totalTokens: aiResponse.tokensUsed || 0,
      },
    });

    return NextResponse.json({ message: assistantMessage });
  } catch (err: any) {
    console.error("Error creating message:", err);
    return jsonError("Failed to generate response", 500);
  }
}
