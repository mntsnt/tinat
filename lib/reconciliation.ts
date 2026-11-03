import { prisma } from "@/lib/prisma";

export interface Discrepancy {
  type: "WALLET_BALANCE_MISMATCH" | "SYSTEM_ISSUANCE_MISMATCH" | "STUDY_SPENT_MISMATCH";
  identifier: string;
  expected: number;
  actual: number;
  difference: number;
  details?: string;
}

export interface ReconciliationResult {
  ok: boolean;
  checkedAt: Date;
  discrepancies: Discrepancy[];
  metrics: {
    totalWalletsChecked: number;
    circulatingCredits: number;
    systemIssuanceBalance: number;
    studiesChecked: number;
  };
  incidentId?: string;
}

/**
 * Reconciles the double-entry ledger against user wallets and study budgets.
 * 
 * Verifies 3 fundamental invariants:
 * 1. For every wallet: sum(LedgerEntry where accountId = user_ledger_account) === Wallet.balance
 * 2. Total issued: abs(system_issuance.balance) === sum(all user_wallet.balance) === sum(all Wallet.balance)
 * 3. For each study: Study.creditsSpent === sum(reward entries in LedgerJournal for that study)
 * 
 * On mismatch: Creates an IncidentLog entry with CRITICAL severity and logs an alert.
 */
export async function reconcileLedger(options: {
  createIncidentOnMismatch?: boolean;
} = { createIncidentOnMismatch: true }): Promise<ReconciliationResult> {
  const discrepancies: Discrepancy[] = [];

  // 1. Fetch system issuance account
  const systemAccount = await prisma.ledgerAccount.findFirst({
    where: { kind: "SYSTEM_ISSUANCE" },
  });
  const systemIssuanceBalance = systemAccount?.balance ?? 0;

  // 2. Fetch all user wallets and their ledger accounts
  const wallets = await prisma.wallet.findMany({
    include: {
      user: {
        include: {
          ledgerAccount: {
            include: {
              entries: true,
            },
          },
        },
      },
    },
  });

  let totalWalletCredits = 0;
  let totalLedgerCredits = 0;

  for (const wallet of wallets) {
    totalWalletCredits += wallet.balance;

    const userLedgerAccount = wallet.user.ledgerAccount;
    const ledgerSum = userLedgerAccount
      ? userLedgerAccount.entries.reduce((sum, e) => sum + e.amount, 0)
      : 0;

    if (userLedgerAccount) {
      totalLedgerCredits += userLedgerAccount.balance;
    }

    // Invariant 1: Individual wallet balance == sum of ledger entries
    if (wallet.balance !== ledgerSum) {
      discrepancies.push({
        type: "WALLET_BALANCE_MISMATCH",
        identifier: `User ${wallet.userId} (Wallet ${wallet.id})`,
        expected: ledgerSum,
        actual: wallet.balance,
        difference: wallet.balance - ledgerSum,
        details: `Wallet balance (${wallet.balance}) does not match sum of ledger entries (${ledgerSum}).`,
      });
    }

    // Also verify user ledger account balance == sum of entries
    if (userLedgerAccount && userLedgerAccount.balance !== ledgerSum) {
      discrepancies.push({
        type: "WALLET_BALANCE_MISMATCH",
        identifier: `LedgerAccount ${userLedgerAccount.id} for User ${wallet.userId}`,
        expected: ledgerSum,
        actual: userLedgerAccount.balance,
        difference: userLedgerAccount.balance - ledgerSum,
        details: `LedgerAccount cached balance (${userLedgerAccount.balance}) does not match entry sum (${ledgerSum}).`,
      });
    }
  }

  // Invariant 2: Total issued equals total circulating credits
  // System issuance is decremented (-X) when credits are issued (+X to user).
  // So abs(systemIssuanceBalance) must strictly equal total circulating user credits.
  const expectedTotalCirculating = Math.abs(systemIssuanceBalance);
  if (totalWalletCredits !== expectedTotalCirculating || totalLedgerCredits !== expectedTotalCirculating) {
    discrepancies.push({
      type: "SYSTEM_ISSUANCE_MISMATCH",
      identifier: "SYSTEM_ISSUANCE vs CIRCULATION",
      expected: expectedTotalCirculating,
      actual: totalWalletCredits,
      difference: totalWalletCredits - expectedTotalCirculating,
      details: `Total wallet credits (${totalWalletCredits}) does not match credits issued by system (${expectedTotalCirculating}). Ledger accounts sum to ${totalLedgerCredits}.`,
    });
  }

  // 3. Fetch all studies and check creditsSpent against reward entries
  const studies = await prisma.study.findMany({
    select: {
      id: true,
      title: true,
      creditsSpent: true,
      fundingType: true,
    },
  });

  for (const study of studies) {
    // Sum reward entries for this study (entries on user ledger accounts, amount > 0)
    const journals = await prisma.ledgerJournal.findMany({
      where: { studyId: study.id },
      include: {
        entries: {
          where: { amount: { gt: 0 } },
        },
      },
    });

    const rewardSum = journals.reduce((sum, j) => {
      return sum + j.entries.reduce((sub, e) => sub + e.amount, 0);
    }, 0);

    // Invariant 3: Study creditsSpent == sum of reward entries
    if (study.creditsSpent !== rewardSum) {
      discrepancies.push({
        type: "STUDY_SPENT_MISMATCH",
        identifier: `Study ${study.id} ("${study.title}")`,
        expected: rewardSum,
        actual: study.creditsSpent,
        difference: study.creditsSpent - rewardSum,
        details: `Study creditsSpent (${study.creditsSpent}) does not equal journaled rewards sum (${rewardSum}).`,
      });
    }
  }

  const isHealthy = discrepancies.length === 0;
  let incidentId: string | undefined;

  // On mismatch, log an IncidentLog and alert admins
  if (!isHealthy && options.createIncidentOnMismatch) {
    const incident = await prisma.incidentLog.create({
      data: {
        severity: "CRITICAL",
        category: "LEDGER_RECONCILIATION",
        description: `Ledger reconciliation failed with ${discrepancies.length} discrepancy(ies).`,
        metadata: {
          checkedAt: new Date().toISOString(),
          discrepancies: JSON.parse(JSON.stringify(discrepancies)),
          totalWalletCredits,
          expectedTotalCirculating,
          totalWalletsChecked: wallets.length,
          studiesChecked: studies.length,
        },
      },
    });
    incidentId = incident.id;

    console.error("************************************************************");
    console.error(`[CRITICAL INCIDENT #${incidentId}] LEDGER RECONCILIATION MISMATCH:`);
    console.error(JSON.stringify(discrepancies, null, 2));
    console.error("************************************************************");
  }

  return {
    ok: isHealthy,
    checkedAt: new Date(),
    discrepancies,
    metrics: {
      totalWalletsChecked: wallets.length,
      circulatingCredits: totalWalletCredits,
      systemIssuanceBalance,
      studiesChecked: studies.length,
    },
    incidentId,
  };
}
