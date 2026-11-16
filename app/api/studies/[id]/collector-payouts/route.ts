import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { FEATURES } from "@/lib/config/features";
import { calculateCollectorBudgetCents, parseEtbCents } from "@/lib/payments/collectorCompensation";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id: studyId } = await params;
  const auth = await requireStudyOwnerOrAdmin(studyId, request);
  if (!auth.ok) return auth.response;

  if (!FEATURES.CASH_PAYMENTS_ENABLED) {
    return NextResponse.json(
      { error: "Cash payments are disabled on this platform." },
      { status: 403 }
    );
  }

  let body: { collectorUserId?: unknown; amount?: unknown; paymentReference?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const collectorUserId =
    typeof body.collectorUserId === "string" ? body.collectorUserId.trim() : "";
  const amountCents = parseEtbCents(body.amount);
  const paymentReference =
    typeof body.paymentReference === "string" ? body.paymentReference.trim() : "";
  if (!collectorUserId || !amountCents || amountCents <= 0 || !paymentReference || paymentReference.length > 255) {
    return NextResponse.json(
      { error: "Provide a collector, a positive ETB payout amount, and the external payment reference." },
      { status: 400 }
    );
  }

  try {
    const payout = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Study" WHERE "id" = ${studyId} FOR UPDATE;
      `;

      const study = await tx.study.findUnique({ where: { id: studyId } });
      if (!study) throw new Error("STUDY_NOT_FOUND");

      const assignment = await tx.studyDataCollector.findUnique({
        where: { studyId_userId: { studyId, userId: collectorUserId } },
        select: { id: true },
      });
      if (!assignment) throw new Error("COLLECTOR_NOT_ASSIGNED");

      const budgetCents = calculateCollectorBudgetCents({
        collectorPayType: study.collectorPayType,
        collectorPayRateCents: study.collectorPayRateCents,
        collectorsNeeded: study.collectorsNeeded,
        participantTarget: study.participantTarget,
      });
      if (budgetCents > 0) {
        const verifiedFunding = await tx.collectorFundingVerification.findFirst({
          where: {
            studyId,
            status: "VERIFIED",
            expectedAmountCents: budgetCents,
            verifiedAmountCents: budgetCents,
            settlementMatched: true,
            currency: "ETB",
          },
          select: { id: true },
        });
        if (!verifiedFunding) throw new Error("COLLECTOR_FUNDING_NOT_VERIFIED");
      }

      const amountDueCents = study.collectorPayType === "FIXED"
        ? study.collectorPayRateCents
        : study.collectorPayType === "PER_RESPONSE"
          ? (await tx.response.count({ where: { studyId, collectorId: collectorUserId } })) *
            study.collectorPayRateCents
          : 0;
      const payouts = await tx.collectorPayout.aggregate({
        where: { studyId, collectorUserId },
        _sum: { amountCents: true },
      });
      const remainingCents = amountDueCents - (payouts._sum.amountCents ?? 0);
      const allPayouts = await tx.collectorPayout.aggregate({
        where: { studyId },
        _sum: { amountCents: true },
      });
      const budgetRemainingCents = budgetCents - (allPayouts._sum.amountCents ?? 0);
      if (amountCents > Math.min(remainingCents, budgetRemainingCents)) {
        throw new Error("PAYOUT_EXCEEDS_AMOUNT_DUE");
      }

      return tx.collectorPayout.create({
        data: {
          studyId,
          collectorUserId,
          recordedByUserId: auth.user.id,
          amountCents,
          paymentReference,
        },
      });
    });

    return NextResponse.json({ success: true, payout });
  } catch (error) {
    if (error instanceof Error && error.message === "STUDY_NOT_FOUND") {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "COLLECTOR_NOT_ASSIGNED") {
      return NextResponse.json({ error: "This user is not an assigned collector for this study." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "COLLECTOR_FUNDING_NOT_VERIFIED") {
      return NextResponse.json({ error: "Verify the collector budget before recording a payout." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "PAYOUT_EXCEEDS_AMOUNT_DUE") {
      return NextResponse.json({ error: "Payout exceeds the amount currently due to this collector." }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "This external payment reference has already been recorded." }, { status: 409 });
    }
    console.error("Collector payout recording failed:", error);
    return NextResponse.json({ error: "Could not record this collector payout." }, { status: 500 });
  }
}
