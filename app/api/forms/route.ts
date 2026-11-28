import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import type { QuestionType } from "@/generated/prisma/client";

export async function GET(req: Request) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const forms = await prisma.study.findMany({
      where: {
        researcherId: user.id,
        OR: [
          { category: "Tinat Form" },
          { tags: { has: "Tinat Form" } },
        ],
      },
      include: {
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("Fetch forms error:", error);
    return NextResponse.json({ error: "Failed to load forms." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const body = await req.json();
    const { title, description, questions, coverImageUrl, coverImageAspect } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Form title is required." }, { status: 400 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Please add at least one question to your form." }, { status: 400 });
    }

    for (const q of questions) {
      if (!q.text || typeof q.text !== "string" || !q.text.trim()) {
        return NextResponse.json({ error: "Every question must have question text." }, { status: 400 });
      }
    }

    const validQuestionTypes = new Set([
      "SHORT_TEXT",
      "LONG_TEXT",
      "SINGLE_CHOICE",
      "MULTIPLE_CHOICE",
      "NUMBER",
      "YES_NO",
      "DATE",
      "DROPDOWN",
      "LINEAR_SCALE",
    ]);

    const form = await prisma.study.create({
      data: {
        title: title.trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        coverImageUrl:
          typeof coverImageUrl === "string" &&
          (coverImageUrl.startsWith("data:image/") || coverImageUrl.startsWith("/") || coverImageUrl.startsWith("http"))
            ? coverImageUrl
            : null,
        coverImageAspect: ["16:9", "1:1", "4:3", "3:4"].includes(coverImageAspect) ? coverImageAspect : "16:9",
        bannerTheme: "canopy",
        status: "ACTIVE", // Forms are immediately active & ready to receive responses
        studyType: "SURVEY",
        fundingType: "FREE",
        category: "Tinat Form",
        tags: ["Tinat Form", "Public Survey"],
        creditPerResponse: 0,
        creditBudget: 0,
        creditsSpent: 0,
        rewardCredits: 0,
        budgetCredits: 0,
        creditsPaid: 0,
        participantTarget: 0,
        estimatedMinutes: 3,
        researcherId: user.id,
        ethicsExempt: true,
        ethicsExemptionReason: "Tinat Form: Public volunteer survey exempt from IRB",
        questions: {
          create: questions.map((q: any, idx: number) => {
            const rawType = typeof q.type === "string" ? q.type.trim() : "SHORT_TEXT";
            const qType = validQuestionTypes.has(rawType) ? (rawType as QuestionType) : "SHORT_TEXT";

            let optionsList: { text: string; value: string; order: number; imageUrl?: string }[] = [];
            if (Array.isArray(q.options) && q.options.length > 0) {
              optionsList = q.options
                .map((opt: unknown, optIdx: number) => {
                  const text = typeof opt === "string" ? opt.trim() : "";
                  const imageUrl = Array.isArray(q.optionImages) && typeof q.optionImages[optIdx] === "string" && q.optionImages[optIdx].startsWith("data:image/")
                    ? q.optionImages[optIdx]
                    : undefined;
                  return text ? { text, value: text, order: optIdx, imageUrl } : null;
                })
                .filter((opt: { text: string; value: string; order: number; imageUrl?: string } | null): opt is { text: string; value: string; order: number; imageUrl?: string } => Boolean(opt));
            } else if (qType === "YES_NO") {
              optionsList = [
                { text: "Yes", value: "Yes", order: 0 },
                { text: "No", value: "No", order: 1 },
              ];
            }

            const scaleMinNum = q.scaleMin !== undefined && q.scaleMin !== null && !isNaN(Number(q.scaleMin))
              ? Math.round(Number(q.scaleMin))
              : null;
            const scaleMaxNum = q.scaleMax !== undefined && q.scaleMax !== null && !isNaN(Number(q.scaleMax))
              ? Math.round(Number(q.scaleMax))
              : null;

            return {
              text: q.text.trim(),
              type: qType,
              required: Boolean(q.required),
              order: idx,
              imageUrl: typeof q.imageUrl === "string" && q.imageUrl.startsWith("data:image/") ? q.imageUrl : null,
              imageAspect: ["16:9", "1:1", "4:3", "3:4"].includes(q.imageAspect) ? q.imageAspect : "4:3",
              scaleMin: scaleMinNum,
              scaleMax: scaleMaxNum,
              scaleMinLabel: typeof q.scaleMinLabel === "string" && q.scaleMinLabel.trim() ? q.scaleMinLabel.trim() : null,
              scaleMaxLabel: typeof q.scaleMaxLabel === "string" && q.scaleMaxLabel.trim() ? q.scaleMaxLabel.trim() : null,
              options: {
                create: optionsList,
              },
            };
          }),
        },
      },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: "STUDY_CREATED",
      description: `Created Tinat Form "${form.title}"`,
      resourceId: form.id,
      resourceType: "Study",
    });

    return NextResponse.json({ success: true, form });
  } catch (error: any) {
    console.error("Create form error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create form." },
      { status: 500 }
    );
  }
}
