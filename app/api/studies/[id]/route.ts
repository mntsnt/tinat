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

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const auth = await requireStudyOwnerOrAdmin(id, req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const updateData: any = {};

    if (body.title !== undefined && typeof body.title === "string" && body.title.trim()) {
      updateData.title = body.title.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description ? String(body.description).trim() : null;
    }
    if (body.objective !== undefined) {
      updateData.objective = body.objective ? String(body.objective).trim() : null;
    }
    if (body.category !== undefined) {
      updateData.category = body.category ? String(body.category).trim() : null;
    }
    if (body.targetPopulation !== undefined) {
      updateData.targetPopulation = body.targetPopulation ? String(body.targetPopulation).trim() : null;
    }
    if (body.estimatedMinutes !== undefined) {
      const minutes = Number(body.estimatedMinutes);
      if (!isNaN(minutes) && minutes > 0) {
        updateData.estimatedMinutes = minutes;
      }
    }
    if (body.participantTarget !== undefined) {
      const target = Number(body.participantTarget);
      if (!isNaN(target) && target >= 0) {
        updateData.participantTarget = target;
      }
    }
    if (body.isPrivate !== undefined) {
      updateData.isPrivate = Boolean(body.isPrivate);
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

    const updatedStudy = await prisma.study.update({
      where: { id },
      data: updateData,
    });

    await logActivity({
      userId: auth.user.id,
      action: "STUDY_UPDATED",
      description: `Updated study settings: ${updatedStudy.title}`,
    });

    return NextResponse.json({
      success: true,
      message: "Study settings updated successfully",
      study: updatedStudy,
    });
  } catch (error) {
    console.error("PATCH study error:", error);
    return jsonError("Failed to update study settings", 500);
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

    await prisma.$transaction(async (tx) => {
      // 1. Delete any consent records belonging to this study's consent forms
      // (ConsentRecord has Restrict foreign key constraint to ConsentForm)
      const consentForms = await tx.consentForm.findMany({
        where: { studyId: id },
        select: { id: true },
      });
      if (consentForms.length > 0) {
        await tx.consentRecord.deleteMany({
          where: { consentFormId: { in: consentForms.map((f) => f.id) } },
        });
      }

      // 2. Disconnect any AI conversations referencing this study
      await tx.aIConversation.updateMany({
        where: { studyId: id },
        data: { studyId: null },
      });

      // 3. Delete the study (cascades to questions, options, responses, answers, etc.)
      await tx.study.delete({
        where: { id },
      });
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
