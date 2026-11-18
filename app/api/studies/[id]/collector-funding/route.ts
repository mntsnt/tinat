import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { FEATURES } from "@/lib/config/features";
import { calculateCollectorBudgetCents } from "@/lib/payments/collectorCompensation";
import { evaluateCollectorFundingResult } from "@/lib/payments/collectorFunding";
import { submitVerifyEtCheck } from "@/lib/payments/verifyEt";
import { prisma } from "@/lib/prisma";

const supportedBanks = new Set([
  "cbe",
  "boa",
  "telebirr",
  "mpesa",
  "cbebirr",
  "dashen",
  "awash",
  "siinqee",
  "kaafiebirr",
  "coopayebirr",
]);

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
  if (!process.env.VERIFY_ET_API_KEY) {
    return NextResponse.json(
      { error: "Verify.et is not fully configured on this server. VERIFY_ET_API_KEY is required." },
      { status: 503 }
    );
  }

  let body: { bank?: unknown; reference?: unknown; accountSuffix?: unknown; phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const bank = typeof body.bank === "string" ? body.bank.trim().toLowerCase() : "";
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";
  const accountSuffix = typeof body.accountSuffix === "string" ? body.accountSuffix.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!supportedBanks.has(bank) || !reference || reference.length > 255) {
    return NextResponse.json(
      { error: "Choose a supported bank and provide a valid transaction reference." },
      { status: 400 }
    );
  }
  if (
    (bank === "boa" && !/^\d{5}$/.test(accountSuffix)) ||
    (bank === "cbe" && accountSuffix && !/^\d{8}$/.test(accountSuffix)) ||
    (bank === "cbebirr" && !/^(09\d{8}|2519\d{8})$/.test(phone))
  ) {
    return NextResponse.json(
      { error: "Provide the required five-digit account suffix or valid CBE Birr phone number for this bank." },
      { status: 400 }
    );
  }

  const study = await prisma.study.findUnique({ where: { id: studyId } });
  if (!study) return NextResponse.json({ error: "Study not found." }, { status: 404 });
  if (study.researcherId !== auth.study.researcherId && auth.user.role !== "ADMIN") {
    return NextResponse.json({ error: "You cannot fund this study." }, { status: 403 });
  }
  if (study.status !== "DRAFT") {
    return NextResponse.json({ error: "Collector funding can only be verified for draft studies." }, { status: 400 });
  }

  const expectedAmountCents = calculateCollectorBudgetCents({
    collectorPayType: study.collectorPayType,
    collectorPayRateCents: study.collectorPayRateCents,
    collectorsNeeded: study.collectorsNeeded,
    participantTarget: study.participantTarget,
  });
  if (expectedAmountCents <= 0) {
    return NextResponse.json({ error: "Set a collector count and compensation amount before funding." }, { status: 400 });
  }

  const completedFunding = await prisma.collectorFundingVerification.findFirst({
    where: {
      studyId,
      status: "VERIFIED",
      expectedAmountCents,
      verifiedAmountCents: expectedAmountCents,
      settlementMatched: true,
      currency: "ETB",
    },
    select: { verificationRequestId: true },
  });
  if (completedFunding) {
    return NextResponse.json({
      status: "VERIFIED",
      requestId: completedFunding.verificationRequestId,
      message: "Collector budget payment has already been verified.",
    });
  }

  let payment = await prisma.collectorFundingVerification.findUnique({
    where: { bank_transactionReference: { bank, transactionReference: reference } },
  });

  if (payment) {
    if (payment.studyId !== studyId || payment.researcherId !== auth.user.id) {
      return NextResponse.json({ error: "This transaction reference has already been submitted." }, { status: 409 });
    }
    if (payment.status === "FAILED") {
      return NextResponse.json(
        {
          status: payment.status,
          message: "This transaction was not verified. Submit a different transaction reference.",
        },
        { status: 400 }
      );
    }
    if (payment.verificationRequestId) {
      return NextResponse.json({
        status: payment.status,
        requestId: payment.verificationRequestId,
        message: "This transaction is already being checked. Wait for the verification result.",
      });
    }
    if (payment.expectedAmountCents !== expectedAmountCents) {
      return NextResponse.json(
        { error: "The study collector budget changed. Use a new payment reference for this amount." },
        { status: 409 }
      );
    }
  } else {
    const pendingPayment = await prisma.collectorFundingVerification.findFirst({
      where: { studyId, status: "PENDING" },
      select: { id: true, verificationRequestId: true },
    });
    if (pendingPayment) {
      return NextResponse.json(
        {
          status: "PENDING",
          requestId: pendingPayment.verificationRequestId,
          message: "Another collector-budget payment is already being checked. Wait for its result before submitting another reference.",
        },
        { status: 409 }
      );
    }

    try {
      payment = await prisma.collectorFundingVerification.create({
        data: {
          studyId,
          researcherId: auth.user.id,
          bank,
          transactionReference: reference,
          expectedAmountCents,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const pendingPayment = await prisma.collectorFundingVerification.findFirst({
          where: { studyId, status: "PENDING" },
          select: { verificationRequestId: true },
        });
        if (pendingPayment) {
          return NextResponse.json(
            {
              status: "PENDING",
              requestId: pendingPayment.verificationRequestId,
              message: "Another collector-budget payment is already being checked. Wait for its result before submitting another reference.",
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: "This transaction reference has already been submitted." },
          { status: 409 }
        );
      }
      throw error;
    }
  }

  let verification;
  try {
    verification = await submitVerifyEtCheck({
      bank,
      reference,
      accountSuffix: accountSuffix || undefined,
      phone: phone || undefined,
      idempotencyKey: `collector-funding-${payment.id}`,
    });
  } catch (error) {
    console.error("Verify.et collector-funding request failed:", error);
    return NextResponse.json(
      { error: "Verify.et could not check this payment. You can retry this same reference shortly." },
      { status: 503 }
    );
  }

  if (!verification.requestId) {
    return NextResponse.json(
      { error: "Verify.et did not return a request ID. The payment was not confirmed." },
      { status: 502 }
    );
  }

  const result = verification.data?.[0] ?? verification.verification;
  const isComplete = result?.processingStatus === "completed" ||
    (verification.verification?.processingStatus === "completed");
  const isFailed = result?.processingStatus === "failed" ||
    verification.verification?.processingStatus === "failed";

  payment = await prisma.collectorFundingVerification.update({
    where: { id: payment.id },
    data: { verificationRequestId: verification.requestId },
  });

  if (isComplete || isFailed) {
    const decision = evaluateCollectorFundingResult(
      { ...result, processingStatus: isFailed ? "failed" : "completed" },
      expectedAmountCents
    );

    payment = await prisma.collectorFundingVerification.update({
      where: { id: payment.id },
      data: {
        ...decision,
        verifiedAt: decision.status === "VERIFIED" ? new Date() : null,
      },
    });
  }

  return NextResponse.json({
    status: payment.status,
    requestId: payment.verificationRequestId,
    message: payment.status === "VERIFIED"
      ? "Collector budget payment verified."
      : payment.status === "FAILED"
        ? payment.failureReason
        : "Payment check queued. The study will remain unpublished until Verify.et confirms it.",
  });
}
