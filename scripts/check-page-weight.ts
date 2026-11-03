import fs from "fs";
import path from "path";
import zlib from "zlib";

const ROOT_APP = path.resolve(__dirname, "..");

// Page weight budget configurations
const PAGE_WEIGHT_BUDGETS = [
  {
    name: "Participant Study Questionnaire",
    filePath: path.join(
      ROOT_APP,
      "app",
      "participant",
      "studies",
      "[id]",
      "StudyQuestionnaire.tsx"
    ),
    maxRawBytes: 60 * 1024, // 60 KB raw source
    maxGzipBytes: 15 * 1024, // 15 KB gzipped source
    forbiddenImports: ["recharts", "xlsx", "zxing-wasm", "bcryptjs"],
  },
  {
    name: "Study Consent Gate",
    filePath: path.join(
      ROOT_APP,
      "app",
      "participant",
      "studies",
      "[id]",
      "StudyConsentGate.tsx"
    ),
    maxRawBytes: 30 * 1024,
    maxGzipBytes: 8 * 1024,
    forbiddenImports: ["recharts", "xlsx"],
  },
  {
    name: "Public Study Response Submission",
    filePath: path.join(
      ROOT_APP,
      "app",
      "participant",
      "studies",
      "[id]",
      "page.tsx"
    ),
    maxRawBytes: 20 * 1024,
    maxGzipBytes: 5 * 1024,
    forbiddenImports: ["recharts"],
  },
];

export function checkPageWeights() {
  console.log("Checking page weight and low-bandwidth budgets...\n");
  let failed = false;

  for (const item of PAGE_WEIGHT_BUDGETS) {
    if (!fs.existsSync(item.filePath)) {
      console.error(`[ERROR] File not found: ${item.filePath}`);
      failed = true;
      continue;
    }

    const content = fs.readFileSync(item.filePath);
    const rawBytes = content.length;
    const gzipped = zlib.gzipSync(content);
    const gzipBytes = gzipped.length;

    console.log(`- ${item.name}:`);
    console.log(`  Raw size: ${(rawBytes / 1024).toFixed(2)} KB (budget: ${(item.maxRawBytes / 1024).toFixed(0)} KB)`);
    console.log(`  Gzip size: ${(gzipBytes / 1024).toFixed(2)} KB (budget: ${(item.maxGzipBytes / 1024).toFixed(0)} KB)`);

    if (rawBytes > item.maxRawBytes) {
      console.error(`  [FAIL] Raw size exceeded budget by ${((rawBytes - item.maxRawBytes) / 1024).toFixed(2)} KB!`);
      failed = true;
    }

    if (gzipBytes > item.maxGzipBytes) {
      console.error(`  [FAIL] Gzip size exceeded budget by ${((gzipBytes - item.maxGzipBytes) / 1024).toFixed(2)} KB!`);
      failed = true;
    }

    // Check forbidden imports
    const codeStr = content.toString("utf8");
    for (const forbidden of item.forbiddenImports) {
      if (
        codeStr.includes(`from "${forbidden}"`) ||
        codeStr.includes(`from '${forbidden}'`) ||
        codeStr.includes(`require("${forbidden}")`)
      ) {
        console.error(`  [FAIL] Forbidden heavy dependency '${forbidden}' imported in low-bandwidth component!`);
        failed = true;
      }
    }

    if (!failed) {
      console.log(`  [PASS] Within low-bandwidth budget.\n`);
    }
  }

  if (failed) {
    console.error("\n[CRITICAL CI FAILURE] Page-weight budget check failed.");
    process.exit(1);
  } else {
    console.log("\n[PASS] All survey critical components satisfy low-bandwidth page-weight budgets.");
    process.exit(0);
  }
}

if (require.main === module) {
  checkPageWeights();
}
