import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { jsonError, validateBody } from "@/lib/validation";
import { z } from "zod";
import { sendCollectorInvitationEmail } from "@/lib/emailService";
import { getBaseUrl } from "@/lib/getRedirectUri";

const inviteCollectorSchema = z.object({
  collectorEmail: z.string().email("A valid collector email is required"),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studyId } = await params;
    const auth = await requireStudyOwnerOrAdmin(studyId, req);
    if (!auth.ok) return auth.response;

    const collectors = await prisma.studyDataCollector.findMany({
      where: { studyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ collectors });
  } catch (error) {
    console.error("GET study collectors error:", error);
    return jsonError("Internal error", 500);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studyId } = await params;
    const auth = await requireStudyOwnerOrAdmin(studyId, req);
    if (!auth.ok) return auth.response;

    const validation = await validateBody(inviteCollectorSchema, req);
    if (!validation.ok) return validation.response;
    const { collectorEmail } = validation.data;

    const collectorUser = await prisma.user.findUnique({
      where: { email: collectorEmail.toLowerCase().trim() },
    });

    if (!collectorUser) {
      return jsonError("User not found", 404);
    }

    // Free data collectors do not need verification; funded studies require verification
    if (auth.study.studyType === "FUNDED") {
      const verification = await prisma.verification.findUnique({
        where: {
          userId_verificationType: {
            userId: collectorUser.id,
            verificationType: "DATA_COLLECTOR",
          },
        },
      });

      if (!verification || verification.status !== "VERIFIED") {
        return jsonError(
          "User is not a verified data collector. Verification is required for funded research.",
          400,
          "UNVERIFIED_COLLECTOR"
        );
      }
    }

    const invitation = await prisma.collectorInvitation.create({
      data: {
        studyId,
        inviterId: auth.user.id,
        inviteeId: collectorUser.id,
        status: "PENDING",
      },
    });

    await prisma.notification.create({
      data: {
        userId: collectorUser.id,
        title: "New Data Collection Invitation",
        message: `You have been invited to collect data for study: ${auth.study.title}`,
        linkUrl: "/collector/dashboard",
      },
    });

    try {
      const baseUrl = getBaseUrl(req);
      const dashboardLink = `${baseUrl}/collector/dashboard`;
      await sendCollectorInvitationEmail({
        to: collectorUser.email,
        collectorName: collectorUser.name || "Data Collector",
        inviterName: auth.user.name || "Principal Investigator",
        studyTitle: auth.study.title,
        dashboardLink,
      });
    } catch (emailErr) {
      console.error("[Collector Invitation] Failed to send email:", emailErr);
    }

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    console.error("POST study collectors error:", error);
    return jsonError("Internal error", 500);
  }
}
