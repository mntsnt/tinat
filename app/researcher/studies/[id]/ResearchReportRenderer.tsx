"use client";

import React, { useMemo } from "react";

interface ResearchReportRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
}

type Alignment = "left" | "center" | "right";

interface TableBlock {
  type: "table";
  headers: string[];
  alignments: Alignment[];
  rows: string[][];
}

interface HeadingBlock {
  type: "heading";
  level: number;
  text: string;
}

interface ListBlock {
  type: "ol" | "ul";
  items: string[];
}

interface BlockquoteBlock {
  type: "blockquote";
  text: string;
}

interface CodeBlock {
  type: "code";
  code: string;
  lang?: string;
}

interface ParagraphBlock {
  type: "p";
  text: string;
}

interface HrBlock {
  type: "hr";
}

type Block =
  | TableBlock
  | HeadingBlock
  | ListBlock
  | BlockquoteBlock
  | CodeBlock
  | ParagraphBlock
  | HrBlock;

/**
 * Parses inline formatting: **bold**, *italic*, `code`, [links], and ***bold-italic***.
 * Returns React elements safely without using dangerouslySetInnerHTML (100% XSS-safe).
 */
function parseInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match:
  // 1. `code`
  // 2. ***bold italic***
  // 3. **bold** or __bold__
  // 4. *italic* or _italic_
  // 5. [link text](url)
  const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    const key = `inline_${match.index}_${token.length}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      const codeText = token.slice(1, -1);
      parts.push(
        <code
          key={key}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground border border-border/80"
        >
          {codeText}
        </code>
      );
    } else if (token.startsWith("***") && token.endsWith("***")) {
      parts.push(
        <strong key={key} className="font-bold text-foreground">
          <em className="italic">{token.slice(3, -3)}</em>
        </strong>
      );
    } else if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      parts.push(
        <strong key={key} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      parts.push(
        <em key={key} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    } else {
      parts.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  // Push remaining plain text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

/**
 * Splits markdown document into high-level structured blocks:
 * Tables, Headings, Lists, Blockquotes, Code Blocks, Paragraphs.
 */
function parseMarkdownBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced Code Block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "code", code: codeLines.join("\n"), lang });
      continue;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)\s*$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Markdown Table: lines starting with |
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const rawHeaders = tableLines[0]
          .slice(1, -1)
          .split("|")
          .map((s) => s.trim());
        const rawAlignments = tableLines[1]
          .slice(1, -1)
          .split("|")
          .map((s) => s.trim());

        const alignments: Alignment[] = rawAlignments.map((a) => {
          const left = a.startsWith(":");
          const right = a.endsWith(":");
          if (left && right) return "center";
          if (right) return "right";
          return "left";
        });

        const rows: string[][] = [];
        for (let r = 2; r < tableLines.length; r++) {
          const cells = tableLines[r]
            .slice(1, -1)
            .split("|")
            .map((s) => s.trim());
          rows.push(cells);
        }

        blocks.push({
          type: "table",
          headers: rawHeaders,
          alignments,
          rows,
        });
        continue;
      }
    }

    // Headings: #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Blockquote: > text
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join("\n"),
      });
      continue;
    }

    // Numbered List: 1. or 1)
    const numMatch = line.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (numMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^(\d+)[\.\)]\s+(.*)$/);
        if (itemMatch) {
          items.push(itemMatch[2].trim());
          i++;
        } else if (lines[i].startsWith("   ") || lines[i].startsWith("\t")) {
          if (items.length > 0) {
            items[items.length - 1] += " " + lines[i].trim();
          }
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Bullet List: - or * or +
    const bulletMatch = line.match(/^[\-\*\+]\s+(.*)$/);
    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^[\-\*\+]\s+(.*)$/);
        if (itemMatch) {
          items.push(itemMatch[1].trim());
          i++;
        } else if (lines[i].startsWith("  ") || lines[i].startsWith("\t")) {
          if (items.length > 0) {
            items[items.length - 1] += " " + lines[i].trim();
          }
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Regular Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].match(/^(\d+)[\.\)]\s+/) &&
      !lines[i].match(/^[\-\*\+]\s+/) &&
      !/^(---|___|\*\*\*)\s*$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({ type: "p", text: paraLines.join(" ") });
    }
  }

  return blocks;
}

export function ResearchReportRenderer({
  content,
  className = "",
  compact = false,
}: ResearchReportRendererProps) {
  const blocks = useMemo(() => parseMarkdownBlocks(content || ""), [content]);

  return (
    <div className={`research-report-content w-full space-y-3.5 ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading": {
            if (block.level === 1) {
              return (
                <h1
                  key={idx}
                  className="text-xl font-bold tracking-tight text-foreground border-b border-border pb-2.5 mb-3 mt-6 first:mt-0 flex items-center gap-2"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block shrink-0" />
                  <span>{parseInline(block.text)}</span>
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  className="text-base font-bold tracking-tight text-foreground border-b border-border/40 pb-1.5 mb-2.5 mt-5 first:mt-0 flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full bg-primary/80 inline-block shrink-0" />
                  <span>{parseInline(block.text)}</span>
                </h2>
              );
            }
            if (block.level === 3) {
              return (
                <h3
                  key={idx}
                  className="text-sm font-bold uppercase tracking-wider text-foreground/90 mb-1.5 mt-4 first:mt-0"
                >
                  {parseInline(block.text)}
                </h3>
              );
            }
            return (
              <h4
                key={idx}
                className="text-xs sm:text-sm font-semibold text-foreground/80 mb-1 mt-3 first:mt-0"
              >
                {parseInline(block.text)}
              </h4>
            );
          }

          case "table": {
            return (
              <div
                key={idx}
                className="my-4 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs"
              >
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-muted/80 text-foreground border-b border-border">
                      <tr>
                        {block.headers.map((h, colIdx) => {
                          const align = block.alignments[colIdx] || "left";
                          const alignClass =
                            align === "right"
                              ? "text-right"
                              : align === "center"
                              ? "text-center"
                              : "text-left";
                          return (
                            <th
                              key={colIdx}
                              className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap bg-muted/60 ${alignClass}`}
                            >
                              {parseInline(h)}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-card">
                      {block.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                          {row.map((cell, colIdx) => {
                            const align = block.alignments[colIdx] || "left";
                            const alignClass =
                              align === "right"
                                ? "text-right"
                                : align === "center"
                                ? "text-center"
                                : "text-left";
                            return (
                              <td
                                key={colIdx}
                                className={`px-4 py-2.5 text-xs sm:text-sm text-foreground/90 whitespace-nowrap font-sans ${alignClass}`}
                              >
                                {parseInline(cell)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }

          case "ol": {
            return (
              <ol
                key={idx}
                className={`list-decimal pl-5 my-2 space-y-1.5 text-foreground/90 marker:text-primary marker:font-semibold ${
                  compact ? "text-xs" : "text-sm"
                }`}
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed pl-1">
                    {parseInline(item)}
                  </li>
                ))}
              </ol>
            );
          }

          case "ul": {
            return (
              <ul
                key={idx}
                className={`list-disc pl-5 my-2 space-y-1 text-foreground/90 marker:text-primary ${
                  compact ? "text-xs" : "text-sm"
                }`}
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed pl-1">
                    {parseInline(item)}
                  </li>
                ))}
              </ul>
            );
          }

          case "blockquote": {
            return (
              <blockquote
                key={idx}
                className="my-3 border-l-4 border-primary bg-primary/5 pl-4 pr-3 py-2.5 rounded-r-xl text-sm text-foreground/90 italic shadow-xs"
              >
                {parseInline(block.text)}
              </blockquote>
            );
          }

          case "code": {
            return (
              <pre
                key={idx}
                className="my-3 overflow-x-auto rounded-xl border border-border bg-muted/40 p-3.5 font-mono text-xs text-foreground shadow-xs"
              >
                <code>{block.code}</code>
              </pre>
            );
          }

          case "hr": {
            return <hr key={idx} className="my-5 border-border/60" />;
          }

          case "p":
          default: {
            return (
              <p
                key={idx}
                className={`leading-relaxed text-foreground/90 ${
                  compact ? "text-xs my-1" : "text-sm my-2"
                } last:mb-0`}
              >
                {parseInline(block.text)}
              </p>
            );
          }
        }
      })}
    </div>
  );
}
