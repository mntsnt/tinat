import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { QuestionType } from "@/generated/prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in to view your forms." }, { status: 401 });
    }

    const forms = await prisma.study.findMany({
      where: {
        researcherId: session.userId,
        category: "Tinat Form",
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in to create a Tinat Form." }, { status: 401 });
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
        studyType: "FREE_DATA_COLLECTION",
        category: "Tinat Form",
        tags: ["Tinat Form", "Public Survey"],
        rewardCredits: 0,
        budgetCredits: 0,
        creditsPaid: 0,
        participantTarget: 0,
        estimatedMinutes: 3,
        researcherId: session.userId,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            text: q.text.trim(),
            type: (q.type || "SHORT_TEXT") as QuestionType,
            required: q.required ?? false,
            order: idx,
            scaleMin: q.scaleMin,
            scaleMax: q.scaleMax,
            scaleMinLabel: q.scaleMinLabel,
            scaleMaxLabel: q.scaleMaxLabel,
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

    return NextResponse.json({ success: true, form });
  } catch (error) {
    console.error("Create form error:", error);
    return NextResponse.json({ error: "Failed to create form." }, { status: 500 });
  }
}
