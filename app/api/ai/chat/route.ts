import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeStudyStatistics } from "@/lib/ai/data-analysis";
import { formatStudyContext } from "@/lib/ai/context";
import { MEDICAL_RESEARCH_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { generateGeminiChatResponse, ChatMessage } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required to access the AI Research Assistant." },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const { studyId, message, history = [] } = body as {
      studyId?: string;
      message?: string;
      history?: ChatMessage[];
    };

    if (!studyId || typeof studyId !== "string") {
      return NextResponse.json({ error: "A valid studyId is required." }, { status: 400 });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "A message is required." }, { status: 400 });
    }

    // 3. Fetch study with questions and responses
    const study = await prisma.study.findUnique({
      where: { id: studyId },
      include: {
        questions: {
          include: { options: true, rows: true },
          orderBy: { order: "asc" },
        },
        responses: {
          include: { answers: true },
          orderBy: { submittedAt: "asc" },
        },
      },
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    // 4. Enforce strict researcher authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (study.researcherId !== session.userId && currentUser?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. You can only analyze studies that you own." },
        { status: 403 }
      );
    }

    if (study.responses.length === 0) {
      return NextResponse.json(
        {
          error: "No participant responses have been recorded yet. The research assistant requires study data.",
        },
        { status: 400 }
      );
    }

    // 5. Compute deterministic summary and format context
    const summary = computeStudyStatistics(study);
    const contextText = formatStudyContext(summary);

    // Dynamic system prompt combining general medical research rules + specific study dataset
    const studySystemPrompt = `${MEDICAL_RESEARCH_SYSTEM_PROMPT}

=======================================================
CURRENT AUTHORIZED STUDY DATASET (STRICT GROUNDING CONTEXT):
${contextText}
=======================================================
Always ground your answers in the numbers and distributions above. If the user asks about a variable, relationship, or subgroup not collected in the data, state clearly: "The available dataset is insufficient to determine this."
`;

    // 6. Sanitize and cap conversation history (last 10 messages)
    const sanitizedHistory: ChatMessage[] = Array.isArray(history)
      ? history.slice(-10).map((h) => ({
          role: h.role === "assistant" || h.role === "model" ? "model" : "user",
          content: String(h.content || "").slice(0, 3000),
        }))
      : [];

    // Append current user message
    sanitizedHistory.push({
      role: "user",
      content: message.trim().slice(0, 2000),
    });

    // 7. Invoke Gemini multi-turn conversation
    const aiResult = await generateGeminiChatResponse({
      systemPrompt: studySystemPrompt,
      messages: sanitizedHistory,
      temperature: 0.25,
    });

    return NextResponse.json({
      success: true,
      reply: aiResult.content,
      modelUsed: aiResult.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("AI Chat API Error:", err);
    const status = err?.statusCode || 500;
    const message = err?.message || "An error occurred in the AI Research Assistant.";

    return NextResponse.json(
      {
        error: message,
        code: err?.code || "INTERNAL_ERROR",
      },
      { status }
    );
  }
}
