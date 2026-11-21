import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireUser } from "@/lib/authGuard";
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
