"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface LessonCompleteButtonProps {
  moduleSlug: string;
  lessonSlug: string;
  nextLessonSlug?: string;
  nextModuleSlug?: string;
}

export function LessonCompleteButton({
  moduleSlug,
  lessonSlug,
  nextLessonSlug,
  nextModuleSlug,
}: LessonCompleteButtonProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    const completed = JSON.parse(
      localStorage.getItem(`tinat_academy_completed_${moduleSlug}`) || "[]"
    );
    setIsCompleted(completed.includes(lessonSlug));
  }, [moduleSlug, lessonSlug]);

  const handleMarkComplete = async () => {
    const completed = JSON.parse(
      localStorage.getItem(`tinat_academy_completed_${moduleSlug}`) || "[]"
    );
    let nextList: string[];
    if (completed.includes(lessonSlug)) {
      nextList = completed.filter((s: string) => s !== lessonSlug);
      setIsCompleted(false);
    } else {
      nextList = [...completed, lessonSlug];
      setIsCompleted(true);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 3000);
    }

    localStorage.setItem(`tinat_academy_completed_${moduleSlug}`, JSON.stringify(nextList));

    // Also notify server in background if signed in
    try {
      fetch("/api/academy/progress/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleSlug, lessonSlug }),
      });
    } catch {}
  };

  const handleAdvance = () => {
    if (nextLessonSlug) {
      router.push(`/academy/${moduleSlug}/${nextLessonSlug}`);
    } else if (nextModuleSlug) {
      router.push(`/academy/${nextModuleSlug}`);
    } else {
      router.push(`/academy/${moduleSlug}/quiz`);
    }
  };

  return (
    <div className="my-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div>
        <h4 className="text-sm font-bold text-foreground m-0">Finished studying this lesson?</h4>
        <p className="text-xs text-muted-foreground mt-0.5 m-0">
          Mark it complete to record your progress and unlock the module assessment.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant={isCompleted ? "outline" : "primary"}
          onClick={handleMarkComplete}
          className="gap-2 transition-transform active:scale-95"
        >
          <CheckCircle2 className={isCompleted ? "text-emerald-600 h-4 w-4" : "h-4 w-4"} />
          {isCompleted ? "Completed" : "Mark as Complete"}
          {justCompleted && <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" />}
        </Button>

        {(nextLessonSlug || nextModuleSlug) && (
          <Button
            size="sm"
            onClick={handleAdvance}
            className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            {nextLessonSlug ? "Next Lesson" : "Next Module"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
