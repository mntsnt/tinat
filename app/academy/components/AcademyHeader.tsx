"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";

interface AcademyHeaderProps {
  moduleNumber: number;
  moduleSlug: string;
  lessonTitle: string;
  onNotesToggle: () => void;
  isNotesOpen: boolean;
  onAiToggle: () => void;
  isAiOpen: boolean;
}

export function AcademyHeader({
  moduleNumber,
  moduleSlug,
  lessonTitle,
  onNotesToggle,
  isNotesOpen,
  onAiToggle,
  isAiOpen,
}: AcademyHeaderProps) {
  return (
    <header className="flex min-h-14 w-full items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-muted-foreground">
        <Link
          href={`/academy/${moduleSlug}`}
          className="flex shrink-0 items-center gap-1 font-medium text-foreground transition-colors hover:text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Module {moduleNumber}</span>
          <span className="sm:hidden">Module</span>
        </Link>
        <span className="opacity-40">/</span>
        <span className="truncate text-foreground">{lessonTitle}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onAiToggle}
          aria-expanded={isAiOpen}
          aria-label={isAiOpen ? "Close AI study assistant" : "Open AI study assistant"}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-primary/30 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI Assistant</span>
          <span className="sm:hidden">AI</span>
        </button>
        <button
          type="button"
          onClick={onNotesToggle}
          aria-expanded={isNotesOpen}
          aria-label={isNotesOpen ? "Close study notes" : "Open study notes"}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Notes</span>
        </button>
      </div>
    </header>
  );
}
