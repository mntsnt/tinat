import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { jsonError, validateBody } from "@/lib/validation";
import { z } from "zod";
import { sendCollectorInvitationEmail } from "@/lib/emailService";
import { getBaseUrl } from "@/lib/getRedirectUri";

const inviteCollectorSchema = z.object({
  collectorEmail: z.string().optional(),
  identifier: z.string().optional(),
  directAssign: z.boolean().optional().default(true),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studyId } = await params;
    const auth = await requireStudyOwnerOrAdmin(studyId, req);
    if (!auth.ok) return auth.response;

    const [collectors, applications, invitations] = await Promise.all([
      prisma.studyDataCollector.findMany({
        where: { studyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              avatarUrl: true,
              phone: true,
              institution: true,
              fieldOfStudy: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      }),
      prisma.collectorApplication.findMany({
        where: { studyId },
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              avatarUrl: true,
              phone: true,
              institution: true,
              fieldOfStudy: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.collectorInvitation.findMany({
        where: { studyId, status: "PENDING" },
        include: {
          invitee: { select: { id: true, name: true, username: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Fetch response counts per collector for this study
    const responseCounts = await prisma.response.groupBy({
      by: ["collectorId"],
      where: { studyId, collectorId: { not: null } },
      _count: { id: true },
    });

    const countsMap = new Map<string, number>();
    responseCounts.forEach((rc) => {
      if (rc.collectorId) countsMap.set(rc.collectorId, rc._count.id);
    });

    const collectorsWithStats = collectors.map((c) => ({
      ...c,
      responsesGathered: countsMap.get(c.userId) || 0,
    }));

    return NextResponse.json({
      collectors: collectorsWithStats,
      applications,
      invitations,
    });
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
    const { identifier, collectorEmail, directAssign } = validation.data;

    const rawInput = (identifier || collectorEmail || "").trim();
    if (!rawInput) {
      return jsonError("A username or email is required.", 400);
    }

    const cleanInput = rawInput.toLowerCase();
    const cleanHandle = cleanInput.replace(/^@/, "");

    const collectorUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          { username: cleanHandle },
        ],
      },
    });

    if (!collectorUser) {
      return jsonError(`No user found with username or email "${rawInput}".`, 404);
    }

    if (collectorUser.id === auth.study.researcherId) {
      return jsonError("You are already the study owner.", 400);
    }

    // Direct assignment
    if (directAssign) {
      await prisma.studyDataCollector.upsert({
        where: {
          studyId_userId: {
            studyId,
            userId: collectorUser.id,
          },
        },
        create: {
          studyId,
          userId: collectorUser.id,
        },
        update: {},
      });

      // Ensure user is marked verified for DATA_COLLECTOR
      await prisma.verification.upsert({
        where: {
          userId_verificationType: {
            userId: collectorUser.id,
            verificationType: "DATA_COLLECTOR",
          },
        },
        create: {
          userId: collectorUser.id,
          verificationType: "DATA_COLLECTOR",
          status: "VERIFIED",
        },
        update: {
          status: "VERIFIED",
        },
      });

      // Update any pending application
      await prisma.collectorApplication.updateMany({
        where: { studyId, applicantId: collectorUser.id, status: "PENDING" },
        data: { status: "APPROVED" },
      });

      // In-platform notification
      await prisma.notification.create({
        data: {
          userId: collectorUser.id,
          title: "Assigned as Field Data Collector 📋",
          message: `${auth.user.name || "A researcher"} assigned you as an active data collector for "${auth.study.title}".`,
          linkUrl: "/collector/dashboard",
        },
      });

      // Email notification
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
        console.error("[Collector Assignment] Email error:", emailErr);
      }

      return NextResponse.json({
        success: true,
        message: `${collectorUser.name} has been assigned as a data collector.`,
      });
    }

    // Invitation flow
    const invitation = await prisma.collectorInvitation.upsert({
      where: {
        studyId_inviteeId: {
          studyId,
          inviteeId: collectorUser.id,
        },
      },
      create: {
        studyId,
        inviterId: auth.user.id,
        inviteeId: collectorUser.id,
        status: "PENDING",
      },
      update: {
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studyId } = await params;
    const auth = await requireStudyOwnerOrAdmin(studyId, req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return jsonError("Missing userId parameter", 400);
    }

    await prisma.studyDataCollector.deleteMany({
      where: { studyId, userId },
    });

    return NextResponse.json({ success: true, message: "Collector removed from study." });
  } catch (error) {
    console.error("DELETE study collector error:", error);
    return jsonError("Internal error", 500);
  }
}
