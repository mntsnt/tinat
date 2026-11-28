import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import type { QuestionType } from "@/generated/prisma/client";

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
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    const isTinatForm = form && (form.category === "Tinat Form" || (Array.isArray(form.tags) && form.tags.includes("Tinat Form")));
    if (!form || !isTinatForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Ensure the user owns this form
    if (form.researcherId !== session.userId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error("Fetch form details error:", error);
    return NextResponse.json({ error: "Failed to load form" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const body = await req.json();

    const existingForm = await prisma.study.findUnique({
      where: { id },
    });

    const isTinatForm = existingForm && (existingForm.category === "Tinat Form" || (Array.isArray(existingForm.tags) && existingForm.tags.includes("Tinat Form")));
    if (!existingForm || !isTinatForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (existingForm.researcherId !== session.userId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (body.title && typeof body.title === "string") {
      updateData.title = body.title.trim();
    }
    if (typeof body.description === "string") {
      updateData.description = body.description.trim() || null;
    }
    if (
      typeof body.coverImageUrl === "string" &&
      (body.coverImageUrl.startsWith("data:image/") || body.coverImageUrl.startsWith("/") || body.coverImageUrl.startsWith("http"))
    ) {
      updateData.coverImageUrl = body.coverImageUrl;
    } else if (body.coverImageUrl === null) {
      updateData.coverImageUrl = null;
    }
    if (["16:9", "1:1", "4:3", "3:4"].includes(body.coverImageAspect)) {
      updateData.coverImageAspect = body.coverImageAspect;
    }

    if (Array.isArray(body.questions)) {
      await prisma.$transaction(async (tx) => {
        await tx.question.deleteMany({ where: { studyId: id } });
        await tx.question.createMany({
          data: body.questions.map((q: any, idx: number) => ({
            studyId: id,
            text: String(q.text || "").trim(),
            type: ([
              "SHORT_TEXT", "LONG_TEXT", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "NUMBER",
              "YES_NO", "DATE", "DROPDOWN", "LINEAR_SCALE",
            ].includes(q.type) ? q.type : "SHORT_TEXT") as QuestionType,
            required: Boolean(q.required),
            order: idx,
            scaleMin: q.type === "LINEAR_SCALE" ? Number(q.scaleMin) || 1 : null,
            scaleMax: q.type === "LINEAR_SCALE" ? Number(q.scaleMax) || 5 : null,
            scaleMinLabel: q.type === "LINEAR_SCALE" ? String(q.scaleMinLabel || "") : null,
            scaleMaxLabel: q.type === "LINEAR_SCALE" ? String(q.scaleMaxLabel || "") : null,
            imageUrl: typeof q.imageUrl === "string" && q.imageUrl.startsWith("data:image/") ? q.imageUrl : null,
            imageAspect: ["16:9", "1:1", "4:3", "3:4"].includes(q.imageAspect) ? q.imageAspect : "4:3",
          })),
        });
        const createdQuestions = await tx.question.findMany({
          where: { studyId: id },
          orderBy: { order: "asc" },
        });
        for (let idx = 0; idx < createdQuestions.length; idx++) {
          const q = body.questions[idx];
          const choices = Array.isArray(q.options) ? q.options.filter((option: unknown) => typeof option === "string" && String(option).trim()) : [];
          if (q.type === "YES_NO") choices.splice(0, choices.length, "Yes", "No");
          if (choices.length > 0) {
            await tx.questionOption.createMany({
              data: choices.map((option: string, optionIndex: number) => ({
                questionId: createdQuestions[idx].id,
                text: option.trim(),
                value: option.trim(),
                order: optionIndex,
                imageUrl: Array.isArray(q.optionImages) && typeof q.optionImages[optionIndex] === "string" && q.optionImages[optionIndex].startsWith("data:image/")
                  ? q.optionImages[optionIndex]
                  : null,
              })),
            });
          }
        }
      });
    }
    if (body.status && ["ACTIVE", "PAUSED"].includes(body.status)) {
      updateData.status = body.status;
    }

    const updated = await prisma.study.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, form: updated });
  } catch (error) {
    console.error("Update form error:", error);
    return NextResponse.json({ error: "Failed to update form" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;

    const existingForm = await prisma.study.findUnique({
      where: { id },
    });

    const isTinatForm = existingForm && (existingForm.category === "Tinat Form" || (Array.isArray(existingForm.tags) && existingForm.tags.includes("Tinat Form")));
    if (!existingForm || !isTinatForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (existingForm.researcherId !== auth.user.id) {
      if (auth.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete any consent records belonging to this form's consent forms
      const consentForms = await tx.consentForm.findMany({
        where: { studyId: id },
        select: { id: true },
      });
      if (consentForms.length > 0) {
        await tx.consentRecord.deleteMany({
          where: { consentFormId: { in: consentForms.map((f) => f.id) } },
        });
      }

      // 2. Disconnect any AI conversations referencing this form
      await tx.aIConversation.updateMany({
        where: { studyId: id },
        data: { studyId: null },
      });

      // 3. Delete the form (study row)
      await tx.study.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: "Form deleted successfully" });
  } catch (error) {
    console.error("Delete form error:", error);
    return NextResponse.json({ error: "Failed to delete form" }, { status: 500 });
  }
}
