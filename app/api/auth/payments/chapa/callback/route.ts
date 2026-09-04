import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ChapaVerifyResponse = {
  status?: string;
  message?: string;
  data?: {
    status?: string;
    amount?: string | number;
    reference?: string;
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Chapa sends trx_ref in the callback URL
    const txRef =
      searchParams.get("trx_ref") ||
      searchParams.get("tx_ref");

    if (!txRef) {
      console.error(
        "Chapa callback: transaction reference missing.",
        Object.fromEntries(searchParams.entries())
      );

      return NextResponse.json(
        {
          error: "Transaction reference is missing.",
        },
        { status: 400 }
      );
    }

    const secretKey = process.env.CHAPA_SECRET_KEY;

    if (!secretKey) {
      console.error("CHAPA_SECRET_KEY is missing.");

      return NextResponse.json(
        {
          error: "Chapa is not configured.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------
    // Find our payment record
    // ---------------------------------------------

    const payment = await prisma.studyPayment.findUnique({
      where: {
        txRef,
      },
    });

    if (!payment) {
      console.error(
        "Chapa callback: payment not found:",
        txRef
      );

      return NextResponse.json(
        {
          error: "Payment record not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------
    // Already processed
    // ---------------------------------------------

    if (payment.status === "SUCCESS") {
      return NextResponse.redirect(
        new URL(
          `/researcher/studies/${payment.studyId}?payment=success`,
          request.url
        )
      );
    }

    // ---------------------------------------------
    // Verify payment with Chapa
    // ---------------------------------------------

    const chapaResponse = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(
        txRef
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    let chapaData: ChapaVerifyResponse = {};

    try {
      chapaData =
        (await chapaResponse.json()) as ChapaVerifyResponse;
    } catch (error) {
      console.error(
        "Chapa verification response was not valid JSON:",
        error
      );

      return NextResponse.redirect(
        new URL(
          `/researcher/studies/${payment.studyId}?payment=failed`,
          request.url
        )
      );
    }

    console.log(
      "Chapa verification response:",
      chapaData
    );

    // ---------------------------------------------
    // Check payment status
    // ---------------------------------------------

    const isSuccessful =
      chapaResponse.ok &&
      chapaData.status === "success" &&
      chapaData.data?.status === "success";

    if (!isSuccessful) {
      console.error(
        "Chapa payment verification failed:",
        chapaData
      );

      await prisma.studyPayment.update({
        where: {
          txRef,
        },
        data: {
          status: "FAILED",
          chapaRef:
            chapaData.data?.reference || null,
        },
      });

      return NextResponse.redirect(
        new URL(
          `/researcher/studies/${payment.studyId}?payment=failed`,
          request.url
        )
      );
    }

    // ---------------------------------------------
    // Verify payment amount
    // ---------------------------------------------

    const paidAmount = Number(
      chapaData.data?.amount
    );

    if (
      !Number.isFinite(paidAmount) ||
      paidAmount !== payment.amount
    ) {
      console.error(
        "Payment amount mismatch:",
        {
          expected: payment.amount,
          received: paidAmount,
          txRef,
        }
      );

      await prisma.studyPayment.update({
        where: {
          txRef,
        },
        data: {
          status: "FAILED",
          chapaRef:
            chapaData.data?.reference || null,
        },
      });

      return NextResponse.redirect(
        new URL(
          `/researcher/studies/${payment.studyId}?payment=failed`,
          request.url
        )
      );
    }

    // ---------------------------------------------
    // PAYMENT SUCCESS
    // ---------------------------------------------

    await prisma.$transaction(async (tx) => {
      // Mark payment as successful
      await tx.studyPayment.update({
        where: {
          txRef,
        },
        data: {
          status: "SUCCESS",
          chapaRef:
            chapaData.data?.reference || null,
        },
      });

      // Activate study
      await tx.study.update({
        where: {
          id: payment.studyId,
        },
        data: {
          status: "ACTIVE",
          creditsPaid: payment.amount,
        },
      });
    });

    console.log(
      `Study ${payment.studyId} successfully funded and activated.`
    );

    // ---------------------------------------------
    // Send researcher back to study page
    // ---------------------------------------------

    return NextResponse.redirect(
      new URL(
        `/researcher/studies/${payment.studyId}?payment=success`,
        request.url
      )
    );
  } catch (error) {
    console.error(
      "Chapa callback error:",
      error
    );

    return NextResponse.json(
      {
        error: "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}