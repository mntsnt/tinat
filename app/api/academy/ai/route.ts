import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { getLessonBySlug, getModuleBySlug } from "@/lib/academy/content";
import { FEATURES } from "@/lib/config/features";
import { executeAIChat } from "@/lib/ai/execution";
import { getAIModel } from "@/lib/ai/models";
import { isAIModelConfigured } from "@/lib/ai/providers";
import type { ChatMessage } from "@/lib/ai/gemini";

const ACADEMY_TUTOR_PROMPT = `You are Tinat Academy's AI study assistant. Help researchers learn the module material with clear explanations, clarifications, examples, summaries, and connections to research practice.

Use the provided Tinat Academy module and lesson as your primary source. Explain concepts in an approachable, academically careful way. If the supplied material does not answer a question, say so clearly and distinguish general background knowledge from what the course itself says. Do not invent course details, citations, or facts.

This is educational support, not individualized medical advice or diagnosis. Do not request or expose identifiable participant or patient data.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Sign in to use the Academy AI assistant." }, { status: 401 });
  }

  const rateCheck = checkRateLimit(request, "CHAT", session.userId);
  if (!rateCheck.allowed) return rateCheck.response;

  if (!FEATURES.AI_EXTERNAL_ENABLED) {
    return NextResponse.json(
      {
        error:
          "The AI assistant is disabled until external AI processing is enabled and approved.",
        code: "AI_EXTERNAL_DISABLED",
      },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "A request body is required." }, { status: 400 });
  }

  const { moduleSlug, lessonSlug, message, history } = body;
  if (
    typeof moduleSlug !== "string" ||
    moduleSlug.length > 100 ||
    typeof lessonSlug !== "string" ||
    lessonSlug.length > 100
  ) {
    return NextResponse.json({ error: "A valid module and lesson are required." }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim() || message.length > 2000) {
    return NextResponse.json(
      { error: "Your question must be between 1 and 2,000 characters." },
      { status: 400 }
    );
  }
  if (history !== undefined && !Array.isArray(history)) {
    return NextResponse.json({ error: "Conversation history must be a list." }, { status: 400 });
  }

  const lessonResult = getLessonBySlug(moduleSlug, lessonSlug);
  const academyModule = getModuleBySlug(moduleSlug);
  if (!lessonResult || !academyModule) {
    return NextResponse.json({ error: "The requested Academy lesson was not found." }, { status: 404 });
  }

  const model = getAIModel("gemini");
  if (!model || !isAIModelConfigured(model.id)) {
    return NextResponse.json(
      { error: "The Academy AI service is not configured. Please contact the platform administrator." },
      { status: 503 }
    );
  }

  const sanitizedHistory: ChatMessage[] = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-10)) {
      if (
        !isRecord(item) ||
        (item.role !== "user" && item.role !== "assistant" && item.role !== "model") ||
        typeof item.content !== "string"
      ) {
        return NextResponse.json({ error: "Conversation history contains an invalid message." }, { status: 400 });
      }

      sanitizedHistory.push({
        role: item.role,
        content: item.content.slice(0, 2000),
      });
    }
  }

  const { lesson } = lessonResult;
  const lessonContent = lesson.sections
    .map((section) => {
      const callout = section.callout
        ? `\n${section.callout.title}: ${section.callout.content}`
        : "";
      return `## ${section.title}\n${section.content}${callout}`;
    })
    .join("\n\n");
  const contextLimit = 12000;
  const courseContext = `MODULE: ${academyModule.title}
MODULE SUMMARY: ${academyModule.summary}
MODULE LEARNING OBJECTIVES:
${academyModule.learningObjectives.map((objective) => `- ${objective}`).join("\n")}
LESSONS IN THIS MODULE:
${academyModule.lessons.map((item) => `${item.orderIndex}. ${item.title}`).join("\n")}

CURRENT LESSON: ${lesson.title}
CURRENT LESSON OBJECTIVES:
${lesson.learningObjectives.map((objective) => `- ${objective}`).join("\n")}
LESSON MATERIAL:
${lessonContent.slice(0, contextLimit)}${lessonContent.length > contextLimit ? "\n[Lesson content truncated]" : ""}`;

  sanitizedHistory.push({ role: "user", content: message.trim().slice(0, 2000) });

  try {
    const response = await executeAIChat({
      modelId: model.id,
      systemPrompt: `${ACADEMY_TUTOR_PROMPT}\n\nCOURSE CONTEXT:\n${courseContext}`,
      messages: sanitizedHistory,
      temperature: 0.35,
    });

    return NextResponse.json({
      success: true,
      reply: response.content,
      modelUsed: response.modelUsed,
    });
  } catch (error) {
    console.error("Academy AI request failed:", error);
    const errorRecord = isRecord(error) ? error : {};
    const statusCode =
      typeof errorRecord.statusCode === "number" &&
      errorRecord.statusCode >= 400 &&
      errorRecord.statusCode < 600
        ? errorRecord.statusCode
        : 500;
    const errorMessage =
      error instanceof Error && statusCode !== 500
        ? error.message
        : "The AI assistant could not complete your request. Please try again.";

    return NextResponse.json(
      {
        error: errorMessage,
        code: typeof errorRecord.code === "string" ? errorRecord.code : "ACADEMY_AI_ERROR",
      },
      { status: statusCode }
    );
  }
}
