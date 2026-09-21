import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeStudyStatistics } from "@/lib/ai/data-analysis";
import { formatStudyContext, generateSuggestedQuestions } from "@/lib/ai/context";
import {
  MEDICAL_RESEARCH_SYSTEM_PROMPT,
  ACTION_PROMPTS,
  AnalysisAction,
} from "@/lib/ai/prompts";
import { executeAIAnalysis } from "@/lib/ai/models";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required to access AI Research Analysis." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const { studyId, action, model } = body as {
      studyId?: string;
      action?: AnalysisAction;
      model?: string;
    };

    if (!studyId || typeof studyId !== "string") {
      return NextResponse.json({ error: "A valid studyId is required." }, { status: 400 });
    }

    const validActions: AnalysisAction[] = [
      "summarize_findings",
      "analyze_demographics",
      "identify_patterns",
      "compare_groups",
      "analyze_missing_data",
      "identify_limitations",
      "generate_abstract",
      "generate_discussion",
    ];

    const selectedAction: AnalysisAction = validActions.includes(action as AnalysisAction)
      ? (action as AnalysisAction)
      : "summarize_findings";

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

    // 4. Enforce strict researcher ownership / authorization
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

    // 5. Check if study has responses
    if (study.responses.length === 0) {
      return NextResponse.json(
        {
          error: "No participant responses have been recorded yet. AI analysis requires empirical data.",
          totalResponses: 0,
        },
        { status: 400 }
      );
    }

    // 6. Execute deterministic statistical analysis pipeline
    const summary = computeStudyStatistics(study);
    const contextText = formatStudyContext(summary);
    const userPrompt = ACTION_PROMPTS[selectedAction](contextText);

    // 7. Invoke selected AI engine (Google Gemini or NVIDIA Nemotron)
    const aiResult = await executeAIAnalysis({
      modelId: model,
      systemPrompt: MEDICAL_RESEARCH_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.2, // Conservative, highly factual
    });

    // 8. Return structured research response
    return NextResponse.json({
      success: true,
      action: selectedAction,
      analysis: aiResult.content,
      modelUsed: aiResult.modelUsed,
      summary: {
        studyId: summary.studyId,
        title: summary.title,
        totalResponses: summary.totalResponses,
        participantTarget: summary.participantTarget,
        completionRate: summary.completionRate,
        questionCount: summary.questionCount,
        dataQualityIssues: summary.dataQualityIssues,
      },
      suggestedQuestions: generateSuggestedQuestions(summary),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("AI Analysis API Error:", err);
    const status = err?.statusCode || 500;
    const message = err?.message || "An unexpected error occurred during AI Research Analysis.";

    return NextResponse.json(
      {
        error: message,
        code: err?.code || "INTERNAL_ERROR",
      },
      { status }
    );
  }
}
