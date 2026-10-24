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
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    if (!form || form.category !== "Tinat Form") {
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

    if (!existingForm || existingForm.category !== "Tinat Form") {
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const existingForm = await prisma.study.findUnique({
      where: { id },
    });

    if (!existingForm || existingForm.category !== "Tinat Form") {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (existingForm.researcherId !== session.userId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.study.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Form deleted successfully" });
  } catch (error) {
    console.error("Delete form error:", error);
    return NextResponse.json({ error: "Failed to delete form" }, { status: 500 });
  }
}
