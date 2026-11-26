"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
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
    <div className="space-y-4 rounded-md border border-border bg-muted/20 p-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Module {moduleNumber} · Assessment passed
        </p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{moduleTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Score: <strong className="font-semibold text-foreground">{score}%</strong>
          {" "}({correctCount} of {totalQuestions} correct)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Link
          href={`/academy/completed/${moduleSlug}`}
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Completion summary <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href={`/academy/${moduleSlug}/assignment`}
          className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Practical assignment
        </Link>

        {hasMistakes && onReviewMistakes && (
          <Button size="sm" variant="outline" onClick={onReviewMistakes}>
            Review mistakes
          </Button>
        )}

        {onRetake && (
          <Button size="sm" variant="ghost" onClick={onRetake} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Retake quiz
          </Button>
        )}
      </div>
    </div>
  );
}
