import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const form = await prisma.study.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                text: true,
                value: true,
                order: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        researcher: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!form || form.category !== "Tinat Form") {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.status,
        author: form.researcher.name,
        questions: form.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          required: q.required,
          order: q.order,
          scaleMin: q.scaleMin,
          scaleMax: q.scaleMax,
          scaleMinLabel: q.scaleMinLabel,
          scaleMaxLabel: q.scaleMaxLabel,
          options: q.options,
        })),
      },
    });
  } catch (error) {
    console.error("Public fetch form error:", error);
    return NextResponse.json({ error: "Failed to load form" }, { status: 500 });
  }
}
