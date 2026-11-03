import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { resolveEffectiveLocale, SupportedLocale } from "@/lib/i18n";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studyId } = await params;
    const url = new URL(request.url);
    const lang = url.searchParams.get("lang") || "en";

    // Check study exists
    const study = await prisma.study.findUnique({
      where: { id: studyId },
      select: { id: true, title: true, description: true, objective: true, safetyProtocolText: true },
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    // Find all languages available for this study
    const existingTranslations = await prisma.studyTranslation.findMany({
      where: { studyId },
      select: { language: true },
    });
    const availableLanguages = Array.from(new Set(["en", ...existingTranslations.map((t) => t.language)]));

    if (lang === "en") {
      return NextResponse.json({
        studyId,
        language: "en",
        availableLanguages,
        study: {
          title: study.title,
          description: study.description,
          objective: study.objective,
          safetyProtocolText: study.safetyProtocolText,
        },
        questions: {},
      });
    }

    // Fetch study translation
    const studyTrans = await prisma.studyTranslation.findUnique({
      where: {
        studyId_language: {
          studyId,
          language: lang,
        },
      },
    });

    // Fetch question translations
    const questionTrans = await prisma.questionTranslation.findMany({
      where: {
        language: lang,
        question: { studyId },
      },
    });

    const questionMap: Record<string, { text: string; options?: any }> = {};
    for (const qt of questionTrans) {
      questionMap[qt.questionId] = {
        text: qt.text,
        options: qt.options,
      };
    }

    return NextResponse.json({
      studyId,
      language: lang,
      availableLanguages,
      study: studyTrans
        ? {
            title: studyTrans.title,
            description: studyTrans.description || study.description,
            objective: studyTrans.objective || study.objective,
            safetyProtocolText: studyTrans.safetyProtocolText || study.safetyProtocolText,
          }
        : {
            title: study.title,
            description: study.description,
            objective: study.objective,
            safetyProtocolText: study.safetyProtocolText,
          },
      questions: questionMap,
    });
  } catch (error) {
    console.error("GET /api/studies/[id]/translations error:", error);
    return NextResponse.json({ error: "Failed to load study translations." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studyId } = await params;
    const auth = await requireStudyOwnerOrAdmin(studyId, request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { language, title, description, objective, safetyProtocolText, questions } = body;

    if (!language || typeof language !== "string") {
      return NextResponse.json({ error: "Language code is required." }, { status: 400 });
    }

    const normLang = language.toLowerCase().trim();

    await prisma.$transaction(async (tx) => {
      // Upsert Study Translation
      if (title) {
        await tx.studyTranslation.upsert({
          where: {
            studyId_language: {
              studyId,
              language: normLang,
            },
          },
          create: {
            studyId,
            language: normLang,
            title: title.trim(),
            description: description ? description.trim() : null,
            objective: objective ? objective.trim() : null,
            safetyProtocolText: safetyProtocolText ? safetyProtocolText.trim() : null,
          },
          update: {
            title: title.trim(),
            description: description ? description.trim() : null,
            objective: objective ? objective.trim() : null,
            safetyProtocolText: safetyProtocolText ? safetyProtocolText.trim() : null,
          },
        });
      }

      // Upsert Question Translations if provided
      if (Array.isArray(questions)) {
        for (const q of questions) {
          if (!q.questionId || !q.text) continue;
          await tx.questionTranslation.upsert({
            where: {
              questionId_language: {
                questionId: q.questionId,
                language: normLang,
              },
            },
            create: {
              questionId: q.questionId,
              language: normLang,
              text: q.text.trim(),
              options: q.options || undefined,
            },
            update: {
              text: q.text.trim(),
              options: q.options || undefined,
            },
          });
        }
      }
    });

    return NextResponse.json({ ok: true, studyId, language: normLang });
  } catch (error) {
    console.error("POST /api/studies/[id]/translations error:", error);
    return NextResponse.json({ error: "Failed to save study translations." }, { status: 500 });
  }
}
