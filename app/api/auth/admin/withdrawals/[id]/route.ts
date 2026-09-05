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
    // ---------------------------------------------
    // 1. Authentication
    // ---------------------------------------------

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------
    // 2. Admin check
    // ---------------------------------------------

    const admin = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------
    // 3. Get withdrawal ID
    // ---------------------------------------------

    const { id } = await params;

    // ---------------------------------------------
    // 4. Read requested action
    // ---------------------------------------------

    const body = await request.json();

    const action = body?.action;

    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          error:
            "Action must be APPROVE or REJECT.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 5. Process withdrawal transaction
    // ---------------------------------------------

    const result = await prisma.$transaction(
      async (tx) => {
        const withdrawal =
          await tx.withdrawal.findUnique({
            where: {
              id,
            },
            include: {
              user: {
                include: {
                  wallet: true,
                },
              },
            },
          });

        if (!withdrawal) {
          throw new Error(
            "WITHDRAWAL_NOT_FOUND"
          );
        }

        // -----------------------------------------
        // Prevent double processing
        // -----------------------------------------

        if (withdrawal.status !== "PENDING") {
          throw new Error(
            "ALREADY_PROCESSED"
          );
        }

        // -----------------------------------------
        // REJECT
        // -----------------------------------------

        if (action === "REJECT") {
          const wallet =
            withdrawal.user.wallet;

          if (!wallet) {
            throw new Error(
              "WALLET_NOT_FOUND"
            );
          }

          // Refund credits
          const updatedWallet =
            await tx.wallet.update({
              where: {
                id: wallet.id,
              },
              data: {
                balance: {
                  increment:
                    withdrawal.amount,
                },
              },
            });

          // Record refund
          await tx.tinatCreditTransaction.create({
            data: {
              walletId: wallet.id,
              amount: withdrawal.amount,
              type: "REFUND",
              reason:
                `Withdrawal rejected: ${withdrawal.id}`,
            },
          });

          const updatedWithdrawal =
            await tx.withdrawal.update({
              where: {
                id,
              },
              data: {
                status: "REJECTED",
              },
            });

          return {
            withdrawal:
              updatedWithdrawal,
            balance:
              updatedWallet.balance,
          };
        }

        // -----------------------------------------
        // APPROVE
        // -----------------------------------------

        const updatedWithdrawal =
          await tx.withdrawal.update({
            where: {
              id,
            },
            data: {
              status: "APPROVED",
            },
          });

        return {
          withdrawal:
            updatedWithdrawal,
          balance:
            withdrawal.user.wallet
              ?.balance ?? 0,
        };
      }
    );

    return NextResponse.json({
      message:
        action === "APPROVE"
          ? "Withdrawal approved successfully."
          : "Withdrawal rejected and credits refunded.",

      withdrawal: result.withdrawal,

      newBalance: result.balance,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "WITHDRAWAL_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Withdrawal request not found.",
        },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "ALREADY_PROCESSED"
    ) {
      return NextResponse.json(
        {
          error:
            "This withdrawal has already been processed.",
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "WALLET_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Participant wallet not found.",
        },
        { status: 400 }
      );
    }

    console.error(
      "Withdrawal processing error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to process withdrawal.",
      },
      { status: 500 }
    );
  }
}
