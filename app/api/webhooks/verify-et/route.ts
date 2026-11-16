import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { evaluateCollectorFundingResult } from "@/lib/payments/collectorFunding";
import { isValidVerifyEtSignature, type VerifyEtResult } from "@/lib/payments/verifyEt";
import { prisma } from "@/lib/prisma";

type VerifyEtWebhook = {
  id?: string;
  event?: string;
  requestId?: string;
  data?: VerifyEtResult;
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64 * 1024) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 64 * 1024) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }

  const timestamp = request.headers.get("X-Webhook-Timestamp") || "";
  const signature = request.headers.get("X-Webhook-Signature") || "";
  if (
    !isValidVerifyEtSignature({
      rawBody,
      timestamp,
      signature,
      secret: process.env.VERIFY_ET_WEBHOOK_SECRET || "",
    })
  ) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  if (request.headers.get("X-Webhook-Test") === "true") {
    return new NextResponse(null, { status: 204 });
  }

  let event: VerifyEtWebhook;
  try {
    event = JSON.parse(rawBody) as VerifyEtWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON." }, { status: 400 });
  }

  if (event.event !== "verification.completed") {
    return new NextResponse(null, { status: 204 });
  }

  const eventId = request.headers.get("X-Webhook-Event-Id") || event.id;
  if (!eventId || !event.requestId || !event.data) {
    return NextResponse.json({ error: "Webhook is missing required event fields." }, { status: 400 });
  }
  const requestId = event.requestId;
  const eventName = event.event;

  const payment = await prisma.collectorFundingVerification.findUnique({
    where: { verificationRequestId: requestId },
    select: { id: true, expectedAmountCents: true },
  });
  if (!payment) {
    return NextResponse.json({ error: "Payment verification request is not registered yet." }, { status: 503 });
  }

  const decision = evaluateCollectorFundingResult(event.data, payment.expectedAmountCents);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.verifyEtWebhookEvent.create({
        data: {
          eventId,
          requestId,
          event: eventName,
        },
      });

      await tx.collectorFundingVerification.update({
        where: { id: payment.id },
        data: {
          ...decision,
          verifiedAt: decision.status === "VERIFIED" ? new Date() : null,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new NextResponse(null, { status: 204 });
    }
    console.error("Verify.et webhook processing failed:", error);
    return NextResponse.json({ error: "Could not process payment verification." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
