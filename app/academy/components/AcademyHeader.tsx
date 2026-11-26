"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Maximize2,
  Minimize2,
  Type,
  FileText,
  Share2,
  Check,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { cn } from "@/lib/utils";

interface AcademyHeaderProps {
  moduleNumber: number;
  moduleSlug: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonSlug: string;
  onTextSizeChange: (size: "sm" | "base" | "lg") => void;
  onFocusModeToggle: () => void;
  isFocusMode: boolean;
  onNotesToggle: () => void;
  isNotesOpen: boolean;
}

export function AcademyHeader({
  moduleNumber,
  moduleSlug,
  moduleTitle,
  lessonTitle,
  lessonSlug,
  onTextSizeChange,
  onFocusModeToggle,
  isFocusMode,
  onNotesToggle,
  isNotesOpen,
}: AcademyHeaderProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTextSize, setCurrentTextSize] = useState<"sm" | "base" | "lg">("base");

  // Load bookmark status from localStorage
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem("tinat_academy_bookmarks") || "[]");
    setIsBookmarked(bookmarks.includes(lessonSlug));
  }, [lessonSlug]);

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem("tinat_academy_bookmarks") || "[]");
    let next: string[];
    if (bookmarks.includes(lessonSlug)) {
      next = bookmarks.filter((s: string) => s !== lessonSlug);
      setIsBookmarked(false);
    } else {
      next = [...bookmarks, lessonSlug];
      setIsBookmarked(true);
    }
    localStorage.setItem("tinat_academy_bookmarks", JSON.stringify(next));
  };

  const cycleTextSize = () => {
    const nextSize = currentTextSize === "sm" ? "base" : currentTextSize === "base" ? "lg" : "sm";
    setCurrentTextSize(nextSize);
    onTextSizeChange(nextSize);
  };

  const shareLesson = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: lessonTitle,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  return (
    <header className="sticky top-14 z-30 flex h-13 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 overflow-hidden text-xs text-muted-foreground">
        <Link
          href={`/academy/${moduleSlug}`}
          className="flex items-center gap-1 font-semibold text-foreground hover:text-emerald-700 dark:hover:text-emerald-400 shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Module {moduleNumber}</span>
        </Link>
        <span className="opacity-40">/</span>
        <span className="truncate font-medium text-foreground">{lessonTitle}</span>
      </div>

      {/* Reader Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Text Resizer */}
        <button
          type="button"
          onClick={cycleTextSize}
          title="Adjust Text Size"
          className="flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <Type className="h-3 w-3" />
          <span className="text-[10px] uppercase font-bold">{currentTextSize}</span>
        </button>

        {/* Notes Toggle */}
        <button
          type="button"
          onClick={onNotesToggle}
          title="Personal Notes"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted transition-colors",
            isNotesOpen && "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
        </button>

        {/* Bookmark */}
        <button
          type="button"
          onClick={toggleBookmark}
          title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted transition-colors",
            isBookmarked && "bg-amber-500/10 text-amber-600 border-amber-500/30"
          )}
        >
          <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-amber-500")} />
        </button>

        {/* Focus Mode */}
        <button
          type="button"
          onClick={onFocusModeToggle}
          title={isFocusMode ? "Exit Focus Mode" : "Focus Mode (Hide Sidebars)"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
        >
          {isFocusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={shareLesson}
          title="Share Lesson"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </header>
  );
}
