"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  FolderPlus,
  BookOpen,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface CompletionCardProps {
  moduleSlug: string;
  moduleTitle: string;
  moduleNumber: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  onRetake?: () => void;
  onReviewMistakes?: () => void;
  hasMistakes?: boolean;
}

export function CompletionCard({
  moduleSlug,
  moduleTitle,
  moduleNumber,
  score,
  correctCount,
  totalQuestions,
  onRetake,
  onReviewMistakes,
  hasMistakes,
}: CompletionCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-card to-teal-950/20 p-6 sm:p-8 shadow-xl text-center space-y-6">
      {/* Trophy Badge */}
      <div className="flex justify-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-900/30 ring-8 ring-emerald-500/10 animate-bounce duration-1000">
          <Trophy className="h-10 w-10 text-amber-300" />
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-emerald-950 text-xs font-black shadow-sm">
            ✓
          </span>
        </div>
      </div>

      {/* Main Congratulatory Message */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          Module {moduleNumber} Mastered
        </span>
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Congratulations on Completing the Assessment!
        </h3>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground leading-relaxed">
          You scored <strong className="text-emerald-700 dark:text-emerald-400 text-base">{score}%</strong> ({correctCount} of {totalQuestions} questions correct) on <span className="font-semibold text-foreground">{moduleTitle}</span>.
        </p>
      </div>

      {/* Highlights Pill Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-border/60 py-4 text-xs">
        <div className="p-2">
          <p className="font-bold text-foreground">Evidence-Based</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">Rigorous peer-reviewed methodology</p>
        </div>
        <div className="p-2 border-y sm:border-y-0 sm:border-x border-border/60">
          <p className="font-bold text-foreground">Ethiopian & African Context</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">Applied to real epidemiological challenges</p>
        </div>
        <div className="p-2">
          <p className="font-bold text-foreground">Practical Mastery</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">Ready for protocol development</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href={`/academy/completed/${moduleSlug}`}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md transition-colors"
        >
          View Full Congratulations Page <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href={`/academy/${moduleSlug}/assignment`}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-600/30 bg-sky-500/10 text-sky-800 dark:text-sky-300 hover:bg-sky-500/20 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors"
        >
          Practical Assignment
        </Link>

        {hasMistakes && onReviewMistakes && (
          <Button size="sm" variant="outline" onClick={onReviewMistakes} className="text-xs">
            Review Mistakes
          </Button>
        )}

        {onRetake && (
          <Button size="sm" variant="ghost" onClick={onRetake} className="gap-1.5 text-xs text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" /> Retake Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
