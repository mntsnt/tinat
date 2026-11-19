import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getPlatformIntelligenceSummary,
  formatPlatformIntelligencePrompt,
  generateLocalPlatformAnswer,
} from "@/lib/ai/admin-platform-intelligence";
import { getAIModel } from "@/lib/ai/models";
import { getProviderForModel, isAIModelConfigured } from "@/lib/ai/providers";
import { FEATURES } from "@/lib/config/features";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, name: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { content, conversationId: requestedConvId, model = "gemini" } = body as {
      content?: string;
      conversationId?: string;
      model?: string;
    };

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Message content is required." }, { status: 400 });
    }

    const trimmedContent = content.trim();

    // 1. Get or create conversation
    let conversationId = requestedConvId;
    if (!conversationId) {
      const title =
        trimmedContent.length > 50
          ? `${trimmedContent.slice(0, 47).trimEnd()}...`
          : trimmedContent;

      const newConv = await prisma.aIConversation.create({
        data: {
          userId: admin.id,
          title,
          provider: "GEMINI",
          model,
        },
      });
      conversationId = newConv.id;
    }

    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId,
        role: "USER",
        content: trimmedContent,
      },
    });

    // 2. Fetch live real-time platform statistics
    const stats = await getPlatformIntelligenceSummary();
    const systemPrompt = formatPlatformIntelligencePrompt(stats);

    // 3. Attempt LLM execution with graceful deterministic local fallback
    let replyText = "";
    const modelInfo = getAIModel(model);

    const canUseExternalAI =
      FEATURES.AI_EXTERNAL_ENABLED &&
      modelInfo &&
      isAIModelConfigured(modelInfo.id);

    if (canUseExternalAI) {
      try {
        const history = await prisma.aIMessage.findMany({
          where: { conversationId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 12,
        });

        const aiMessages = history.reverse().map((msg) => ({
          role: msg.role.toLowerCase() as "user" | "assistant" | "system" | "tool",
          content: msg.content,
        }));

        const provider = getProviderForModel(modelInfo.id);
        const aiResponse = await provider.chat(aiMessages, {
          model: modelInfo.modelCode,
          systemPrompt,
          temperature: 0.2,
        });

        replyText = aiResponse.content;
      } catch (err) {
        console.warn("External AI call failed in Admin AI, using local intelligence engine:", err);
        replyText = generateLocalPlatformAnswer(trimmedContent, stats);
      }
    } else {
      // Local operational intelligence fallback
      replyText = generateLocalPlatformAnswer(trimmedContent, stats);
    }

    // Save Assistant message
    const assistantMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: replyText,
      },
    });

    // Update conversation updatedAt
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), model: modelInfo?.id || model },
    });

    return NextResponse.json({
      conversationId,
      message: assistantMessage,
      summary: {
        totalUsers: stats.users.total,
        activeStudies: stats.studies.active,
        totalForms: stats.forms.total,
        pendingVerifications: stats.verifications.pending,
      },
    });
  } catch (error) {
    console.error("Admin AI Chat error:", error);
    return NextResponse.json({ error: "Failed to process question." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        title: true,
        model: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Fetch Admin AI conversations error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      await prisma.aIMessage.deleteMany({ where: { conversationId } });
      await prisma.aIConversation.delete({ where: { id: conversationId } });
    } else {
      const convs = await prisma.aIConversation.findMany({
        where: { userId: session.userId },
        select: { id: true },
      });
      const ids = convs.map((c) => c.id);
      await prisma.aIMessage.deleteMany({ where: { conversationId: { in: ids } } });
      await prisma.aIConversation.deleteMany({ where: { userId: session.userId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Admin AI conversation error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
