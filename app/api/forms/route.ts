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

    if (user.role !== "RESEARCHER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Participants cannot create research forms. Only researchers and administrators have permission." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, questions } = body;

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

    const form = await prisma.study.create({
      data: {
        title: title.trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : null,
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
        questions: {
          create: questions.map((q: any, idx: number) => ({
            text: q.text.trim(),
            type: (q.type || "SHORT_TEXT") as QuestionType,
            required: Boolean(q.required),
            order: idx,
            scaleMin: q.scaleMin !== undefined && q.scaleMin !== null ? Number(q.scaleMin) : null,
            scaleMax: q.scaleMax !== undefined && q.scaleMax !== null ? Number(q.scaleMax) : null,
            scaleMinLabel: typeof q.scaleMinLabel === "string" && q.scaleMinLabel.trim() ? q.scaleMinLabel.trim() : null,
            scaleMaxLabel: typeof q.scaleMaxLabel === "string" && q.scaleMaxLabel.trim() ? q.scaleMaxLabel.trim() : null,
            options: {
              create: Array.isArray(q.options)
                ? q.options
                    .filter((opt: string) => typeof opt === "string" && opt.trim())
                    .map((opt: string, optIdx: number) => ({
                      text: opt.trim(),
                      value: opt.trim(),
                      order: optIdx,
                    }))
                : [],
            },
          })),
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
  } catch (error) {
    console.error("Create form error:", error);
    return NextResponse.json({ error: "Failed to create form." }, { status: 500 });
  }
}
