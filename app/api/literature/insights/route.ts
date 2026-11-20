import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeScholarXivPaper,
  generateApaCitation,
  generateBibtex,
  type ScholarXivPaper,
} from "@/lib/scholarxiv";
import { FEATURES } from "@/lib/config/features";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "RESEARCHER") {
      return NextResponse.json(
        { error: "Access denied. Only researchers can generate literature insights." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const paper = normalizeScholarXivPaper(body.paper);
    if (!paper) {
      return NextResponse.json({ error: "A valid ScholarXiv paper is required." }, { status: 400 });
    }

    let aiInsights: string | null = null;

    if (FEATURES.AI_EXTERNAL_ENABLED && process.env.GEMINI_API_KEY) {
      try {
        const { executeAIChat } = await import("@/lib/ai/execution");
        const systemPrompt = `You are a research methodology assistant on Tinat, Ethiopia's scientific data collection and research platform.
Analyze the following arXiv research paper from ScholarXiv and produce actionable research insights for an Ethiopian researcher planning a field study or preparing a publication.
Keep your analysis structured, clear, and directly applicable.`;

        const userPrompt = `Title: ${paper.title}
Authors: ${paper.authors.join(", ")}
arXiv ID: ${paper.arxivId}
Categories: ${paper.categories.join(", ")}
Abstract: ${paper.abstract}

Please provide:
1. Core Methodological Insight & Findings
2. Relevance to Ethiopian / Low-Resource Field Research
3. 3-4 Suggested Survey Questions or Measurement Indicators for a Tinat Study
4. Ready-to-use Background Rationale Paragraph citing this paper`;

        const res = await executeAIChat({
          modelId: "gemini",
          messages: [{ role: "user", content: userPrompt }],
          systemPrompt,
          temperature: 0.3,
        });

        if (res.content?.trim()) {
          aiInsights = res.content.trim();
        }
      } catch (err) {
        console.warn("AI generation failed, falling back to structured synthesis:", err);
      }
    }

    // Heuristic structured synthesis fallback (works even without external AI)
    const firstAuthor = paper.authors[0] || "The authors";
    const year = paper.publishedAt ? new Date(paper.publishedAt).getFullYear() : "recent studies";
    const primaryCat = paper.primaryCategory || "multidisciplinary research";

    const structuredSummary = {
      aiContent: aiInsights,
      paperTitle: paper.title,
      arxivId: paper.arxivId,
      apaCitation: generateApaCitation(paper),
      bibtexCitation: generateBibtex(paper),
      studyRationale: `According to ${firstAuthor} et al. (${year}), investigation of "${paper.title}" (arXiv:${paper.arxivId}) established empirical benchmarks in ${primaryCat}. This study integrates these foundational findings into localized questionnaire design and field participant measurement on Tinat.`,
      recommendedQuestions: [
        {
          text: `To what extent have you experienced or observed the factors discussed in "${paper.title}" in your community?`,
          type: "LINEAR_SCALE",
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: "Never / Strongly Disagree",
          scaleMaxLabel: "Frequently / Strongly Agree",
        },
        {
          text: `Which of the following barriers or indicators are most significant in your local context?`,
          type: "MULTIPLE_CHOICE",
          options: [
            "Access to specialized infrastructure / services",
            "Information and literacy barriers",
            "Resource or financial constraints",
            "Cultural or community adaptation factors",
          ],
        },
        {
          text: `Please describe any specific community challenges or unique conditions relevant to this research topic:`,
          type: "LONG_TEXT",
        },
      ],
      contextualNote: `When deploying field collection in Ethiopia for studies inspired by arXiv:${paper.arxivId}, ensure questionnaires are localized into Amharic, Afaan Oromo, or Tigrinya, and utilize Tinat offline-cached field collectors in low-connectivity areas.`,
    };

    return NextResponse.json({
      paper,
      insights: structuredSummary,
    });
  } catch (error) {
    console.error("POST /api/literature/insights error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate literature insights." },
      { status: 500 }
    );
  }
}
