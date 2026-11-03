import "dotenv/config";
import { reconcileLedger } from "../lib/reconciliation";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("============================================================");
  console.log("Starting Tinat Credits Double-Entry Ledger Reconciliation...");
  console.log("Timestamp:", new Date().toISOString());
  console.log("============================================================\n");

  const result = await reconcileLedger({ createIncidentOnMismatch: true });

  console.log("Reconciliation Summary:");
  console.log("- Total Wallets Checked:", result.metrics.totalWalletsChecked);
  console.log("- Total Circulating Credits:", result.metrics.circulatingCredits, "TC");
  console.log("- System Issuance Account Balance:", result.metrics.systemIssuanceBalance, "TC");
  console.log("- Studies Checked:", result.metrics.studiesChecked);
  console.log("- Status:", result.ok ? "✓ HEALTHY (All invariants hold)" : "✗ MISMATCH DETECTED");

  if (!result.ok) {
    console.error("\nDiscrepancies Found (" + result.discrepancies.length + "):");
    result.discrepancies.forEach((d, idx) => {
      console.error(`  ${idx + 1}. [${d.type}] ${d.identifier}`);
      console.error(`     Expected: ${d.expected} | Actual: ${d.actual} | Difference: ${d.difference}`);
      if (d.details) console.error(`     Details: ${d.details}`);
    });
    if (result.incidentId) {
      console.error(`\nIncident Log created with ID: ${result.incidentId}`);
    }
    process.exit(1);
  } else {
    console.log("\nZero discrepancies detected. Ledger is balanced and conserved.");
    process.exit(0);
  }
}

main()
  .catch((err) => {
    console.error("Reconciliation execution failed:", err);
    process.exit(2);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
