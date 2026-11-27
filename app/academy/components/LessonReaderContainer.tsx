"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";
import { AcademyModule, Lesson } from "@/lib/academy/types";
import { AcademyHeader } from "./AcademyHeader";
import { AcademySidebar } from "./AcademySidebar";
import { TableOfContents } from "./TableOfContents";
import { AcademyMarkdown } from "./AcademyMarkdown";
import { CalloutBox } from "./CalloutBox";
import { CheckUnderstandingCard } from "./CheckUnderstandingCard";
import { ToolEmbedCard } from "./ToolEmbedCard";
import { LessonCompleteButton } from "./LessonCompleteButton";
import { LessonNotes } from "./LessonNotes";
import { AcademyAIAssistant } from "./AcademyAIAssistant";

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
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

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

  return (
    <div className="@container flex min-h-[calc(100dvh-3.5rem)] flex-col bg-background text-foreground">
      <AcademyHeader
        moduleNumber={module.number}
        moduleSlug={module.slug}
        lessonTitle={lesson.title}
        onNotesToggle={() => {
          setIsNotesOpen(!isNotesOpen);
          setIsAiOpen(false);
        }}
        isNotesOpen={isNotesOpen}
        onAiToggle={() => {
          setIsAiOpen(!isAiOpen);
          setIsNotesOpen(false);
        }}
        isAiOpen={isAiOpen}
      />

      <div className="flex w-full flex-1">
        <AcademySidebar module={module} activeLessonSlug={lesson.slug} />

        <main
          className="flex min-w-0 flex-1 justify-center px-4 py-8 sm:px-8 lg:px-10"
        >
          <article className="w-full max-w-[70ch] space-y-6">
            <div className="space-y-3 border-b border-border pb-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Lesson {lesson.orderIndex}</span>
                <span aria-hidden="true">·</span>
                <span>{lesson.readingTimeMinutes} min read</span>
              </div>
              <h1 className="m-0 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
                {lesson.title}
              </h1>

              {lesson.learningObjectives?.length > 0 && (
                <div className="mt-4 rounded-md border border-border bg-muted/20 p-4">
                  <h2 className="mb-2 text-sm font-semibold text-foreground">
                    Learning objectives
                  </h2>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {lesson.learningObjectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0" />
                        <span className="leading-6">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sections */}
            <div className="space-y-8 text-base leading-7">
              {lesson.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-32 space-y-4">
                  <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground sm:text-xl">
                    {section.title}
                  </h2>
                  <AcademyMarkdown content={section.content} />
                  {section.callout && <CalloutBox callout={section.callout} />}
                </section>
              ))}
            </div>

            {lesson.toolIntegration && (
              <ToolEmbedCard config={lesson.toolIntegration} />
            )}

            {lesson.checkUnderstanding?.length > 0 && (
              <div className="my-10 pt-6 border-t border-border">
                <h2 className="mb-4 text-base font-semibold text-foreground">
                  Check Your Understanding
                </h2>
                {lesson.checkUnderstanding.map((q) => (
                  <CheckUnderstandingCard key={q.id} question={q} />
                ))}
              </div>
            )}

            {lesson.keyTakeaways?.length > 0 && (
              <div className="my-8 rounded-md border border-border bg-card p-5">
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                  <BookOpen className="h-4 w-4" /> Key takeaways
                </h2>
                <ul className="space-y-2 text-sm text-foreground">
                  {lesson.keyTakeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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

            <LessonCompleteButton
              moduleSlug={module.slug}
              lessonSlug={lesson.slug}
              nextLessonSlug={nextLesson?.slug}
              nextModuleSlug={nextModule?.slug}
            />

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

        <TableOfContents sections={lesson.sections} readingTimeMinutes={lesson.readingTimeMinutes} />
      </div>

      <LessonNotes
        lessonSlug={lesson.slug}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />
      <AcademyAIAssistant
        key={`${module.slug}:${lesson.slug}`}
        moduleSlug={module.slug}
        moduleTitle={module.title}
        lessonSlug={lesson.slug}
        lessonTitle={lesson.title}
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />
    </div>
  );
}
