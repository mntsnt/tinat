import "dotenv/config";
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { executeBalancedReward } from '../lib/ledger';
import { reconcileLedger } from '../lib/reconciliation';
import { getOrCreateParticipantLink } from '../lib/identity/linkService';

describe("Part 2: Double-Entry Ledger Concurrency, Invariants & Immutability", () => {
  const testRunId = `test_${Date.now()}`;
  let researcherId: string;
  let testStudyId: string;
  const participantIds: string[] = [];
  let successfulParticipantId: string;

  before(async () => {
    // 1. Create test researcher
    const researcher = await prisma.user.create({
      data: {
        name: `Researcher ${testRunId}`,
        email: `researcher_${testRunId}@tinat.test`,
        passwordHash: "TEST_HASH",
        role: "RESEARCHER",
        faydaVerified: true,
      },
    });
    researcherId = researcher.id;

    // 2. Create test study with exact budget for 5 responses (5 x 10 TC = 50 TC)
    const study = await prisma.study.create({
      data: {
        title: `Concurrency Test Study ${testRunId}`,
        researcherId,
        fundingType: "FUNDED",
        creditPerResponse: 10,
        creditBudget: 50,
        creditsSpent: 0,
        status: "ACTIVE",
        questions: {
          create: [
            {
              text: "Sample concurrency survey question?",
              type: "SHORT_TEXT",
              required: true,
              order: 1,
            },
          ],
        },
      },
    });
    testStudyId = study.id;

    // 3. Create 25 test participants with wallets
    for (let i = 0; i < 25; i++) {
      const p = await prisma.user.create({
        data: {
          name: `Participant ${i}_${testRunId}`,
          email: `participant_${i}_${testRunId}@tinat.test`,
          passwordHash: "TEST_HASH",
          role: "PARTICIPANT",
          isVerified: true,
          faydaVerified: true,
          wallet: {
            create: {
              balance: 0,
              totalEarned: 0,
              totalWithdrawn: 0,
            },
          },
        },
      });
      participantIds.push(p.id);
    }
  });

  after(async () => {
    // Clean up test study, responses, answers
    try {
      await prisma.answer.deleteMany({
        where: { response: { studyId: testStudyId } },
      });
      await prisma.participantLink.deleteMany({
        where: { studyId: testStudyId },
      });
      await prisma.response.deleteMany({
        where: { studyId: testStudyId },
      });
      await prisma.question.deleteMany({
        where: { studyId: testStudyId },
      });
      await prisma.study.delete({
        where: { id: testStudyId },
      });
      // Test users are preserved as part of immutable ledger audit trail per ADR 0001
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  test("Database CHECK Constraints: Enforces balance >= 0 and amount <> 0", async () => {
    const testUser = participantIds[0];
    const wallet = await prisma.wallet.findUnique({ where: { userId: testUser } });
    assert(wallet, "Wallet must exist");

    // Attempt negative wallet balance
    await assert.rejects(
      async () => {
        await prisma.$queryRaw`
          UPDATE "Wallet" SET balance = -10 WHERE id = ${wallet.id};
        `;
      },
      /check constraint|violates check constraint/i,
      "Expected Wallet_balance_check violation for negative balance"
    );

    // Attempt zero amount in LedgerEntry
    const journal = await prisma.ledgerJournal.create({
      data: {
        idempotencyKey: `zero-check-${Date.now()}`,
        description: "Zero check test",
      },
    });

    await assert.rejects(
      async () => {
        await prisma.$queryRaw`
          INSERT INTO "LedgerEntry" (id, "journalId", "accountId", amount, "balanceAfter", "createdAt")
          VALUES (${`zero_entry_${Date.now()}`}, ${journal.id}, 'system_issuance_account', 0, 0, NOW());
        `;
      },
      /check constraint|violates check constraint/i,
      "Expected LedgerEntry_amount_check violation for amount = 0"
    );
  });

  test("Append-Only Immutability: Triggers prevent UPDATE and DELETE on ledger tables", async () => {
    const journalKey = `immutable-test-${Date.now()}`;
    const journal = await prisma.ledgerJournal.create({
      data: {
        idempotencyKey: journalKey,
        description: "Immutability trigger test",
      },
    });

    // Test UPDATE on LedgerJournal is blocked
    await assert.rejects(
      async () => {
        await prisma.$queryRaw`
          UPDATE "LedgerJournal" SET description = 'Tampered' WHERE id = ${journal.id};
        `;
      },
      /Ledger records are immutable and append-only/i,
      "Expected trg_immutable_ledger_journal to block UPDATE"
    );

    // Test DELETE on LedgerJournal is blocked
    await assert.rejects(
      async () => {
        await prisma.$queryRaw`
          DELETE FROM "LedgerJournal" WHERE id = ${journal.id};
        `;
      },
      /Ledger records are immutable and append-only/i,
      "Expected trg_immutable_ledger_journal to block DELETE"
    );
  });

  test("Concurrent Submissions Near Budget Limit: Exactly budget limit accepted, zero overdraft", async () => {
    // 25 participants concurrently submit to study with budget of 50 TC (5 responses max)
    const simulateSubmission = async (participantId: string) => {
      try {
        return await prisma.$transaction(
          async (tx) => {
          // Lock/fetch study row
          const studyRows = await tx.$queryRaw<Array<any>>`
            SELECT id, "fundingType", "creditPerResponse", "creditBudget", "creditsSpent", status
            FROM "Study"
            WHERE id = ${testStudyId}
            FOR UPDATE;
          `;
          const currentStudy = studyRows[0];

          if (currentStudy.status !== "ACTIVE") {
            throw new Error("STUDY_NOT_ACTIVE");
          }

          const remaining = currentStudy.creditBudget - currentStudy.creditsSpent;
          if (remaining < currentStudy.creditPerResponse) {
            await tx.study.update({
              where: { id: testStudyId },
              data: { status: "PAUSED" },
            });
            throw new Error("BUDGET_EXCEEDED");
          }

          const { respondentCode } = await getOrCreateParticipantLink({
            userId: participantId,
            studyId: testStudyId,
            tx,
          });

          // Create response
          const response = await tx.response.create({
            data: {
              studyId: testStudyId,
              respondentCode,
              collectionMethod: "SELF",
              answers: {
                create: [
                  {
                    questionId: (await tx.question.findFirst({ where: { studyId: testStudyId } }))!.id,
                    textValue: "Concurrent submission answer",
                  },
                ],
              },
            },
          });

          // Balanced reward with atomic UPDATE ... RETURNING
          const rewardResult = await executeBalancedReward({
            studyId: testStudyId,
            participantId,
            responseId: response.id,
            amount: currentStudy.creditPerResponse,
            studyTitle: "Concurrency Test Study",
            tx,
          });

          // Atomically update study creditsSpent
          const newSpent = currentStudy.creditsSpent + currentStudy.creditPerResponse;
          const budgetReached = newSpent >= currentStudy.creditBudget;

          await tx.study.update({
            where: { id: testStudyId },
            data: {
              creditsSpent: newSpent,
              status: budgetReached ? "PAUSED" : "ACTIVE",
            },
          });

          return { success: true, participantId, reward: rewardResult };
        },
        { maxWait: 60000, timeout: 60000 }
      );
      } catch (err: any) {
        return { success: false, participantId, error: err.message };
      }
    };

    // Execute 25 simultaneous concurrent submissions
    const results = await Promise.all(
      participantIds.map((pId) => simulateSubmission(pId))
    );

    const successful = results.filter((r) => r.success);
    successfulParticipantId = successful[0]?.participantId;
    const rejected = results.filter((r): r is { success: false; participantId: string; error: string } => !r.success);
    console.log("SAMPLE REJECTIONS:", rejected.slice(0, 3));

    // Exactly 5 should succeed (5 x 10 TC = 50 TC)
    assert.strictEqual(successful.length, 5, `Expected exactly 5 successful submissions, got ${successful.length}`);
    assert.strictEqual(rejected.length, 20, `Expected exactly 20 rejected submissions, got ${rejected.length}`);

    // All rejections should be BUDGET_EXCEEDED or STUDY_NOT_ACTIVE
    for (const rej of rejected) {
      assert(
        rej.error === "BUDGET_EXCEEDED" || rej.error === "STUDY_NOT_ACTIVE",
        `Unexpected rejection error: ${rej.error}`
      );
    }

    // Verify study final state
    const finalStudy = await prisma.study.findUnique({ where: { id: testStudyId } });
    assert.strictEqual(finalStudy?.creditsSpent, 50, "Study creditsSpent must strictly equal budget of 50 TC");
    assert.strictEqual(finalStudy?.status, "PAUSED", "Study status must be PAUSED after budget exhaustion");
  });

  test("Concurrent Duplicate Submissions: Race-safe unique constraint prevents double rewards", async () => {
    // Pick the first participant who succeeded in previous test
    assert(successfulParticipantId, 'Must have a successful participant from previous test');

    // Fire 10 simultaneous duplicate submissions for the same participant on testStudyId
    const duplicateAttempts = await Promise.all(
      Array.from({ length: 10 }).map(async () => {
        try {
          return await prisma.$transaction(async (tx) => {
            const link = await tx.participantLink.create({
              data: {
                studyId: testStudyId,
                userId: successfulParticipantId,
                respondentCode: `resp_dupe_${Math.random().toString(36).substring(2)}`,
              },
            });

            const resp = await tx.response.create({
              data: {
                studyId: testStudyId,
                respondentCode: link.respondentCode,
                collectionMethod: "SELF",
              },
            });

            await executeBalancedReward({
              studyId: testStudyId,
              participantId: successfulParticipantId,
              responseId: resp.id,
              amount: 10,
              studyTitle: "Duplicate Test",
              tx,
            });

            return { success: true };
          });
        } catch (err: any) {
          return { success: false, error: err.code || err.message };
        }
      })
    );

    const successfulDupes = duplicateAttempts.filter((d) => d.success);
    assert.strictEqual(
      successfulDupes.length,
      0,
      "Zero duplicate submissions should succeed due to unique (studyId, participantId) constraint"
    );
  });

  test("Post-Concurrency Reconciliation: All invariants hold and net sum equals 0", async () => {
    const result = await reconcileLedger({ createIncidentOnMismatch: false });
    assert.strictEqual(result.ok, true, `Expected clean reconciliation, but found discrepancies: ${JSON.stringify(result.discrepancies)}`);
    assert.strictEqual(result.discrepancies.length, 0);
  });
});
