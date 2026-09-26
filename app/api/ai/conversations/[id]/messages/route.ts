import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProviderForModel } from "@/lib/ai/providers";
import { MEDICAL_RESEARCH_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { computeStudyStatistics } from "@/lib/ai/data-analysis";
import { formatStudyContext } from "@/lib/ai/context";
import { AVAILABLE_MODELS } from "@/lib/ai/models";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.aIMessage.findMany({
      where: {
        conversationId,
        conversation: { userId: session.userId }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("Error fetching messages:", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId, userId: session.userId },
      include: { study: { include: { questions: { include: { options: true, rows: true } }, responses: { include: { answers: true } } } } }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Save user message
    const userMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: "USER",
        content,
      }
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
      orderBy: { createdAt: 'asc' },
      take: 20 // Keep last 20 messages for context
    });

    const aiMessages = history.map(msg => ({
      role: msg.role.toLowerCase() as "user" | "assistant" | "system" | "tool",
      content: msg.content
    }));

    // Generate AI response
    const provider = getProviderForModel(conversation.model || "gemini");
    const aiResponse = await provider.chat(aiMessages, {
      model: conversation.model || "gemini-3.6-flash",
      systemPrompt,
    });

    // Save AI message
    const assistantMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: aiResponse.content,
      }
    });

    // Save Usage
    const providerEnum = AVAILABLE_MODELS.find(m => m.id === conversation.model)?.provider.toLowerCase().includes("google") ? "GEMINI" : "OPENROUTER";
    await prisma.aIUsage.create({
      data: {
        conversationId,
        userId: session.userId,
        provider: providerEnum as any,
        model: aiResponse.modelUsed,
        totalTokens: aiResponse.tokensUsed || 0,
      }
    });

    return NextResponse.json({ message: assistantMessage });
  } catch (err: any) {
    console.error("Error creating message:", err);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
