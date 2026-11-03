/**
 * Legacy Payments Module (Chapa, Telebirr, CBE)
 * 
 * IMPORTANT:
 * Per ADR 0001 (docs/adr/0001-credits-not-money.md) and binding product decisions:
 * - Real-money payouts and deposits are permanently paused.
 * - This module is kept strictly for historical auditing and schema integrity.
 * - NO enabled application route imports or executes this module.
 * - All methods enforce server-side feature flags (CASH_PAYMENTS_ENABLED and WITHDRAWALS_ENABLED).
 */

export * from "./types";
export * from "./legacyChapa";
export * from "./legacyDisbursement";
