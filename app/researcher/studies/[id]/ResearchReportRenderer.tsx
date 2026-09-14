"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ResearchReportRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
}

/**
 * Normalizes raw model output to ensure standard CommonMark/GFM compliance.
 * Guarantees that tables and headings preceded by text have required empty lines.
 */
function normalizeMarkdown(text: string): string {
  if (!text) return "";

  let normalized = text.replace(/\r\n/g, "\n");

  // Ensure markdown tables have a blank line before them if preceded by text
  normalized = normalized.replace(/([^\n])\n(\|[^\n]+\|\n\|[\s:-|-]+\|)/g, "$1\n\n$2");

  // Ensure markdown tables have a blank line after them if followed by text
  normalized = normalized.replace(/(\|[^\n]+\|)\n([^\n|\s])/g, "$1\n\n$2");

  // Ensure headings have a blank line before them if preceded by text
  normalized = normalized.replace(/([^\n])\n(#{1,6}\s+[^\n]+)/g, "$1\n\n$2");

  return normalized;
}

export function ResearchReportRenderer({
  content,
  className = "",
  compact = false,
}: ResearchReportRendererProps) {
  const preparedContent = useMemo(() => normalizeMarkdown(content), [content]);

  return (
    <div className={`research-report-content w-full ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold tracking-tight text-foreground border-b border-border/80 pb-2.5 mb-4 mt-6 first:mt-0 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block shrink-0" />
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold tracking-tight text-foreground border-b border-border/40 pb-1.5 mb-3 mt-5 first:mt-0 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary/80 inline-block shrink-0" />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/90 mb-2 mt-4 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-foreground/80 mb-1.5 mt-3 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p
              className={`leading-relaxed text-foreground/90 ${
                compact ? "text-xs my-1.5" : "text-sm my-2.5"
              } last:mb-0`}
            >
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/90">{children}</em>
          ),
          ul: ({ children }) => (
            <ul
              className={`list-disc pl-5 my-2.5 space-y-1 text-foreground/90 marker:text-primary ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={`list-decimal pl-5 my-2.5 space-y-1.5 text-foreground/90 marker:text-primary marker:font-semibold ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-primary bg-primary/5 pl-4 pr-3 py-2.5 rounded-r-xl text-sm text-foreground/90 italic shadow-xs">
              {children}
            </blockquote>
          ),
          // Responsive, clean Medical Research Tables
          table: ({ children }) => (
            <div className="my-4 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-sm border-collapse">
                  {children}
                </table>
              </div>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/80 text-foreground border-b border-border">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/60 bg-card">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap bg-muted/60">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-xs sm:text-sm text-foreground/90 whitespace-nowrap font-sans">
              {children}
            </td>
          ),
          hr: () => <hr className="my-5 border-border/60" />,
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground border border-border/80"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-3 overflow-x-auto rounded-xl border border-border bg-muted/40 p-3.5 font-mono text-xs text-foreground shadow-xs">
                <code>{children}</code>
              </pre>
            );
          },
        }}
      >
        {preparedContent}
      </ReactMarkdown>
    </div>
  );
}
