"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
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
    const nextCompleted = !completed.includes(lessonSlug);
    const nextList = nextCompleted
      ? [...completed, lessonSlug]
      : completed.filter((s: string) => s !== lessonSlug);
    setIsCompleted(nextCompleted);

    localStorage.setItem(`tinat_academy_completed_${moduleSlug}`, JSON.stringify(nextList));

    try {
      const response = await fetch("/api/academy/progress/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleSlug, lessonSlug, completed: nextCompleted }),
      });
      if (!response.ok) {
        throw new Error(`Progress sync failed with status ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to sync Academy progress:", error);
    }
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
    <div className="my-10 flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card p-5">
      <div>
        <h2 className="m-0 text-base font-semibold text-foreground">Lesson progress</h2>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Mark this lesson complete to save your progress.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant={isCompleted ? "outline" : "primary"}
          onClick={handleMarkComplete}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isCompleted ? "Completed" : "Mark complete"}
        </Button>

        {(nextLessonSlug || nextModuleSlug) && (
          <Button
            size="sm"
            onClick={handleAdvance}
            className="gap-2"
          >
            {nextLessonSlug ? "Next Lesson" : "Next Module"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
