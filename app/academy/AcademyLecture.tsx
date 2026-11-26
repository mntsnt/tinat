"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Lightbulb, PlayCircle, Target } from "lucide-react";
import type { AcademyModule } from "./academyData";
import { getAcademyLecture } from "./academyContent";

export function AcademyLecture({ academyModule }: { academyModule: AcademyModule }) {
  const [openLesson, setOpenLesson] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const lecture = getAcademyLecture(academyModule.slug);

  return (
    <div className="space-y-5">
      {lecture ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                <PlayCircle className="h-4 w-4" /> Mini lecture
              </div>
              <p className="mt-2 text-sm leading-6 text-foreground">{lecture.introduction}</p>
            </div>
            <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-bold"><Target className="h-4 w-4 text-primary" /> Key ideas</p>
                <ul className="space-y-2">
                  {lecture.keyPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="flex items-center gap-2 text-sm font-bold"><Lightbulb className="h-4 w-4 text-amber-500" /> Worked example</p>
                <p className="mt-2 text-xs font-semibold text-primary">{lecture.workedExample.title}</p>
                <p className="mt-2 text-sm leading-6">{lecture.workedExample.prompt}</p>
                <p className="mt-3 border-t border-border pt-3 text-sm leading-6 text-muted-foreground">{lecture.workedExample.explanation}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Visual pathway</p>
              <h2 className="mt-1 text-lg font-bold">How the ideas connect</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {academyModule.lessons.map((lesson, index) => (
                <div key={lesson} className="relative">
                  {index < academyModule.lessons.length - 1 && (
                    <div className="absolute left-[calc(100%-6px)] top-1/2 z-10 hidden h-0.5 w-4 -translate-y-1/2 bg-primary/30 md:block" />
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenLesson(index)}
                    className={`relative h-full w-full rounded-xl border p-3 text-left transition-all ${
                      openLesson === index
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-muted/20 hover:border-primary/40"
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                    <p className="mt-3 text-xs font-bold leading-5">{lesson}</p>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Guided lessons</p>
            </div>
            <div className="divide-y divide-border">
              {academyModule.lessons.map((lesson, index) => (
                <div key={lesson}>
                  <button
                    type="button"
                    aria-expanded={openLesson === index}
                    onClick={() => setOpenLesson(openLesson === index ? -1 : index)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/30"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                    <span className="flex-1 font-semibold">{lesson}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openLesson === index ? "rotate-180" : ""}`} />
                  </button>
                  {openLesson === index && (
                    <div className="px-5 pb-5 pl-[68px]">
                      <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                        In this part of <strong className="text-foreground">{academyModule.title}</strong>, focus on how <span className="text-foreground">{lesson.toLowerCase()}</span> changes what you would plan, collect, analyze or report. Use the worked example as a model, then test the idea against your own study.
                      </p>
                      <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">Try it</p>
                        <p className="mt-1 text-sm leading-6">{lecture.reflection}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Knowledge check</p>
            <p className="mt-2 text-sm font-semibold">Which action best demonstrates understanding of this module?</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {["Memorize every term", "Apply the ideas to a study scenario"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setShowAnswer(true)}
                  className="rounded-xl border border-border px-4 py-3 text-left text-sm hover:border-primary/50 hover:bg-muted/30"
                >
                  {option}
                </button>
              ))}
            </div>
            {showAnswer && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-6">
                <strong>Correct: Apply the ideas to a study scenario.</strong> Real learning appears when you can choose, justify and adapt a method for a specific research context.
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
