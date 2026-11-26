"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, ChevronRight, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { AcademyModule, Lesson } from "@/lib/academy/types";
import { AcademyHeader } from "./AcademyHeader";
import { AcademySidebar } from "./AcademySidebar";
import { TableOfContents } from "./TableOfContents";
import { CalloutBox } from "./CalloutBox";
import { CheckUnderstandingCard } from "./CheckUnderstandingCard";
import { ToolEmbedCard } from "./ToolEmbedCard";
import { LessonCompleteButton } from "./LessonCompleteButton";
import { LessonNotes } from "./LessonNotes";
import { cn } from "@/lib/utils";

interface LessonReaderContainerProps {
  module: AcademyModule;
  lesson: Lesson;
  prevLesson?: Lesson;
  nextLesson?: Lesson;
  nextModule?: AcademyModule;
}

export function LessonReaderContainer({
  module,
  lesson,
  prevLesson,
  nextLesson,
  nextModule,
}: LessonReaderContainerProps) {
  const router = useRouter();
  const [textSize, setTextSize] = useState<"sm" | "base" | "lg">("base");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Keyboard navigation shortcuts (Alt + Left / Alt + Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowLeft" && prevLesson) {
        router.push(`/academy/${module.slug}/${prevLesson.slug}`);
      }
      if (e.altKey && e.key === "ArrowRight") {
        if (nextLesson) {
          router.push(`/academy/${module.slug}/${nextLesson.slug}`);
        } else if (nextModule) {
          router.push(`/academy/${nextModule.slug}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevLesson, nextLesson, nextModule, module.slug, router]);

  const textSizeClass =
    textSize === "sm"
      ? "text-xs leading-relaxed"
      : textSize === "lg"
      ? "text-base sm:text-lg leading-relaxed"
      : "text-sm sm:text-base leading-relaxed";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Reading Header */}
      <AcademyHeader
        moduleNumber={module.number}
        moduleSlug={module.slug}
        moduleTitle={module.title}
        lessonTitle={lesson.title}
        lessonSlug={lesson.slug}
        onTextSizeChange={setTextSize}
        onFocusModeToggle={() => setIsFocusMode(!isFocusMode)}
        isFocusMode={isFocusMode}
        onNotesToggle={() => setIsNotesOpen(!isNotesOpen)}
        isNotesOpen={isNotesOpen}
      />

      <div className="flex-1 flex w-full">
        {/* Left Sidebar (Hidden in Focus Mode) */}
        {!isFocusMode && (
          <AcademySidebar module={module} activeLessonSlug={lesson.slug} />
        )}

        {/* Central Reading Column */}
        <main
          className={cn(
            "flex-1 px-4 py-8 sm:px-8 md:px-12 flex justify-center transition-all",
            isFocusMode ? "max-w-4xl mx-auto" : "max-w-5xl"
          )}
        >
          <article className="w-full max-w-[70ch] space-y-6">
            {/* Lesson Title & Header */}
            <div className="border-b border-border pb-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                <span>MODULE {module.number}</span>
                <span>•</span>
                <span>LESSON {lesson.orderIndex}</span>
                <span>•</span>
                <span className="text-muted-foreground">{lesson.readingTimeMinutes} MIN READ</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight m-0">
                {lesson.title}
              </h1>

              {/* Learning Objectives Card */}
              {lesson.learningObjectives?.length > 0 && (
                <div className="rounded-xl border border-emerald-600/20 bg-emerald-500/5 p-4 mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> What You Will Master in This Lesson:
                  </h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {lesson.learningObjectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sections */}
            <div className={cn("space-y-8", textSizeClass)}>
              {lesson.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-32 space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground border-b border-border/40 pb-2">
                    {section.title}
                  </h2>
                  <div className="whitespace-pre-line text-foreground/90 font-normal">
                    {section.content}
                  </div>
                  {section.callout && <CalloutBox callout={section.callout} />}
                </section>
              ))}
            </div>

            {/* Interactive Tool Embed (if any) */}
            {lesson.toolIntegration && (
              <ToolEmbedCard config={lesson.toolIntegration} />
            )}

            {/* In-Lesson Knowledge Checks */}
            {lesson.checkUnderstanding?.length > 0 && (
              <div className="my-10 pt-6 border-t border-border">
                <h3 className="text-base font-bold text-foreground mb-4">
                  Check Your Understanding
                </h3>
                {lesson.checkUnderstanding.map((q) => (
                  <CheckUnderstandingCard key={q.id} question={q} />
                ))}
              </div>
            )}

            {/* Key Takeaways Card */}
            {lesson.keyTakeaways?.length > 0 && (
              <div className="my-8 rounded-xl border border-border bg-card p-5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Key Takeaways
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-foreground">
                  {lesson.keyTakeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* References Section */}
            {lesson.references?.length > 0 && (
              <div className="my-8 pt-6 border-t border-border text-xs text-muted-foreground space-y-2">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  Academic References (Vancouver Style)
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5">
                  {lesson.references.map((ref) => (
                    <li key={ref.id} className="leading-relaxed">
                      {ref.citationText}
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-1 text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          [Link]
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Mark Complete & Auto Advance */}
            <LessonCompleteButton
              moduleSlug={module.slug}
              lessonSlug={lesson.slug}
              nextLessonSlug={nextLesson?.slug}
              nextModuleSlug={nextModule?.slug}
            />

            {/* Previous / Next Lesson Footer Nav */}
            <div className="flex items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
              {prevLesson ? (
                <button
                  type="button"
                  onClick={() => router.push(`/academy/${module.slug}/${prevLesson.slug}`)}
                  className="flex items-center gap-1.5 hover:text-foreground font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[150px] sm:max-w-xs">{prevLesson.title}</span>
                </button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <button
                  type="button"
                  onClick={() => router.push(`/academy/${module.slug}/${nextLesson.slug}`)}
                  className="flex items-center gap-1.5 hover:text-foreground font-semibold text-right"
                >
                  <span className="truncate max-w-[150px] sm:max-w-xs">{nextLesson.title}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push(`/academy/${module.slug}/quiz`)}
                  className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                >
                  <span>Proceed to Module Quiz</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </article>
        </main>

        {/* Right Table of Contents (Hidden in Focus Mode) */}
        {!isFocusMode && (
          <TableOfContents
            sections={lesson.sections}
            readingTimeMinutes={lesson.readingTimeMinutes}
          />
        )}
      </div>

      {/* Slide-out Personal Notes */}
      <LessonNotes
        lessonSlug={lesson.slug}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />
    </div>
  );
}
