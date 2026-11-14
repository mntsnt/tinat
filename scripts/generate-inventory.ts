import fs from "fs";
import path from "path";

interface ModelInfo {
  name: string;
  fieldsCount: number;
  fields: { name: string; type: string; isId?: boolean; isOptional?: boolean; isList?: boolean }[];
}

interface EnumInfo {
  name: string;
  values: string[];
}

interface PageRouteInfo {
  route: string;
  filePath: string;
}

interface ApiHandlerInfo {
  path: string;
  methods: string[];
  roles: string;
  filePath: string;
}

const ROOT_APP = path.resolve(__dirname, "..");
const ROOT_PROJECT = path.resolve(ROOT_APP, "..");

function parseSchemaPrisma(): { models: ModelInfo[]; enums: EnumInfo[] } {
  const schemaPath = path.join(ROOT_APP, "prisma", "schema.prisma");
  const content = fs.readFileSync(schemaPath, "utf8");

  const models: ModelInfo[] = [];
  const enums: EnumInfo[] = [];

  const modelRegex = /model\s+([A-Za-z0-9_]+)\s+{([^}]+)}/g;
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const lines = body.split("\n");
    const fields: ModelInfo["fields"] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue;
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const fieldName = parts[0];
        const fieldType = parts[1];
        fields.push({
          name: fieldName,
          type: fieldType,
          isId: line.includes("@id"),
          isOptional: fieldType.endsWith("?"),
          isList: fieldType.endsWith("[]"),
        });
      }
    }

    models.push({
      name: modelName,
      fieldsCount: fields.length,
      fields,
    });
  }

  const enumRegex = /enum\s+([A-Za-z0-9_]+)\s+{([^}]+)}/g;
  while ((match = enumRegex.exec(content)) !== null) {
    const enumName = match[1];
    const body = match[2];
    const values = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("//"));

    enums.push({
      name: enumName,
      values,
    });
  }

  models.sort((a, b) => a.name.localeCompare(b.name));
  enums.sort((a, b) => a.name.localeCompare(b.name));

  return { models, enums };
}

function findPageRoutes(): PageRouteInfo[] {
  const appDir = path.join(ROOT_APP, "app");
  const pages: PageRouteInfo[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "api" && entry.name !== "components" && !entry.name.startsWith(".")) {
          walk(fullPath);
        }
      } else if (entry.name === "page.tsx" || entry.name === "page.jsx" || entry.name === "page.js") {
        let relative = path.relative(appDir, currentDir).replace(/\\/g, "/");
        let route = relative === "" ? "/" : `/${relative}`;
        pages.push({ route, filePath: path.relative(ROOT_APP, fullPath).replace(/\\/g, "/") });
      }
    }
  }

  walk(appDir);
  pages.sort((a, b) => a.route.localeCompare(b.route));
  return pages;
}

function findApiHandlers(): ApiHandlerInfo[] {
  const apiDir = path.join(ROOT_APP, "app", "api");
  const handlers: ApiHandlerInfo[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === "route.ts" || entry.name === "route.js") {
        const relative = path.relative(apiDir, currentDir).replace(/\\/g, "/");
        const apiPath = `/api/${relative}`;
        const content = fs.readFileSync(fullPath, "utf8");

        const methods: string[] = [];
        if (/export\s+async\s+function\s+GET/i.test(content)) methods.push("GET");
        if (/export\s+async\s+function\s+POST/i.test(content)) methods.push("POST");
        if (/export\s+async\s+function\s+PATCH/i.test(content)) methods.push("PATCH");
        if (/export\s+async\s+function\s+DELETE/i.test(content)) methods.push("DELETE");
        if (/export\s+async\s+function\s+PUT/i.test(content)) methods.push("PUT");

        let roles = "PUBLIC / UNGUARDED";
        if (content.includes("requireRole")) {
          const roleMatch = content.match(/requireRole\(\s*(\[[^\]]+\]|"[^"]+"|[A-Za-z0-9_.]+)/);
          if (roleMatch) {
            roles = roleMatch[1].replace(/["']/g, "").replace(/\s+/g, " ");
          } else {
            roles = "ROLE_RESTRICTED";
          }
        } else if (content.includes("requireStudyOwnerOrAdmin")) {
          roles = "RESEARCHER (OWNER) | ADMIN";
        } else if (content.includes("requireProjectMember")) {
          roles = "PROJECT_MEMBER (ROLE_CHECKED)";
        } else if (content.includes("requireUser")) {
          roles = "AUTHENTICATED_USER";
        } else if (content.includes("getSession") || content.includes("getCurrentUser")) {
          roles = "SESSION_CHECKED";
        }

        handlers.push({
          path: apiPath,
          methods,
          roles,
          filePath: path.relative(ROOT_APP, fullPath).replace(/\\/g, "/"),
        });
      }
    }
  }

  walk(apiDir);
  handlers.sort((a, b) => a.path.localeCompare(b.path));
  return handlers;
}

function getVersions(): Record<string, string> {
  const appPkgPath = path.join(ROOT_APP, "package.json");
  const mobilePkgPath = path.join(ROOT_PROJECT, "apps", "admin-mobile", "package.json");

  let nextVersion = "N/A";
  let reactVersion = "N/A";
  let prismaVersion = "N/A";
  let expoVersion = "N/A";
  let reactNativeVersion = "N/A";

  if (fs.existsSync(appPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(appPkgPath, "utf8"));
    nextVersion = pkg.dependencies?.next || "N/A";
    reactVersion = pkg.dependencies?.react || "N/A";
    prismaVersion = pkg.dependencies?.["@prisma/client"] || "N/A";
  }

  if (fs.existsSync(mobilePkgPath)) {
    const mobilePkg = JSON.parse(fs.readFileSync(mobilePkgPath, "utf8"));
    expoVersion = mobilePkg.dependencies?.expo || "N/A";
    reactNativeVersion = mobilePkg.dependencies?.["react-native"] || "N/A";
  }

  return {
    "Next.js": nextVersion,
    React: reactVersion,
    Prisma: prismaVersion,
    Expo: expoVersion,
    "React Native": reactNativeVersion,
  };
}

export function generateInventoryMarkdown(): string {
  const { models, enums } = parseSchemaPrisma();
  const pages = findPageRoutes();
  const handlers = findApiHandlers();
  const versions = getVersions();

  const timestamp = new Date().toISOString();

  let md = `# System Inventory & Architecture Index

**Auto-generated via:** \`scripts/generate-inventory.ts\`<br />
**Generated At:** ${timestamp}<br />
**Platform:** Tinat Health Research Ecosystem (Ethiopia)<br />
**Regulatory Standard:** Ethiopian Personal Data Protection Proclamation No. 1321/2024

---

## 1. Package & Framework Versions

| Package / Framework | Project Location | Declared Version |
| :--- | :--- | :--- |
| **Next.js** | \`app\` (Web Platform) | \`${versions["Next.js"]}\` |
| **React** | \`app\` (Web Platform) | \`${versions["React"]}\` |
| **Prisma ORM** | \`app\` (Database Engine) | \`${versions["Prisma"]}\` |
| **Expo SDK** | \`apps/admin-mobile\` (Admin Mobile App) | \`${versions["Expo"]}\` |
| **React Native** | \`apps/admin-mobile\` (Admin Mobile App) | \`${versions["React Native"]}\` |

---

## 2. Database Schema Summary

- **Total Models:** ${models.length}
- **Total Enums:** ${enums.length}

### 2.1 Enums (${enums.length} Enums)

| Enum Name | Allowed Values Count | Values |
| :--- | :--- | :--- |
${enums.map((e) => `| \`${e.name}\` | ${e.values.length} | ${e.values.map((v) => `\`${v}\``).join(", ")} |`).join("\n")}

### 2.2 Models (${models.length} Models)

| Model Name | Field Count | Primary Key / Index Summary |
| :--- | :--- | :--- |
${models.map((m) => `| \`${m.name}\` | ${m.fieldsCount} | \`id: ${m.fields.find((f) => f.isId)?.type || "cuid"}\` |`).join("\n")}

---

## 3. Web Application Page Routes (${pages.length} Pages)

| Page Route | Relative Path |
| :--- | :--- |
${pages.map((p) => `| \`${p.route}\` | \`${p.filePath}\` |`).join("\n")}

---

## 4. API Route Handlers (${handlers.length} Handlers)

| Endpoint Path | HTTP Methods | Required Authorization / Role Gate | Source File |
| :--- | :--- | :--- | :--- |
${handlers.map((h) => `| \`${h.path}\` | ${h.methods.map((m) => `\`${m}\``).join(" ")} | \`${h.roles}\` | \`${h.filePath}\` |`).join("\n")}

---

## 5. Architectural Compliance Verification Notes

1. **Authentication:** Custom session cookies (\`tinat_session\`) with Jose HS256 JWT tokens. NextAuth has been cleanly migrated to native Next.js Jose JWT authentication.
2. **User Roles:** Standardized across \`PARTICIPANT\`, \`RESEARCHER\`, \`ADMIN\`, and \`DATA_COLLECTOR\`.
3. **Double-Entry Ledger:** All credit movements balance to zero net sum across \`LedgerEntry\` and \`LedgerAccount\`.
4. **Data Separation:** Pseudonymized respondent codes isolate participant accounts from research response datasets under Proclamation 1321/2024.
`;

  return md;
}

// Execution block
if (require.main === module) {
  const isCheckMode = process.argv.includes("--check");
  const outputPath = path.join(ROOT_APP, "docs", "inventory.md");
  const generated = generateInventoryMarkdown();

  if (isCheckMode) {
    if (!fs.existsSync(outputPath)) {
      console.error("[ERROR] docs/inventory.md does not exist. Run 'npm run inventory:generate'.");
      process.exit(1);
    }
    const current = fs.readFileSync(outputPath, "utf8");
    // Strip timestamps for comparison
    const cleanCurrent = current.replace(/\*\*Generated At:\*\* [^\n]+/, "");
    const cleanGenerated = generated.replace(/\*\*Generated At:\*\* [^\n]+/, "");

    if (cleanCurrent !== cleanGenerated) {
      console.error("[ERROR] Documentation drift detected in docs/inventory.md! Run 'npm run inventory:generate' to update.");
      process.exit(1);
    } else {
      console.log("[OK] docs/inventory.md matches current codebase schema and routes.");
      process.exit(0);
    }
  } else {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, generated, "utf8");
    console.log(`[SUCCESS] Generated inventory at ${outputPath}`);
  }
}
