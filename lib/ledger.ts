import { Prisma } from "../generated/prisma/client";

export interface AwardRewardParams {
  studyId: string;
  participantId: string;
  responseId: string;
  amount: number;
  studyTitle: string;
  tx: Prisma.TransactionClient;
}

export interface AdminAdjustmentParams {
  userId: string;
  amount: number;
  reason: string;
  adminId: string;
  adminName: string;
  tx: Prisma.TransactionClient;
}

/**
 * Executes a balanced double-entry credit award inside an ongoing Prisma transaction.
 *
 * Requirements (ADR 0001 & Part 2):
 * 1. Atomic balance update: Single atomic statement UPDATE ... SET balance = balance + :n ... RETURNING balance.
 *    Take balanceAfter from the returned value.
 * 2. Idempotency: Unique idempotencyKey on LedgerJournal and TinatCreditTransaction. Retried requests return original result.
 * 3. CHECK constraints & Double-entry: Two ledger lines that sum to zero (SYSTEM_ISSUANCE down, USER_WALLET up).
 * 4. Append-only: Ledger entries are append-only and protected by database triggers.
 */
export async function executeBalancedReward(params: AwardRewardParams) {
  const { studyId, participantId, responseId, amount, studyTitle, tx } = params;

  if (amount <= 0) return null;

  const idempotencyKey = `reward-${studyId}-${participantId}`;

  // 1. Check if reward was already journaled (idempotency guard)
  const existingJournal = await tx.ledgerJournal.findUnique({
    where: { idempotencyKey },
    include: { entries: true },
  });

  if (existingJournal) {
    const existingWallet = await tx.wallet.findUnique({
      where: { userId: participantId },
    });
    return {
      journal: existingJournal,
      alreadyAwarded: true,
      newBalance: existingWallet?.balance ?? 0,
    };
  }

  // 2. Ensure system issuance ledger account exists
  let systemAccount = await tx.ledgerAccount.findFirst({
    where: { kind: "SYSTEM_ISSUANCE" },
  });
  if (!systemAccount) {
    systemAccount = await tx.ledgerAccount.create({
      data: {
        id: "system_issuance_account",
        kind: "SYSTEM_ISSUANCE",
        balance: 0,
      },
    });
  }

  // 3. Ensure participant ledger account exists
  let userLedgerAccount = await tx.ledgerAccount.findUnique({
    where: { userId: participantId },
  });
  if (!userLedgerAccount) {
    userLedgerAccount = await tx.ledgerAccount.create({
      data: {
        id: `la_${participantId}`,
        kind: "USER_WALLET",
        userId: participantId,
        balance: 0,
      },
    });
  }

  // 4. Ensure Participant Wallet exists
  let wallet = await tx.wallet.findUnique({
    where: { userId: participantId },
  });
  if (!wallet) {
    wallet = await tx.wallet.create({
      data: {
        userId: participantId,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      },
    });
  }

  // 5. ATOMIC balance update via single UPDATE ... RETURNING statement
  const walletRows = await tx.$queryRaw<Array<{ id: string; balance: number; totalEarned: number }>>`
    UPDATE "Wallet"
    SET "balance" = "balance" + ${amount},
        "totalEarned" = "totalEarned" + (CASE WHEN ${amount} > 0 THEN ${amount} ELSE 0 END),
        "updatedAt" = NOW()
    WHERE "id" = ${wallet.id}
    RETURNING "id", "balance", "totalEarned";
  `;

  if (!walletRows || walletRows.length === 0) {
    throw new Error(`Failed to atomically update balance for wallet ${wallet.id}`);
  }
  const balanceAfter = walletRows[0].balance;

  // 6. ATOMIC update on System Issuance account (decremented by amount)
  const systemRows = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
    UPDATE "LedgerAccount"
    SET "balance" = "balance" - ${amount},
        "updatedAt" = NOW()
    WHERE "id" = ${systemAccount.id}
    RETURNING "id", "balance";
  `;
  const systemBalanceAfter = systemRows[0].balance;

  // 7. ATOMIC update on User Ledger account (incremented by amount)
  const userAccRows = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
    UPDATE "LedgerAccount"
    SET "balance" = "balance" + ${amount},
        "updatedAt" = NOW()
    WHERE "id" = ${userLedgerAccount.id}
    RETURNING "id", "balance";
  `;
  const userBalanceAfter = userAccRows[0].balance;

  // 8. Create LedgerJournal and balanced LedgerEntry pair (sum == 0)
  const journal = await tx.ledgerJournal.create({
    data: {
      idempotencyKey,
      description: `Reward for study: ${studyTitle}`,
      studyId,
      responseId,
      entries: {
        create: [
          {
            accountId: systemAccount.id,
            amount: -amount,
            balanceAfter: systemBalanceAfter,
          },
          {
            accountId: userLedgerAccount.id,
            amount: amount,
            balanceAfter: userBalanceAfter,
          },
        ],
      },
    },
  });

  // 9. Append-only TinatCreditTransaction with balanceAfter taken directly from atomic RETURNING
  const creditTx = await tx.tinatCreditTransaction.create({
    data: {
      walletId: wallet.id,
      amount,
      type: "REWARD_CREDIT",
      reason: `Completed study: ${studyTitle}`,
      idempotencyKey,
      balanceAfter,
    },
  });

  return { journal, creditTx, newBalance: balanceAfter, alreadyAwarded: false };
}

/**
 * Executes a balanced admin adjustment on a user's wallet.
 * Ensures the system issuance account balances any manual credit grant or debit.
 */
export async function executeBalancedAdminAdjustment(params: AdminAdjustmentParams) {
  const { userId, amount, reason, adminId: _adminId, adminName, tx } = params;

  if (amount === 0) return null;

  const idempotencyKey = `admin-adj-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Ensure system issuance account exists
  let systemAccount = await tx.ledgerAccount.findFirst({
    where: { kind: "SYSTEM_ISSUANCE" },
  });
  if (!systemAccount) {
    systemAccount = await tx.ledgerAccount.create({
      data: {
        id: "system_issuance_account",
        kind: "SYSTEM_ISSUANCE",
        balance: 0,
      },
    });
  }

  // Ensure user ledger account exists
  let userLedgerAccount = await tx.ledgerAccount.findUnique({
    where: { userId },
  });
  if (!userLedgerAccount) {
    userLedgerAccount = await tx.ledgerAccount.create({
      data: {
        id: `la_${userId}`,
        kind: "USER_WALLET",
        userId,
        balance: 0,
      },
    });
  }

  // Ensure wallet exists
  let wallet = await tx.wallet.findUnique({
    where: { userId },
  });
  if (!wallet) {
    wallet = await tx.wallet.create({
      data: {
        userId,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      },
    });
  }

  // Atomic update on wallet RETURNING balance
  const walletRows = await tx.$queryRaw<Array<{ id: string; balance: number; totalEarned: number }>>`
    UPDATE "Wallet"
    SET "balance" = "balance" + ${amount},
        "totalEarned" = "totalEarned" + (CASE WHEN ${amount} > 0 THEN ${amount} ELSE 0 END),
        "updatedAt" = NOW()
    WHERE "id" = ${wallet.id}
    RETURNING "id", "balance", "totalEarned";
  `;

  if (!walletRows || walletRows.length === 0) {
    throw new Error(`Failed to atomically update balance for wallet ${wallet.id}`);
  }
  const balanceAfter = walletRows[0].balance;

  // Atomic update on system issuance account
  const systemRows = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
    UPDATE "LedgerAccount"
    SET "balance" = "balance" - ${amount},
        "updatedAt" = NOW()
    WHERE "id" = ${systemAccount.id}
    RETURNING "id", "balance";
  `;
  const systemBalanceAfter = systemRows[0].balance;

  // Atomic update on user ledger account
  const userAccRows = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
    UPDATE "LedgerAccount"
    SET "balance" = "balance" + ${amount},
        "updatedAt" = NOW()
    WHERE "id" = ${userLedgerAccount.id}
    RETURNING "id", "balance";
  `;
  const userBalanceAfter = userAccRows[0].balance;

  // Balanced double-entry pair (sum == 0)
  const journal = await tx.ledgerJournal.create({
    data: {
      idempotencyKey,
      description: `Admin adjustment by ${adminName}: ${reason}`,
      entries: {
        create: [
          {
            accountId: systemAccount.id,
            amount: -amount,
            balanceAfter: systemBalanceAfter,
          },
          {
            accountId: userLedgerAccount.id,
            amount: amount,
            balanceAfter: userBalanceAfter,
          },
        ],
      },
    },
  });

  const creditTx = await tx.tinatCreditTransaction.create({
    data: {
      walletId: wallet.id,
      amount,
      type: "ADMIN_ADJUSTMENT",
      reason: `Admin adjustment: ${reason}`,
      idempotencyKey,
      balanceAfter,
    },
  });

  return { journal, creditTx, newBalance: balanceAfter };
}
