import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";
import { logActivity } from "@/lib/activityLog";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const study = await prisma.study.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        _count: {
          select: { responses: true, questions: true },
        },
      },
    });

    if (!study) {
      return jsonError("Study not found", 404);
    }

    return NextResponse.json({ study });
  } catch (error) {
    console.error("GET study error:", error);
    return jsonError("Internal error", 500);
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const auth = await requireStudyOwnerOrAdmin(id, req);
    if (!auth.ok) return auth.response;

    await prisma.study.delete({
      where: { id },
    });

    await logActivity({
      userId: auth.user.id,
      action: "STUDY_DELETED",
      description: `Deleted study: ${auth.study.title}`,
    });

    return NextResponse.json({
      success: true,
      message: "Study deleted successfully",
    });
  } catch (error) {
    console.error("DELETE study error:", error);
    return jsonError("Failed to delete study", 500);
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const auth = await requireStudyOwnerOrAdmin(id, req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));

    // BINDING DECISION: An existing study can NEVER have its format changed after creation
    if (body.format && body.format !== auth.study.format) {
      return NextResponse.json(
        { error: "Study format cannot be changed after creation." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (typeof body.title === "string" && body.title.trim()) {
      updateData.title = body.title.trim();
    }
    if (typeof body.description === "string") {
      updateData.description = body.description.trim() || null;
    }
    if (typeof body.teaserLinkEnabled === "boolean") {
      updateData.teaserLinkEnabled = body.teaserLinkEnabled;
    }

    const updated = await prisma.study.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, study: updated });
  } catch (error: any) {
    console.error("PATCH study error:", error);
    return jsonError("Failed to update study", 500);
  }
}
