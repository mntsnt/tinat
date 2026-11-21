import { Download, Table2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AI_MARKDOWN_CLASS =
  "prose prose-sm dark:prose-invert max-w-none break-words [&>h1]:mb-3 [&>h1]:text-xl [&>h1]:font-semibold [&>h1]:tracking-tight [&>h2]:mt-7 [&>h2]:border-b [&>h2]:border-border [&>h2]:pb-2 [&>h2]:text-lg [&>h2]:font-semibold [&>h3]:mt-5 [&>h3]:text-base [&>h3]:font-semibold [&>p]:my-3 [&>p]:leading-7 [&>ul]:my-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:my-3 [&>ol]:list-decimal [&>ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_blockquote]:border-primary/40 [&_blockquote]:text-muted-foreground";

const markdownTableComponents = {
  table: ({ node, ...props }: any) => (
    <div className="my-4 w-full overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
      <table className="w-full min-w-full divide-y divide-border border-collapse text-left text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="border-b border-border bg-muted/70 text-xs font-semibold uppercase tracking-wider text-muted-foreground" {...props} />
  ),
  tbody: ({ node, ...props }: any) => (
    <tbody className="divide-y divide-border/60 bg-card/40" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="transition-colors hover:bg-muted/40" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-4 py-3 font-semibold text-foreground border-r border-border/40 last:border-r-0 text-left align-middle" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-3 text-foreground/90 border-r border-border/30 last:border-r-0 align-top text-sm leading-relaxed" {...props} />
  ),
};

function isLikelyMath(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  if (/\\([a-zA-Z]+|%|_)/.test(trimmed)) return true;
  if (/^\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?$/.test(trimmed)) return false;
  if (/[=<>≤≥±≈≠~^_+*/]/.test(trimmed)) {
    if (/^[a-zA-Z]+-[a-zA-Z]+$/.test(trimmed)) return false;
    return true;
  }
  if (/^(?:[a-zA-Z]|df|SD|SE|CI|OR|RR|HR|p-value)$/i.test(trimmed)) return true;
  if (/^[a-zA-Z]+_[a-zA-Z0-9]+$/.test(trimmed)) return true;
  if (/^\d+(?:\.\d+)?%$/.test(trimmed)) return true;
  return false;
}

function normalizeMarkdownTables(raw: string): string {
  if (!raw) return "";
  let text = raw;

  // 1. Ensure a blank line before any markdown table row if preceded by text without a blank line
  text = text.replace(/([^\n])\n(\s*\|?[^\n]+\|\s*\n\s*\|?[\s:\-=\+]+\|)/g, "$1\n\n$2");

  // 2. Normalize inline LaTeX math like $n = 36$, $\alpha = 0.05$, $\chi^2 = 4.2$ into clean markdown
  text = text.replace(
    /\$(?!\s|\d+(?:\.\d+)?(?:\s|,|\)|$))([^$\n]+?)(?<!\s)\$/g,
    (fullMatch, math) => {
      if (!isLikelyMath(math)) return fullMatch;
      const varMatch = math.match(/^([a-zA-Z]|df|CI|SD|SE|OR|RR|HR)(\s*[=<>≤≥±≈≠~]\s*.+)$/);
      if (varMatch) {
        return `*${varMatch[1]}*${varMatch[2]}`;
      }
      return math
        .replace(/\\alpha\b/g, "α")
        .replace(/\\beta\b/g, "β")
        .replace(/\\gamma\b/g, "γ")
        .replace(/\\delta\b/g, "δ")
        .replace(/\\chi\b/g, "χ")
        .replace(/\\mu\b/g, "μ")
        .replace(/\\sigma\b/g, "σ")
        .replace(/\\pm\b/g, "±")
        .replace(/\\leq\b|\\le\b/g, "≤")
        .replace(/\\geq\b|\\ge\b/g, "≥")
        .replace(/\\approx\b/g, "≈")
        .replace(/\\neq\b|\\ne\b/g, "≠")
        .replace(/\\bar\{([a-zA-Z])\}/g, "$1̄")
        .replace(/\^2\b/g, "²")
        .replace(/\\text\{([^}]+)\}/g, "$1")
        .replace(/\\%/g, "%");
    }
  );

  return text;
}

type ArtifactRow = Record<string, unknown>;

type RenderPart =
  | { type: "text"; content: string }
  | { type: "artifact"; artifactType: string; title: string; data: string };

function isArtifactRow(value: unknown): value is ArtifactRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cellText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value) ?? String(value);
}

function downloadCsv(title: string, headers: string[], rows: ArtifactRow[]) {
  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csvRows = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(cellText(row[header]))).join(","),
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.replace(/\s+/g, "_").toLowerCase()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export function ArtifactRenderer({ content }: { content: string }) {
  const artifactRegex =
    /<ai_artifact\s+type="([^"]+)"\s+title="([^"]+)">([\s\S]*?)<\/ai_artifact>/g;
  const parts: RenderPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = artifactRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }

    parts.push({
      type: "artifact",
      artifactType: match[1],
      title: match[2],
      data: match[3],
    });
    lastIndex = artifactRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return (
      <div className={AI_MARKDOWN_CLASS}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTableComponents}>
          {normalizeMarkdownTables(content)}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <div key={index} className={AI_MARKDOWN_CLASS}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTableComponents}>
                {normalizeMarkdownTables(part.content)}
              </ReactMarkdown>
            </div>
          );
        }

        if (part.artifactType !== "table") {
          return (
            <div key={index} className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs italic text-muted-foreground">
              Unsupported artifact type: {part.artifactType}
            </div>
          );
        }

        let rows: ArtifactRow[];
        try {
          const parsed: unknown = JSON.parse(part.data);
          if (!Array.isArray(parsed) || !parsed.every(isArtifactRow)) {
            throw new Error("Table data must be an array of objects.");
          }
          rows = parsed;
        } catch {
          return (
            <div
              key={index}
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive"
            >
              Could not display the structured data in this response.
            </div>
          );
        }

        if (rows.length === 0) {
          return (
            <div key={index} className="rounded-xl border border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
              {part.title}: no rows to display.
            </div>
          );
        }

        const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];

        return (
          <section
            key={index}
            aria-label={part.title}
            className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Table2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{part.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Structured data · {rows.length} {rows.length === 1 ? "row" : "rows"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => downloadCsv(part.title, headers, rows)}
                className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV
              </button>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {headers.map((header) => (
                      <th key={header} scope="col" className="border-b border-border px-4 py-2.5 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                      {headers.map((header) => (
                        <td key={header} className="max-w-sm whitespace-pre-wrap px-4 py-3 align-top text-foreground/90">
                          {cellText(row[header]) || <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
