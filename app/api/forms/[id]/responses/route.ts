import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const form = await prisma.study.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
        responses: {
          include: {
            answers: true,
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    const isTinatForm = form && (form.category === "Tinat Form" || (Array.isArray(form.tags) && form.tags.includes("Tinat Form")));
    if (!form || !isTinatForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.researcherId !== session.userId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.status,
        createdAt: form.createdAt,
      },
      questions: form.questions,
      responses: form.responses.map((resp, idx) => ({
        id: resp.id,
        respondentCode: resp.respondentCode,
        participantName: resp.respondentCode
          ? `Resp ${resp.respondentCode.replace("resp_", "").slice(0, 8).toUpperCase()}`
          : `Respondent #${idx + 1}`,
        isGuest: resp.collectionMethod === "SELF",
        collectionMethod: resp.collectionMethod,
        submittedAt: resp.submittedAt,
        answers: resp.answers.reduce((acc, ans) => {
          acc[ans.questionId] = {
            textValue: ans.textValue,
            numberValue: ans.numberValue,
          };
          return acc;
        }, {} as Record<string, { textValue: string | null; numberValue: number | null }>),
      })),
      totalResponses: form.responses.length,
    });
  } catch (error) {
    console.error("Fetch form responses error:", error);
    return NextResponse.json({ error: "Failed to load responses" }, { status: 500 });
  }
}
