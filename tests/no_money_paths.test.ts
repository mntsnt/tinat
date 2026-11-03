import { test, describe } from 'node:test';
import assert from 'node:assert';
import { FEATURES, CREDITS_DISCLAIMER, formatCredits, validateStartupFeatureFlags } from '../lib/config/features';
import { initializeChapaPayment, verifyChapaTransaction, disburseToTelebirrOrCbe } from '../modules/payments-legacy';

describe("No Money Paths & Payment-Regulation Guard (ADR 0001)", () => {
  test("Feature flags defaults: cash movements and withdrawals are disabled", () => {
    assert.strictEqual(FEATURES.WITHDRAWALS_ENABLED, false);
    assert.strictEqual(FEATURES.CASH_PAYMENTS_ENABLED, false);
    assert.strictEqual(
      CREDITS_DISCLAIMER,
      "Tinat Credits have no cash value and cannot be exchanged for money."
    );
  });

  test("Legacy Chapa payment initialization throws when CASH_PAYMENTS_ENABLED is disabled", async () => {
    await assert.rejects(
      async () => {
        await initializeChapaPayment({
          amount: 500,
          currency: "ETB",
          email: "researcher@tinat.app",
          txRef: "test-tx-ref-123",
          callbackUrl: "https://tinat.app/callback",
          returnUrl: "https://tinat.app/return",
        });
      },
      {
        message: /\[PAYMENT_SECURITY\] Attempted to invoke legacy Chapa initializePayment while CASH_PAYMENTS_ENABLED is disabled/
      }
    );
  });

  test("Legacy Chapa transaction verification throws when CASH_PAYMENTS_ENABLED is disabled", async () => {
    await assert.rejects(
      async () => {
        await verifyChapaTransaction("test-tx-ref-123");
      },
      {
        message: /\[PAYMENT_SECURITY\] Attempted to invoke legacy Chapa verifyTransaction while CASH_PAYMENTS_ENABLED is disabled/
      }
    );
  });

  test("Legacy Telebirr and CBE disbursement throws when WITHDRAWALS_ENABLED is disabled", async () => {
    await assert.rejects(
      async () => {
        await disburseToTelebirrOrCbe({
          withdrawalId: "with-123",
          amount: 100,
          method: "TELEBIRR",
          accountInfo: "0912345678",
          recipientName: "Test Participant",
        });
      },
      {
        message: /\[PAYMENT_SECURITY\] Attempted to invoke legacy Telebirr\/CBE disbursement while WITHDRAWALS_ENABLED is disabled/
      }
    );
  });

  describe("Startup Check & Legal Approval Guard", () => {
    test("Production with WITHDRAWALS_ENABLED=true without LEGAL_APPROVAL_REF throws critical error", () => {
      assert.throws(
        () => {
          validateStartupFeatureFlags({
            NODE_ENV: "production",
            WITHDRAWALS_ENABLED: "true",
            CASH_PAYMENTS_ENABLED: "false",
            LEGAL_APPROVAL_REF: "",
          } as NodeJS.ProcessEnv);
        },
        {
          message: /CRITICAL REGULATORY ERROR: Real-money features enabled in production without mandatory LEGAL_APPROVAL_REF/
        }
      );
    });

    test("Production with CASH_PAYMENTS_ENABLED=true without LEGAL_APPROVAL_REF throws critical error", () => {
      assert.throws(
        () => {
          validateStartupFeatureFlags({
            NODE_ENV: "production",
            WITHDRAWALS_ENABLED: "false",
            CASH_PAYMENTS_ENABLED: "true",
            LEGAL_APPROVAL_REF: "   ",
          } as NodeJS.ProcessEnv);
        },
        {
          message: /CRITICAL REGULATORY ERROR: Real-money features enabled in production without mandatory LEGAL_APPROVAL_REF/
        }
      );
    });

    test("Production with safe defaults (flags=false) succeeds without error", () => {
      assert.doesNotThrow(() => {
        validateStartupFeatureFlags({
          NODE_ENV: "production",
          WITHDRAWALS_ENABLED: "false",
          CASH_PAYMENTS_ENABLED: "false",
        } as NodeJS.ProcessEnv);
      });
    });

    test("Production with flags=true and verified LEGAL_APPROVAL_REF succeeds with audit log", () => {
      assert.doesNotThrow(() => {
        validateStartupFeatureFlags({
          NODE_ENV: "production",
          WITHDRAWALS_ENABLED: "true",
          CASH_PAYMENTS_ENABLED: "false",
          LEGAL_APPROVAL_REF: "NBE-ONPS-2026-TINAT-001",
        } as NodeJS.ProcessEnv);
      });
    });
  });

  describe("Token Formatting & Non-Cash Invariants", () => {
    test("formatCredits strictly formats integers with 'TC' unit", () => {
      assert.strictEqual(formatCredits(0), "0 TC");
      assert.strictEqual(formatCredits(25), "25 TC");
      assert.strictEqual(formatCredits(100), "100 TC");
      // Floating numbers are floored to integers
      assert.strictEqual(formatCredits(25.99), "25 TC");
      assert.strictEqual(formatCredits(null), "0 TC");
      assert.strictEqual(formatCredits(undefined), "0 TC");
    });
  });
});
