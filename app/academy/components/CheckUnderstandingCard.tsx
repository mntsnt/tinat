"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { CheckYourUnderstandingQuestion } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

export function CheckUnderstandingCard({
  question,
}: {
  question: CheckYourUnderstandingQuestion;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    setShowExplanation(true);
  };

  const isCorrect = selectedIdx === question.correctIndex;

  return (
    <div className="my-6 rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
          Knowledge check
        </span>
      </div>

      <p className="mb-4 text-sm font-semibold leading-relaxed text-foreground">
        {question.question}
      </p>

      <div className="space-y-2">
        {question.options.map((option, idx) => {
          const isThisSelected = selectedIdx === idx;
          const isThisCorrect = idx === question.correctIndex;

          let btnClass = "border-border hover:border-emerald-600/40 hover:bg-muted/40 text-foreground";
          if (showExplanation) {
            if (isThisCorrect) {
              btnClass = "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-medium";
            } else if (isThisSelected) {
              btnClass = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100";
            } else {
              btnClass = "border-border opacity-60";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              className={cn(
                "flex w-full cursor-pointer items-start gap-2.5 rounded-md border p-3 text-left text-sm transition-colors",
                btnClass
              )}
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
              {showExplanation && isThisCorrect && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              {showExplanation && isThisSelected && !isThisCorrect && (
                <XCircle className="h-4 w-4 shrink-0 text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div
          className={cn(
            "mt-4 rounded-lg p-3.5 text-xs leading-relaxed transition-all",
            isCorrect
              ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 border border-emerald-500/20"
              : "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 border border-amber-500/20"
          )}
        >
          <div className="font-bold mb-1">
            {isCorrect ? "✅ Correct!" : "💡 Not quite."}
          </div>
          <div>{question.explanation}</div>
        </div>
      )}
    </div>
  );
}
