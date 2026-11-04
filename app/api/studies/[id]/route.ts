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
