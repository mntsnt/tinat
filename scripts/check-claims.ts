import fs from "fs";
import path from "path";

const BANNED_PHRASES = [
  "structurally impossible",
  "impossible",
  "guaranteed",
  "banking-grade",
  "most secure",
  "immutable",
  "tamper-proof",
  "100%",
  "unforgeable",
  "anonymous",
  "instant payout",
  "real money",
  "cash",
];

const IGNORE_FILES = ["package-lock.json"];
const IGNORE_DIRS = [
  "node_modules",
  ".next",
  ".git",
  ".expo",
  "dist",
  "build",
  "generated",
  "scratch",
  ".agents",
];

const ROOT_APP = path.resolve(__dirname, "..");
const ROOT_PROJECT = path.resolve(ROOT_APP, "..");

interface AllowlistConfig {
  allowedPatterns: string[];
  allowedFilePrefixes: string[];
  allowedExactLines: string[];
}

function loadAllowlist(): AllowlistConfig {
  const allowlistPath = path.join(ROOT_APP, "docs", "claims-allowlist.json");
  if (fs.existsSync(allowlistPath)) {
    return JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
  }
  return { allowedPatterns: [], allowedFilePrefixes: [], allowedExactLines: [] };
}

interface Violation {
  file: string;
  lineNum: number;
  phrase: string;
  line: string;
}

export function scanForBannedClaims(): Violation[] {
  const allowlist = loadAllowlist();
  const violations: Violation[] = [];

  function isLineAllowed(relPath: string, line: string): boolean {
    const normPath = relPath.replace(/\\/g, "/");

    // Check file prefix allowlist
    for (const prefix of allowlist.allowedFilePrefixes) {
      if (normPath.startsWith(prefix)) return true;
    }

    // Check exact line allowlist
    const trimmed = line.trim();
    for (const exact of allowlist.allowedExactLines) {
      if (trimmed.includes(exact)) return true;
    }

    // Check allowed pattern exceptions (e.g. negative disclaimers like "no cash value")
    const lower = trimmed.toLowerCase();
    for (const pat of allowlist.allowedPatterns) {
      if (lower.includes(pat.toLowerCase())) return true;
    }

    return false;
  }

  function checkFile(fullPath: string, relPath: string) {
    const ext = path.extname(fullPath).toLowerCase();
    if (![".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".md", ".sql", ".txt", ".prisma"].includes(ext)) {
      return;
    }

    if (relPath.endsWith("check-claims.ts") || relPath.endsWith("claims-allowlist.json")) {
      return;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      if (isLineAllowed(relPath, line)) return;

      const lower = line.toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        if (lower.includes(phrase)) {
          // Additional safety check for CSS/SVG 100%
          if (phrase === "100%" && (lower.includes("width=\"100%\"") || lower.includes("height=\"100%\"") || lower.includes("width: 100%") || lower.includes("height: 100%"))) {
            continue;
          }

          violations.push({
            file: relPath.replace(/\\/g, "/"),
            lineNum: idx + 1,
            phrase,
            line: line.trim(),
          });
        }
      }
    });
  }

  function walk(dir: string, baseDir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry.name)) continue;
      if (entry.isFile() && IGNORE_FILES.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        walk(fullPath, baseDir);
      } else {
        checkFile(fullPath, relPath);
      }
    }
  }

  walk(ROOT_APP, ROOT_APP);

  // Also check the manual in the project root
  const manualPath = path.join(ROOT_PROJECT, "TINAT_SYSTEM_ARCHITECTURE_MANUAL.html");
  if (fs.existsSync(manualPath)) {
    checkFile(manualPath, "TINAT_SYSTEM_ARCHITECTURE_MANUAL.html");
  }

  return violations;
}

if (require.main === module) {
  const violations = scanForBannedClaims();

  if (violations.length > 0) {
    console.error(`\n[CRITICAL CI FAILURE] Found ${violations.length} unapproved dishonest/unsubstantiated claims:\n`);
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.lineNum} [Banned: "${v.phrase}"]`);
      console.error(`    Line: ${v.line}\n`);
    }
    console.error("Honest Claims Rule: Do not make absolute security, cash-out, or anonymity promises.");
    console.error("See docs/claims-allowlist.json for justified negative disclaimers.");
    process.exit(1);
  } else {
    console.log(`[PASS] Clean claims check: Zero unapproved absolute claims found across repository.`);
    process.exit(0);
  }
}
