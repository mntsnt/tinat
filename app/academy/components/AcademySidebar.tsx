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
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1.5"
          >
            <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
            Tinat Academy
          </Link>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            MODULE {module.number}
          </span>
          <h2 className="text-sm font-bold text-foreground leading-snug m-0 mt-0.5">
            {module.title}
          </h2>

          {/* Progress bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
              <span>{completedCount} of {totalLessons} completed</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lesson List */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2 px-1">
            CURRICULUM LESSONS
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
                  "group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-bold border-l-2 border-emerald-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2 px-1">
            ASSESSMENT & PRACTICE
          </span>

          {/* Module Quiz */}
          <Link
            href={`/academy/${module.slug}/quiz`}
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors border border-border"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-emerald-600" />
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
              <ClipboardCheck className="h-4 w-4 text-sky-600" />
              <span>Practical Assignment</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div className="pt-4 border-t border-border text-[11px] text-muted-foreground">
        <Link href={`/academy/${module.slug}`} className="hover:underline block font-medium">
          &larr; Module Overview &amp; Syllabus
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Toggle */}
      <div className="lg:hidden fixed bottom-5 left-5 z-40">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xl hover:bg-emerald-800 focus:outline-none"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-card shadow-2xl transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-border bg-card/60 backdrop-blur-xs h-[calc(100vh-3.5rem)] sticky top-14">
        {sidebarContent}
      </aside>
    </>
  );
}
