import { NextResponse } from "next/server";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/getRedirectUri";
import { sendCollectorApplicationStatusEmail } from "@/lib/emailService";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { id: studyId, applicationId } = await params;
    const auth = await requireStudyOwnerOrAdmin(studyId, req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const { status } = body;

    if (!["APPROVED", "DECLINED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be APPROVED or DECLINED." }, { status: 400 });
    }

    const application = await prisma.collectorApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        study: { select: { id: true, title: true } },
      },
    });

    if (!application || application.studyId !== studyId) {
      return NextResponse.json({ error: "Application not found for this study." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update application status
      await tx.collectorApplication.update({
        where: { id: applicationId },
        data: { status },
      });

      // 2. If approved, create the StudyDataCollector record & verify DATA_COLLECTOR
      if (status === "APPROVED") {
        await tx.studyDataCollector.upsert({
          where: {
            studyId_userId: {
              studyId,
              userId: application.applicantId,
            },
          },
          create: {
            studyId,
            userId: application.applicantId,
          },
          update: {},
        });

        await tx.verification.upsert({
          where: {
            userId_verificationType: {
              userId: application.applicantId,
              verificationType: "DATA_COLLECTOR",
            },
          },
          create: {
            userId: application.applicantId,
            verificationType: "DATA_COLLECTOR",
            status: "VERIFIED",
          },
          update: {
            status: "VERIFIED",
          },
        });
      }

      // 3. In-platform notification to applicant
      const isApproved = status === "APPROVED";
      await tx.notification.create({
        data: {
          userId: application.applicantId,
          title: isApproved ? "Collector Application Approved! 🎉" : "Collector Application Update",
          message: isApproved
            ? `Your application to collect data for "${application.study.title}" was approved! You can now start collecting responses.`
            : `Your application to collect data for "${application.study.title}" was not approved at this time.`,
          linkUrl: isApproved ? "/collector/dashboard" : "/participant/studies",
        },
      });
    });

    // 4. Send email notification to applicant
    try {
      const baseUrl = getBaseUrl(req);
      const dashboardLink = `${baseUrl}/collector/dashboard`;
      await sendCollectorApplicationStatusEmail({
        to: application.applicant.email,
        applicantName: application.applicant.name,
        studyTitle: application.study.title,
        status,
        dashboardLink,
      });
    } catch (emailErr) {
      console.error("[Collector Application] Decision email error:", emailErr);
    }

    return NextResponse.json({
      success: true,
      status,
      message: status === "APPROVED" ? "Collector application approved." : "Collector application declined.",
    });
  } catch (error) {
    console.error("PATCH application error:", error);
    return NextResponse.json({ error: "Failed to update application." }, { status: 500 });
  }
}
