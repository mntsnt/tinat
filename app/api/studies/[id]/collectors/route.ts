import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { jsonError, validateBody } from "@/lib/validation";
import { z } from "zod";
import { sendCollectorInvitationEmail } from "@/lib/emailService";
import { getBaseUrl } from "@/lib/getRedirectUri";
import { calculateCollectorBudgetCents } from "@/lib/payments/collectorCompensation";
import { FEATURES } from "@/lib/config/features";

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
    const study = auth.study;

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

    const [payoutTotals, fundingPayments, payoutRecords] = await Promise.all([
      prisma.collectorPayout.groupBy({
        by: ["collectorUserId"],
        where: { studyId },
        _sum: { amountCents: true },
      }),
      prisma.collectorFundingVerification.findMany({
        where: { studyId },
        select: {
          id: true,
          bank: true,
          transactionReference: true,
          expectedAmountCents: true,
          verifiedAmountCents: true,
          status: true,
          failureReason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.collectorPayout.findMany({
        where: { studyId },
        select: {
          id: true,
          collectorUserId: true,
          amountCents: true,
          paymentReference: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const paidMap = new Map<string, number>();
    payoutTotals.forEach((payout) => {
      paidMap.set(payout.collectorUserId, payout._sum.amountCents ?? 0);
    });

    const collectorsWithStats = collectors.map((collector) => {
      const responsesGathered = countsMap.get(collector.userId) || 0;
      const amountDueCents = study.collectorPayType === "FIXED"
        ? study.collectorPayRateCents
        : study.collectorPayType === "PER_RESPONSE"
          ? responsesGathered * study.collectorPayRateCents
          : 0;
      const paidAmountCents = paidMap.get(collector.userId) || 0;

      return {
        ...collector,
        responsesGathered,
        amountDueCents,
        paidAmountCents,
        outstandingAmountCents: Math.max(0, amountDueCents - paidAmountCents),
      };
    });

    const collectorBudgetCents = calculateCollectorBudgetCents({
      collectorPayType: study.collectorPayType,
      collectorPayRateCents: study.collectorPayRateCents,
      collectorsNeeded: study.collectorsNeeded,
      participantTarget: study.participantTarget,
    });

    return NextResponse.json({
      collectors: collectorsWithStats,
      applications,
      invitations,
      collectorFunding: {
        collectorsNeeded: study.collectorsNeeded,
        payType: study.collectorPayType,
        payRateCents: study.collectorPayRateCents,
        budgetCents: collectorBudgetCents,
        paymentsEnabled: FEATURES.CASH_PAYMENTS_ENABLED &&
          Boolean(process.env.VERIFY_ET_API_KEY),
        payments: fundingPayments,
        payouts: payoutRecords,
      },
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
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "Study" WHERE "id" = ${studyId} FOR UPDATE;
        `;

        const study = await tx.study.findUnique({ where: { id: studyId } });
        if (!study) throw new Error("STUDY_NOT_FOUND");

        const existingAssignment = await tx.studyDataCollector.findUnique({
          where: { studyId_userId: { studyId, userId: collectorUser.id } },
          select: { id: true },
        });
        if (existingAssignment) throw new Error("COLLECTOR_ALREADY_ASSIGNED");

        if (study.collectorsNeeded > 0) {
          const budgetCents = calculateCollectorBudgetCents({
            collectorPayType: study.collectorPayType,
            collectorPayRateCents: study.collectorPayRateCents,
            collectorsNeeded: study.collectorsNeeded,
            participantTarget: study.participantTarget,
          });
          const [verifiedFunding, assignedCount] = await Promise.all([
            budgetCents > 0
              ? tx.collectorFundingVerification.findFirst({
                  where: {
                    studyId,
                    status: "VERIFIED",
                    expectedAmountCents: budgetCents,
                    verifiedAmountCents: budgetCents,
                    settlementMatched: true,
                    currency: "ETB",
                  },
                  select: { id: true },
                })
              : Promise.resolve({ id: "free-volunteer-cohort" }),
            tx.studyDataCollector.count({ where: { studyId } }),
          ]);

          if (budgetCents > 0 && !verifiedFunding) throw new Error("COLLECTOR_FUNDING_NOT_VERIFIED");
          if (assignedCount >= study.collectorsNeeded) throw new Error("COLLECTOR_LIMIT_REACHED");
        }

        await tx.studyDataCollector.create({ data: { studyId, userId: collectorUser.id } });
        await tx.verification.upsert({
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
          update: { status: "VERIFIED" },
        });
        await tx.collectorApplication.updateMany({
          where: { studyId, applicantId: collectorUser.id, status: "PENDING" },
          data: { status: "APPROVED" },
        });
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
      let emailSent = false;
      try {
        const baseUrl = getBaseUrl(req);
        const dashboardLink = `${baseUrl}/collector/dashboard`;
        const emailResult = await sendCollectorInvitationEmail({
          to: collectorUser.email,
          collectorName: collectorUser.name || "Data Collector",
          inviterName: auth.user.name || "Principal Investigator",
          studyTitle: auth.study.title,
          dashboardLink,
        });
        emailSent = emailResult.success;
      } catch (emailErr) {
        console.error("[Collector Assignment] Email error:", emailErr);
      }

      return NextResponse.json({
        success: true,
        message: emailSent
          ? `${collectorUser.name} has been assigned as a data collector and notified by email.`
          : `${collectorUser.name} has been assigned as a data collector. Their Tinat notification is available, but the email could not be sent.`,
        emailSent,
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

    let emailSent = false;
    try {
      const baseUrl = getBaseUrl(req);
      const dashboardLink = `${baseUrl}/collector/dashboard`;
      const emailResult = await sendCollectorInvitationEmail({
        to: collectorUser.email,
        collectorName: collectorUser.name || "Data Collector",
        inviterName: auth.user.name || "Principal Investigator",
        studyTitle: auth.study.title,
        dashboardLink,
      });
      emailSent = emailResult.success;
    } catch (emailErr) {
      console.error("[Collector Invitation] Failed to send email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      invitation,
      emailSent,
      message: emailSent
        ? "The collector invitation was created and emailed."
        : "The collector invitation was created. Their Tinat notification is available, but the email could not be sent.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "COLLECTOR_FUNDING_NOT_VERIFIED") {
      return jsonError("Verify the full ETB collector budget before assigning collectors.", 400);
    }
    if (error instanceof Error && error.message === "COLLECTOR_LIMIT_REACHED") {
      return jsonError("The study has already filled its collector positions.", 409);
    }
    if (error instanceof Error && error.message === "COLLECTOR_ALREADY_ASSIGNED") {
      return jsonError("This participant is already assigned as a collector.", 409);
    }
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
