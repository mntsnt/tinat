import { NextResponse } from "next/server";
import { getSession } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prisma";
import { logActivity } from "../../../../../../lib/activityLog";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: Params
) {
  try {
    // 1. Authentication
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // 2. Admin check
    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    // 3. Get withdrawal ID and requested action
    const { id } = await params;
    const body = await request.json();
    const action = body?.action; // "APPROVE" | "APPROVE_MANUAL" | "REJECT"

    if (action !== "APPROVE" && action !== "APPROVE_MANUAL" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Action must be APPROVE, APPROVE_MANUAL, or REJECT." },
        { status: 400 }
      );
    }

    // 4. Fetch withdrawal record
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal request not found." },
        { status: 404 }
      );
    }

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json(
        { error: "This withdrawal has already been processed." },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 5. REJECT & REFUND
    // -----------------------------------------
    if (action === "REJECT") {
      const wallet = withdrawal.user.wallet;

      if (!wallet) {
        return NextResponse.json(
          { error: "Participant wallet not found." },
          { status: 400 }
        );
      }

      const [updatedWallet, updatedWithdrawal] = await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: withdrawal.amount } },
        }),
        prisma.tinatCreditTransaction.create({
          data: {
            walletId: wallet.id,
            amount: withdrawal.amount,
            type: "REFUND",
            reason: `Withdrawal rejected: ${withdrawal.id}`,
          },
        }),
        prisma.withdrawal.update({
          where: { id },
          data: { status: "REJECTED" },
        }),
      ]);

      await logActivity({
        userId: admin.id,
        action: "WITHDRAWAL_REJECTED",
        description: `Admin rejected withdrawal ${id} of ${withdrawal.amount} TC for ${withdrawal.user.name} and refunded credits`,
        resourceId: id,
        resourceType: "Withdrawal",
      });

      return NextResponse.json({
        message: "Withdrawal rejected and credits refunded to participant.",
        withdrawal: updatedWithdrawal,
        newBalance: updatedWallet.balance,
      });
    }

    // -----------------------------------------
    // 6. APPROVE (AUTOMATIC VIA CHAPA)
    // -----------------------------------------
    if (action === "APPROVE") {
      const secretKey = process.env.CHAPA_SECRET_KEY;

      if (!secretKey) {
        return NextResponse.json(
          {
            error: "CHAPA_SECRET_KEY is not configured on the server. Please configure your Chapa API key in your environment, or choose 'Mark as Manually Paid'.",
            requiresManualOption: true,
          },
          { status: 400 }
        );
      }

      // Bank code: 855 is Telebirr, 801 is CBE/Awash
      const bankCode = withdrawal.method === "TELEBIRR" ? "855" : "801";
      const transferReference = `pay-${withdrawal.id.slice(-10)}-${Date.now()}`;

      const chapaRes = await fetch("https://api.chapa.co/v1/transfers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_name: withdrawal.user.name || "Tinat User",
          account_number: withdrawal.accountInfo,
          amount: withdrawal.amount,
          currency: "ETB",
          reference: transferReference,
          bank_code: bankCode,
        }),
      });

      const chapaData = await chapaRes.json().catch(() => ({}));

      if (!chapaRes.ok || chapaData.status !== "success") {
        let errorDetail = "Chapa could not process the payout.";
        if (typeof chapaData.message === "string") {
          errorDetail = chapaData.message;
        } else if (typeof chapaData.message === "object" && chapaData.message !== null) {
          errorDetail = Object.values(chapaData.message).flat().join(", ");
        } else if (chapaData.error) {
          errorDetail = typeof chapaData.error === "string" ? chapaData.error : JSON.stringify(chapaData.error);
        }

        console.error("[Chapa Transfer Failed]", { status: chapaRes.status, chapaData });

        return NextResponse.json(
          {
            error: `Payment gateway error: ${errorDetail}`,
            requiresManualOption: true,
          },
          { status: 400 }
        );
      }

      // Mark withdrawal as approved upon successful Chapa transfer
      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id },
        data: { status: "APPROVED" },
      });

      await logActivity({
        userId: admin.id,
        action: "WITHDRAWAL_APPROVED_CHAPA",
        description: `Admin approved withdrawal ${id} of ${withdrawal.amount} TC via Chapa Transfer (${withdrawal.method})`,
        resourceId: id,
        resourceType: "Withdrawal",
      });

      return NextResponse.json({
        message: "Withdrawal approved and funds disbursed via Chapa!",
        withdrawal: updatedWithdrawal,
      });
    }

    // -----------------------------------------
    // 7. APPROVE_MANUAL (DIRECT TELEBIRR / BANK OVERRIDE)
    // -----------------------------------------
    if (action === "APPROVE_MANUAL") {
      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id },
        data: { status: "APPROVED" },
      });

      await logActivity({
        userId: admin.id,
        action: "WITHDRAWAL_APPROVED_MANUAL",
        description: `Admin approved withdrawal ${id} of ${withdrawal.amount} TC as manually paid (${withdrawal.method}: ${withdrawal.accountInfo})`,
        resourceId: id,
        resourceType: "Withdrawal",
      });

      return NextResponse.json({
        message: "Withdrawal marked as approved and manually disbursed.",
        withdrawal: updatedWithdrawal,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Withdrawal processing error:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal." },
      { status: 500 }
    );
  }
}
