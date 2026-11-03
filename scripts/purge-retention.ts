import "dotenv/config";
import { runDataRetentionPolicy } from "../lib/privacy/retention";

async function main() {
  console.log("============================================================");
  console.log("Starting Tinat Automated Data-Retention Purge Job...");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("============================================================");

  const result = await runDataRetentionPolicy();

  console.log("\nRetention Execution Summary:");
  console.log(`- Telemetry Records Anonymized (IP/Fingerprints): ${result.telemetryPurged}`);
  console.log(`- Expired Verification Codes Cleared: ${result.verificationCodesPurged}`);
  console.log(`- Expired Collector Invitations Purged: ${result.invitationsPurged}`);
  console.log(`- Duration: ${result.durationMs}ms`);
  console.log("- Status: ✓ SUCCESS (Data minimization policy enforced)");
  console.log("============================================================\n");
}

main()
  .catch((err) => {
    console.error("Critical error executing retention policy:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
