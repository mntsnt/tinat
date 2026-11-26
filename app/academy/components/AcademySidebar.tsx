"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  HelpCircle,
  ClipboardCheck,
  ChevronRight,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import { AcademyModule } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

interface AcademySidebarProps {
  module: AcademyModule;
  activeLessonSlug?: string;
}

export function AcademySidebar({ module, activeLessonSlug }: AcademySidebarProps) {
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  useEffect(() => {
    // Check completed lessons in localStorage
    const saved = JSON.parse(
      localStorage.getItem(`tinat_academy_completed_${module.slug}`) || "[]"
    );
    setCompletedSlugs(saved);

    // Check quiz status
    const quizState = localStorage.getItem(`tinat_academy_quiz_${module.slug}`);
    if (quizState) {
      try {
        const parsed = JSON.parse(quizState);
        setQuizPassed(parsed.passed || false);
      } catch {}
    }
  }, [module.slug]);

  const totalLessons = module.lessons.length;
  const completedCount = completedSlugs.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto p-4 sm:p-5">
      <div className="space-y-5">
        {/* Module Header */}
        <div className="border-b border-border pb-4">
          <Link
            href="/academy"
            className="mb-1.5 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <GraduationCap className="h-4 w-4" />
            Tinat Academy
          </Link>
          <span className="text-xs font-medium text-muted-foreground">
            Module {module.number}
          </span>
          <h2 className="m-0 mt-1 text-sm font-semibold leading-snug text-foreground">
            {module.title}
          </h2>

          {/* Progress bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedCount} of {totalLessons} completed</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lesson List */}
        <div className="space-y-1">
          <span className="mb-2 block px-1 text-xs font-medium text-muted-foreground">
            Lessons
          </span>
          {module.lessons.map((lesson) => {
            const isActive = lesson.slug === activeLessonSlug;
            const isCompleted = completedSlugs.includes(lesson.slug);

            return (
              <Link
                key={lesson.slug}
                href={`/academy/${module.slug}/${lesson.slug}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-start gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  isActive
                    ? "border-l-2 border-foreground bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-foreground" />
                  ) : (
                    <Circle className="h-4 w-4 opacity-40 group-hover:opacity-70" />
                  )}
                </span>
                <span className="flex-1 leading-relaxed">{lesson.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Evaluation & Practice */}
        <div className="space-y-1 pt-3 border-t border-border">
          <span className="mb-2 block px-1 text-xs font-medium text-muted-foreground">
            Assessment and practice
          </span>

          {/* Module Quiz */}
          <Link
            href={`/academy/${module.slug}/quiz`}
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors border border-border"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span>Module Assessment</span>
            </div>
            {quizPassed ? (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                PASSED
              </span>
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Link>

          {/* Practical Assignment */}
          <Link
            href={`/academy/${module.slug}/assignment`}
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors border border-border"
          >
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              <span>Practical Assignment</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div className="border-t border-border pt-4 text-sm text-muted-foreground">
        <Link href={`/academy/${module.slug}`} className="hover:underline block font-medium">
          &larr; Module Overview &amp; Syllabus
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Toggle */}
      <div className="fixed bottom-5 left-5 z-40 @4xl:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close lesson navigation" : "Open lesson navigation"}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm hover:bg-muted focus:outline-none"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 @4xl:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-background transition-transform duration-300 @4xl:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="sticky top-0 hidden h-[calc(100dvh-7rem)] w-72 shrink-0 border-r border-border bg-background @4xl:block">
        {sidebarContent}
      </aside>
    </>
  );
}
