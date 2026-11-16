import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  calculateCollectorBudgetCents,
  parseEtbCents,
} from "../lib/payments/collectorCompensation";
import { evaluateCollectorFundingResult } from "../lib/payments/collectorFunding";
import { isValidVerifyEtSignature } from "../lib/payments/verifyEt";

describe("Verify.et collector funding", () => {
  test("ETB amounts are parsed as exact minor units", () => {
    assert.equal(parseEtbCents("125"), 12500);
    assert.equal(parseEtbCents("1.5"), 150);
    assert.equal(parseEtbCents(0.01), 1);
    assert.equal(parseEtbCents("1.005"), null);
    assert.equal(parseEtbCents("-1"), null);
    assert.equal(parseEtbCents("1e2"), null);
    assert.equal(parseEtbCents("21474836.48"), null);
  });

  test("collector funding budget uses the selected compensation model", () => {
    assert.equal(
      calculateCollectorBudgetCents({
        collectorPayType: "FIXED",
        collectorPayRateCents: 12500,
        collectorsNeeded: 3,
        participantTarget: 20,
      }),
      37500
    );
    assert.equal(
      calculateCollectorBudgetCents({
        collectorPayType: "PER_RESPONSE",
        collectorPayRateCents: 150,
        collectorsNeeded: 2,
        participantTarget: 20,
      }),
      3000
    );
    assert.throws(
      () =>
        calculateCollectorBudgetCents({
          collectorPayType: "FIXED",
          collectorPayRateCents: 2_000_000_000,
          collectorsNeeded: 2,
          participantTarget: 20,
        }),
      /exceeds the supported ETB amount/
    );
  });

  test("only exact, successful ETB payments to Tinat's settlement account are accepted", () => {
    const success = evaluateCollectorFundingResult(
      {
        processingStatus: "completed",
        status: "success",
        verified: true,
        amount: "375.00",
        currency: "ETB",
        settlementAccountMatch: { matched: true },
      },
      37500
    );
    assert.equal(success.status, "VERIFIED");

    assert.equal(
      evaluateCollectorFundingResult(
        {
          processingStatus: "completed",
          status: "success",
          verified: true,
          amount: "374.99",
          currency: "ETB",
          settlementAccountMatch: { matched: true },
        },
        37500
      ).status,
      "FAILED"
    );
    assert.equal(
      evaluateCollectorFundingResult(
        {
          processingStatus: "completed",
          status: "success",
          verified: true,
          amount: "375.00",
          settlementAccountMatch: { matched: true },
        },
        37500
      ).status,
      "FAILED"
    );
  });

  test("webhook signatures bind the timestamp and exact raw request body", () => {
    const secret = "test-webhook-secret";
    const rawBody = '{"event":"verification.completed"}';
    const now = Date.parse("2026-11-16T12:00:00.000Z");
    const timestamp = new Date(now).toISOString();
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    assert.equal(
      isValidVerifyEtSignature({ rawBody, timestamp, signature, secret, now }),
      true
    );
    assert.equal(
      isValidVerifyEtSignature({ rawBody: `${rawBody} `, timestamp, signature, secret, now }),
      false
    );
    assert.equal(
      isValidVerifyEtSignature({
        rawBody,
        timestamp: new Date(now - 6 * 60 * 1000).toISOString(),
        signature,
        secret,
        now,
      }),
      false
    );
  });
});
