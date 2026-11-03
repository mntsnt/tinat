import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { jsonError } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { id } = await context.params;
    const body = await request.json();
    const { status, resolutionNotes, actionTaken } = body;

    if (!["INVESTIGATING", "RESOLVED", "DISMISSED"].includes(status)) {
      return jsonError("Status must be INVESTIGATING, RESOLVED, or DISMISSED.", 400);
    }

    if (["RESOLVED", "DISMISSED"].includes(status)) {
      if (typeof resolutionNotes !== "string" || !resolutionNotes.trim()) {
        return jsonError("Resolution notes are required when resolving or dismissing a report.", 400);
      }
    }

    const report = await prisma.moderationReport.findUnique({
      where: { id },
    });

    if (!report) {
      return jsonError("Report not found.", 404);
    }

    // Optional Action: Study Takedown
    if (actionTaken === "TAKEDOWN_STUDY" && report.studyId) {
      await prisma.study.update({
        where: { id: report.studyId },
        data: { status: "PAUSED" },
      });

      await logActivity({
        userId: user.id,
        action: "STUDY_MODERATION_TAKEDOWN",
        description: `Admin ${user.id} took down study ${report.studyId} in response to report ${id}`,
        resourceId: report.studyId,
        resourceType: "Study",
      });
    }

    const updated = await prisma.moderationReport.update({
      where: { id },
      data: {
        status,
        resolutionNotes: resolutionNotes ? resolutionNotes.trim() : null,
        resolvedByAdminId: user.id,
        resolvedAt: ["RESOLVED", "DISMISSED"].includes(status) ? new Date() : null,
      },
    });

    await logActivity({
      userId: user.id,
      action: "MODERATION_REPORT_UPDATED",
      description: `Moderation report ${id} set to ${status} by admin ${user.id}. Action: ${actionTaken || "None"}`,
      resourceId: id,
      resourceType: "ModerationReport",
    });

    return NextResponse.json({
      message: `Report successfully marked as ${status}.`,
      report: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update moderation report" },
      { status: 500 }
    );
  }
}
