"use client";

import React, { useMemo, useState } from "react";
import { Check, Copy, Download, Table2 } from "lucide-react";

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
  title?: string;
}

interface MathBlock {
  type: "math";
  math: string;
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
  | MathBlock
  | HeadingBlock
  | ListBlock
  | BlockquoteBlock
  | CodeBlock
  | ParagraphBlock
  | HrBlock;

/**
 * Checks whether an inner dollar-delimited string represents real mathematical/statistical
 * notation rather than currency (e.g. $100 or $10 to $20).
 */
function isLikelyMath(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (!trimmed) return false;

  // LaTeX backslash commands: \alpha, \pm, \bar, \frac, \text, etc.
  if (/\\([a-zA-Z]+|%|_)/.test(trimmed)) return true;

  // Mathematical operators or relational symbols: =, <, >, ≤, ≥, ±, ≈, ≠, ~, +, -, *, /, ^, _
  if (/[=<>≤≥±≈≠~^_+*/]/.test(trimmed)) {
    // Avoid hyphenated words like "post-operative"
    if (/^[a-zA-Z]+-[a-zA-Z]+$/.test(trimmed)) return false;
    // Avoid currency/numeric ranges like "25-50" or "10 - 20"
    if (/^\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?$/.test(trimmed)) return false;
    return true;
  }

  // Single-letter variables or common statistical metrics: n, N, p, P, t, z, r, R, F, df, SD, SE, CI, OR, RR, HR
  if (/^(?:[a-zA-Z]|df|SD|SE|CI|OR|RR|HR|p-value)$/i.test(trimmed)) return true;

  // Variable with subscript: x_i, H_0, beta_1
  if (/^[a-zA-Z]+_[a-zA-Z0-9]+$/.test(trimmed)) return true;

  // Explicit percentages: 95%, 5%
  if (/^\d+(?:\.\d+)?%$/.test(trimmed)) return true;

  return false;
}

/**
 * Converts LaTeX math expressions into clean, academic Unicode text.
 */
function formatMathUnicode(latex: string): string {
  let s = latex;

  // Remove formatting wrappers: \text{...}, \mathrm{...}, \mathbf{...}
  s = s.replace(/\\(?:text|mathrm|mathbf|mathit|textsf)\{([^}]+)\}/g, "$1");

  // Escaped special chars
  s = s.replace(/\\%/g, "%");
  s = s.replace(/\\_/g, "_");
  s = s.replace(/\\&/g, "&");
  s = s.replace(/\\#/g, "#");

  // Lowercase Greek letters
  s = s.replace(/\\alpha\b/g, "α");
  s = s.replace(/\\beta\b/g, "β");
  s = s.replace(/\\gamma\b/g, "γ");
  s = s.replace(/\\delta\b/g, "δ");
  s = s.replace(/\\epsilon\b|\\varepsilon\b/g, "ε");
  s = s.replace(/\\zeta\b/g, "ζ");
  s = s.replace(/\\eta\b/g, "η");
  s = s.replace(/\\theta\b|\\vartheta\b/g, "θ");
  s = s.replace(/\\iota\b/g, "ι");
  s = s.replace(/\\kappa\b/g, "κ");
  s = s.replace(/\\lambda\b/g, "λ");
  s = s.replace(/\\mu\b/g, "μ");
  s = s.replace(/\\nu\b/g, "ν");
  s = s.replace(/\\xi\b/g, "ξ");
  s = s.replace(/\\pi\b/g, "π");
  s = s.replace(/\\rho\b|\\varrho\b/g, "ρ");
  s = s.replace(/\\sigma\b|\\varsigma\b/g, "σ");
  s = s.replace(/\\tau\b/g, "τ");
  s = s.replace(/\\upsilon\b/g, "υ");
  s = s.replace(/\\phi\b|\\varphi\b/g, "φ");
  s = s.replace(/\\chi\b/g, "χ");
  s = s.replace(/\\psi\b/g, "ψ");
  s = s.replace(/\\omega\b/g, "ω");

  // Uppercase Greek letters
  s = s.replace(/\\Gamma\b/g, "Γ");
  s = s.replace(/\\Delta\b/g, "Δ");
  s = s.replace(/\\Theta\b/g, "Θ");
  s = s.replace(/\\Lambda\b/g, "Λ");
  s = s.replace(/\\Xi\b/g, "Ξ");
  s = s.replace(/\\Pi\b/g, "Π");
  s = s.replace(/\\Sigma\b/g, "Σ");
  s = s.replace(/\\Upsilon\b/g, "Υ");
  s = s.replace(/\\Phi\b/g, "Φ");
  s = s.replace(/\\Psi\b/g, "Ψ");
  s = s.replace(/\\Omega\b/g, "Ω");

  // Mathematical operators & relations
  s = s.replace(/\\pm\b/g, "±");
  s = s.replace(/\\mp\b/g, "∓");
  s = s.replace(/\\times\b/g, "×");
  s = s.replace(/\\div\b/g, "÷");
  s = s.replace(/\\cdot\b/g, "·");
  s = s.replace(/\\leq\b|\\le\b/g, "≤");
  s = s.replace(/\\geq\b|\\ge\b/g, "≥");
  s = s.replace(/\\neq\b|\\ne\b/g, "≠");
  s = s.replace(/\\approx\b/g, "≈");
  s = s.replace(/\\equiv\b/g, "≡");
  s = s.replace(/\\sim\b/g, "~");
  s = s.replace(/\\infty\b/g, "∞");
  s = s.replace(/\\propto\b/g, "∝");
  s = s.replace(/\\sum\b/g, "∑");
  s = s.replace(/\\prod\b/g, "∏");
  s = s.replace(/\\int\b/g, "∫");
  s = s.replace(/\\partial\b/g, "∂");
  s = s.replace(/\\in\b/g, "∈");
  s = s.replace(/\\notin\b/g, "∉");

  // Statistical markings & accents
  s = s.replace(/\\bar\{([a-zA-Z])\}/g, "$1̄");
  s = s.replace(/\\hat\{([a-zA-Z])\}/g, "$1̂");
  s = s.replace(/\\vec\{([a-zA-Z])\}/g, "$1⃗");
  s = s.replace(/\\tilde\{([a-zA-Z])\}/g, "$1̃");

  // Fractions: \frac{a}{b} -> (a / b)
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");

  // Square roots: \sqrt{x} -> √(x)
  s = s.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");
  s = s.replace(/\\sqrt\b/g, "√");

  // Superscripts
  const supMap: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
    "n": "ⁿ", "i": "ⁱ"
  };
  s = s.replace(/\^\{([0-9+\-=()ni]+)\}/g, (_, inner) => {
    return inner.split("").map((c: string) => supMap[c] || c).join("");
  });
  s = s.replace(/\^([0-9ni])/g, (_, ch) => supMap[ch] || ch);

  // Subscripts
  const subMap: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
    "a": "ₐ", "e": "ₑ", "o": "ₒ", "x": "ₓ", "i": "ᵢ", "j": "ⱼ"
  };
  s = s.replace(/_\{([0-9+\-=()aeoxij]+)\}/g, (_, inner) => {
    return inner.split("").map((c: string) => subMap[c] || c).join("");
  });
  s = s.replace(/_([0-9aeoxij])/g, (_, ch) => subMap[ch] || ch);

  // Sizing or layout commands
  s = s.replace(/\\(?:left|right|quad|qquad|!|,|;|:)/g, " ");
  s = s.replace(/\\([a-zA-Z]+)/g, "$1");
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/**
 * Renders an inline mathematical expression with academic typography:
 * single variables in italic serif, and numbers/operators in upright font.
 */
function renderMathInline(mathExpr: string, key: string): React.ReactNode {
  const cleaned = formatMathUnicode(mathExpr);

  // Matches variables (single Latin letters or stats abbreviations) vs operators/numbers
  const tokenRegex = /\b([a-zA-Z]|df|CI|SD|SE|OR|RR|HR)\b|([^a-zA-Z]+)/g;
  const nodes: React.ReactNode[] = [];
  let m: RegExpExecArray | null;
  let idx = 0;

  while ((m = tokenRegex.exec(cleaned)) !== null) {
    if (m[1]) {
      nodes.push(
        <span key={`${key}_v_${idx}`} className="font-serif italic font-medium text-foreground">
          {m[1]}
        </span>
      );
    } else if (m[2]) {
      nodes.push(
        <span key={`${key}_o_${idx}`} className="font-sans font-normal text-foreground">
          {m[2]}
        </span>
      );
    }
    idx++;
  }

  if (nodes.length === 0) {
    return (
      <span key={key} className="font-serif italic text-foreground">
        {cleaned}
      </span>
    );
  }

  return (
    <span
      key={key}
      className="inline-math inline-flex items-baseline gap-0.5 mx-0.5 font-normal tracking-wide"
    >
      {nodes}
    </span>
  );
}

/**
 * Safely splits a markdown row on '|' without splitting on escaped pipes (\|).
 */
function splitRow(line: string): string[] {
  let content = line.trim();
  if (content.startsWith("|")) content = content.slice(1);
  if (content.endsWith("|") && !content.endsWith("\\|")) content = content.slice(0, -1);

  const cells: string[] = [];
  let current = "";
  let escaped = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === "\\" && !escaped) {
      escaped = true;
      continue;
    }
    if (ch === "|" && !escaped) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    if (escaped) {
      if (ch !== "|") {
        current += "\\";
      }
      current += ch;
      escaped = false;
    } else {
      current += ch;
    }
  }
  if (escaped) current += "\\";
  cells.push(current.trim());
  return cells;
}

/**
 * Checks whether a line is a markdown table delimiter row (e.g. |---|---| or :--- | :---:).
 */
function isDelimiterRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (!trimmed.includes("-") && !trimmed.includes("=")) return false;

  const inner = trimmed.replace(/^\|/, "").replace(/\|$/, "").trim();
  if (!inner) return false;

  const parts = splitRow(inner);
  if (parts.length === 0) return false;

  return parts.every(
    (p) => /^[\s:\-=\+]+$/.test(p) && (p.includes("-") || p.includes("="))
  );
}

/**
 * Extracts column alignments from delimiter row cells.
 */
function parseAlignments(delimiterCells: string[]): Alignment[] {
  return delimiterCells.map((cell) => {
    const trimmed = cell.trim();
    const left = trimmed.startsWith(":");
    const right = trimmed.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    return "left";
  });
}

/**
 * Parses inline formatting:
 * **bold**, *italic*, `code`, [links], and LaTeX math expressions ($n = 36$, $$...$$, \(...\)).
 * Safe and sanitization-resistant (no dangerouslySetInnerHTML).
 */
function parseInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match:
  // 1. `code`
  // 2. ***bold italic***
  // 3. **bold** or __bold__
  // 4. *italic* or _italic_
  // 5. [link text](url)
  // 6. $$display math$$
  // 7. \[display math\]
  // 8. \(inline math\)
  // 9. $inline math$ (guarding against standalone currency like $10 or $20)
  const regex =
    /(`[^`]+`|\*\*\*.*?\*\*\*|\*\*.*?\*\*|__.*?__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\)|\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s|\d+(?:\.\d+)?(?:\s|,|\)|$))([^$\n]+?)(?<!\s)\$)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    const key = `inline_${match.index}_${token.length}`;

    // Inline code
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
    }
    // Display math inside text
    else if (
      (token.startsWith("$$") && token.endsWith("$$")) ||
      (token.startsWith("\\[") && token.endsWith("\\]"))
    ) {
      const inner = token.startsWith("$$") ? token.slice(2, -2) : token.slice(2, -2);
      parts.push(
        <span
          key={key}
          className="my-1.5 block py-1.5 px-3 rounded-lg border border-border/70 bg-muted/20 text-center font-serif text-sm text-foreground overflow-x-auto shadow-2xs"
        >
          {renderMathInline(inner, key)}
        </span>
      );
    }
    // Inline math: $...$ or \(...\)
    else if (
      (token.startsWith("$") && token.endsWith("$") && token.length > 2) ||
      (token.startsWith("\\(") && token.endsWith("\\)"))
    ) {
      const inner = token.startsWith("$") ? token.slice(1, -1) : token.slice(2, -2);
      if (isLikelyMath(inner)) {
        parts.push(renderMathInline(inner, key));
      } else {
        // Leave currency or non-math as plain text
        parts.push(token);
      }
    }
    // Bold Italic
    else if (token.startsWith("***") && token.endsWith("***")) {
      parts.push(
        <strong key={key} className="font-bold text-foreground">
          <em className="italic">{token.slice(3, -3)}</em>
        </strong>
      );
    }
    // Bold
    else if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      parts.push(
        <strong key={key} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italic
    else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      parts.push(
        <em key={key} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
      );
    }
    // Links
    else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
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

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

/**
 * Splits markdown document into high-level structured blocks:
 * Tables (GFM, borderless, or <ai_artifact>), Headings, Lists, Blockquotes, Code, Math, Paragraphs.
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

    // 1. Structured AI Artifact (<ai_artifact type="table" title="...">[...]</ai_artifact>)
    if (line.trim().startsWith("<ai_artifact") || line.trim().startsWith("&lt;ai_artifact")) {
      const artifactLines: string[] = [];
      while (i < lines.length) {
        artifactLines.push(lines[i]);
        if (lines[i].includes("</ai_artifact>") || lines[i].includes("&lt;/ai_artifact&gt;")) {
          i++;
          break;
        }
        i++;
      }
      const artifactText = artifactLines.join("\n");
      const match =
        artifactText.match(
          /<ai_artifact\s+type="([^"]+)"(?:\s+title="([^"]*)")?>([\s\S]*?)<\/ai_artifact>/i
        ) ||
        artifactText.match(
          /&lt;ai_artifact\s+type="([^"]+)"(?:\s+title="([^"]*)")?&gt;([\s\S]*?)&lt;\/ai_artifact&gt;/i
        );

      if (match) {
        const artType = match[1];
        const artTitle = match[2] || "Data Table";
        const rawData = match[3].trim();

        if (artType === "table") {
          try {
            const parsed = JSON.parse(rawData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const headers = Object.keys(parsed[0]);
              const alignments: Alignment[] = headers.map(() => "left");
              const rows: string[][] = parsed.map((item) =>
                headers.map((h) =>
                  item[h] !== null && item[h] !== undefined ? String(item[h]) : ""
                )
              );
              blocks.push({
                type: "table",
                title: artTitle,
                headers,
                alignments,
                rows,
              });
              continue;
            }
          } catch {
            // If JSON is invalid, fall back to code block
            blocks.push({ type: "code", code: rawData, lang: "json" });
            continue;
          }
        }
      }
    }

    // 2. Fenced Code Block
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

    // 3. Display Math Block ($$...$$ or \[...\])
    if (line.trim().startsWith("$$") || line.trim().startsWith("\\[")) {
      const isBracket = line.trim().startsWith("\\[");
      const endMarker = isBracket ? "\\]" : "$$";
      const mathLines: string[] = [];

      // If single-line display math
      const restOfLine = line.trim().slice(2).trim();
      if (restOfLine.endsWith(endMarker) && restOfLine.length > 2) {
        mathLines.push(restOfLine.slice(0, -2).trim());
        i++;
      } else {
        if (restOfLine) mathLines.push(restOfLine);
        i++;
        while (i < lines.length && !lines[i].includes(endMarker)) {
          mathLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          const closingLine = lines[i].replace(endMarker, "").trim();
          if (closingLine) mathLines.push(closingLine);
          i++;
        }
      }

      blocks.push({
        type: "math",
        math: mathLines.join(" "),
      });
      continue;
    }

    // 4. Horizontal Rule
    if (/^(---|___|\*\*\*)\s*$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // 5. Markdown Table (with or without edge pipes)
    // Recognized when current line has '|' and next line is a valid delimiter row
    if (line.includes("|") && i + 1 < lines.length && isDelimiterRow(lines[i + 1])) {
      const headerLine = lines[i];
      const delimiterLine = lines[i + 1];
      const headers = splitRow(headerLine);
      const delimiterCells = splitRow(delimiterLine);
      const alignments = parseAlignments(delimiterCells);

      i += 2; // skip header and delimiter

      const rows: string[][] = [];
      while (i < lines.length) {
        const curLine = lines[i].trim();
        if (!curLine) break; // blank line terminates table
        if (
          curLine.startsWith("#") ||
          curLine.startsWith("```") ||
          curLine.startsWith(">") ||
          /^(---|___|\*\*\*)\s*$/.test(curLine)
        ) {
          break;
        }
        if (!curLine.includes("|")) break;

        const rowCells = splitRow(curLine);
        // Pad row with empty cells if fewer than headers
        while (rowCells.length < headers.length) {
          rowCells.push("");
        }
        rows.push(rowCells);
        i++;
      }

      blocks.push({
        type: "table",
        headers,
        alignments,
        rows,
      });
      continue;
    }

    // 6. Headings (#, ##, ###, ####)
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

    // 7. Blockquote (> text)
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

    // 8. Numbered List (1. or 1))
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

    // 9. Bullet List (- or * or +)
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

    // 10. Regular Paragraph
    // Stops before a table, heading, code block, or list even if a blank line is omitted
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !(lines[i].includes("|") && i + 1 < lines.length && isDelimiterRow(lines[i + 1])) &&
      !lines[i].trim().startsWith("<ai_artifact") &&
      !lines[i].trim().startsWith("&lt;ai_artifact") &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("$$") &&
      !lines[i].trim().startsWith("\\[") &&
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

/**
 * Interactive table card component with CSV download and Excel-compatible copy.
 */
function ReportTableCard({
  block,
  compact = false,
}: {
  block: TableBlock;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  // Copy as TSV (Tab-Separated Values) for easy pasting into Excel / Google Sheets / SPSS
  function copyTableTsv() {
    const headerRow = block.headers.join("\t");
    const dataRows = block.rows.map((row) => row.join("\t"));
    const tsv = [headerRow, ...dataRows].join("\n");
    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Download table as standard RFC 4180 CSV
  function downloadCsv() {
    const escapeCsv = (val: string) => {
      const s = String(val ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent = [
      block.headers.map(escapeCsv).join(","),
      ...block.rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseTitle = (block.title || "research_table").toLowerCase().replace(/\s+/g, "_");
    a.download = `${baseTitle}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="my-4 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {/* Table Card Header Toolbar */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            {block.title || "Data Table"}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {block.rows.length} {block.rows.length === 1 ? "row" : "rows"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copyTableTsv}
            title="Copy table to clipboard (Excel / Sheets compatible)"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            title="Download as CSV"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-full text-left text-sm border-collapse">
          <thead className="bg-muted/70 text-foreground border-b border-border">
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
                    className={`px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap border-r border-border/40 last:border-r-0 ${alignClass}`}
                  >
                    {parseInline(h)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-card">
            {block.rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`transition-colors hover:bg-muted/30 ${
                  rowIdx % 2 === 1 ? "bg-muted/15" : "bg-card"
                }`}
              >
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
                      className={`px-3.5 py-2 text-xs sm:text-sm text-foreground/90 border-r border-border/30 last:border-r-0 font-sans ${alignClass}`}
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
            return <ReportTableCard key={idx} block={block} compact={compact} />;
          }

          case "math": {
            return (
              <div
                key={idx}
                className="my-3 py-3 px-4 rounded-xl border border-border/80 bg-muted/20 text-center font-serif text-sm sm:text-base text-foreground overflow-x-auto shadow-2xs"
              >
                {renderMathInline(block.math, `block_math_${idx}`)}
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
