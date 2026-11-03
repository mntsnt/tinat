import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const reporterId = session?.userId || null;

    const body = await req.json().catch(() => ({}));
    const { studyId, resourceType = "STUDY", resourceId, reason, details } = body;

    if (!resourceId || typeof resourceId !== "string") {
      return NextResponse.json(
        { error: "Resource ID is required." },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        { error: "Report reason is required." },
        { status: 400 }
      );
    }

    if (!details || typeof details !== "string" || !details.trim()) {
      return NextResponse.json(
        { error: "Detailed explanation of the issue is required." },
        { status: 400 }
      );
    }

    // 7-day statutory governance SLA deadline
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const report = await prisma.moderationReport.create({
      data: {
        reporterId,
        studyId: studyId || null,
        resourceType,
        resourceId,
        reason: reason.trim(),
        details: details.trim(),
        deadline,
        status: "OPEN",
      },
    });

    if (reporterId) {
      await logActivity({
        userId: reporterId,
        action: "MODERATION_REPORT_SUBMITTED",
        description: `User submitted report on ${resourceType} ${resourceId}: ${reason}`,
        resourceId: report.id,
        resourceType: "ModerationReport",
      });
    }

    return NextResponse.json({
      message: "Report submitted successfully to the moderation queue.",
      reportId: report.id,
      slaDeadline: report.deadline,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit moderation report" },
      { status: 500 }
    );
  }
}
