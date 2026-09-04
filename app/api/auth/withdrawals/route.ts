import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const ALLOWED_METHODS = [
  "TELEBIRR",
  "BANK",
];

export async function POST(request: Request) {
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
    // 2. Make sure user is a participant
    // ---------------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        { status: 404 }
      );
    }

    if (user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          error:
            "Only participants can request withdrawals.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------
    // 3. Read request body
    // ---------------------------------------------

    const body = await request.json();

    const amount = Number(body?.amount);
    const method = String(
      body?.method || ""
    )
      .trim()
      .toUpperCase();

    const accountInfo = String(
      body?.accountInfo || ""
    ).trim();

    // ---------------------------------------------
    // 4. Validate amount
    // ---------------------------------------------

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Withdrawal amount must be a positive whole number.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 5. Validate withdrawal method
    // ---------------------------------------------

    if (!ALLOWED_METHODS.includes(method)) {
      return NextResponse.json(
        {
          error:
            "Please select a valid withdrawal method.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 6. Validate account information
    // ---------------------------------------------

    if (!accountInfo) {
      return NextResponse.json(
        {
          error:
            "Account or phone information is required.",
        },
        { status: 400 }
      );
    }

    if (accountInfo.length > 100) {
      return NextResponse.json(
        {
          error:
            "Account information is too long.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 7. Perform everything in ONE transaction
    // ---------------------------------------------

    const result = await prisma.$transaction(
      async (tx) => {
        // Get participant wallet
        const wallet =
          await tx.wallet.findUnique({
            where: {
              userId: user.id,
            },
          });

        if (!wallet) {
          throw new Error(
            "WALLET_NOT_FOUND"
          );
        }

        // -----------------------------------------
        // Check balance
        // -----------------------------------------

        if (wallet.balance < amount) {
          throw new Error(
            "INSUFFICIENT_BALANCE"
          );
        }

        // -----------------------------------------
        // Deduct credits
        // -----------------------------------------

        const updatedWallet =
          await tx.wallet.update({
            where: {
              id: wallet.id,
            },
            data: {
              balance: {
                decrement: amount,
              },
            },
          });

        // -----------------------------------------
        // Create withdrawal
        // -----------------------------------------

        const withdrawal =
          await tx.withdrawal.create({
            data: {
              userId: user.id,
              amount,
              method,
              accountInfo,
              status: "PENDING",
            },
          });

        // -----------------------------------------
        // Record transaction
        // -----------------------------------------

        await tx.tinatCreditTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            type: "WITHDRAW",
            reason:
              `Withdrawal request via ${method}`,
          },
        });

        return {
          withdrawal,
          balance: updatedWallet.balance,
        };
      }
    );

    // ---------------------------------------------
    // 8. Success
    // ---------------------------------------------

    return NextResponse.json(
      {
        message:
          "Withdrawal request submitted successfully.",

        withdrawal: {
          id: result.withdrawal.id,
          amount: result.withdrawal.amount,
          method: result.withdrawal.method,
          status: result.withdrawal.status,
          createdAt:
            result.withdrawal.createdAt,
        },

        newBalance: result.balance,
      },
      { status: 201 }
    );
  } catch (error) {
    // ---------------------------------------------
    // Known errors
    // ---------------------------------------------

    if (
      error instanceof Error &&
      error.message ===
        "WALLET_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Your wallet could not be found.",
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "INSUFFICIENT_BALANCE"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have enough Tinat Credits.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // Unexpected error
    // ---------------------------------------------

    console.error(
      "Withdrawal creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create withdrawal request.",
      },
      { status: 500 }
    );
  }
}
