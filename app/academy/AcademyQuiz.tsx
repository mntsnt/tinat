"use client";

import { useState } from "react";
import { Award, RotateCcw } from "lucide-react";
import { Button } from "../components/ui/Button";
import type { AcademyModule } from "./academyData";
import { getAcademyLecture } from "./academyContent";

export function AcademyQuiz({ academyModule }: { academyModule: AcademyModule }) {
  const lecture = getAcademyLecture(academyModule.slug);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!lecture) {
    throw new Error(`Missing Academy quiz content for module "${academyModule.slug}".`);
  }

  const score = lecture.quiz.reduce(
    (total, question, index) => total + (answers[index] === question.answer ? 1 : 0),
    0
  );
  const passingScore = Math.ceil((lecture.quiz.length * 2) / 3);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-5 py-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
          <Award className="h-4 w-4" /> Module quiz
        </p>
        <h2 className="mt-1 text-lg font-bold">{academyModule.title}: check your understanding</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer all {lecture.quiz.length} questions. You need {passingScore} correct to pass.
        </p>
      </div>

      <div className="space-y-5 p-5">
        {lecture.quiz.map((question, questionIndex) => (
          <fieldset key={question.question} className="space-y-2" disabled={submitted}>
            <legend className="mb-3 text-sm font-semibold leading-6">
              <span className="mr-2 text-primary">{questionIndex + 1}.</span>
              {question.question}
            </legend>
            {question.options.map((option, optionIndex) => {
              const isSelected = answers[questionIndex] === optionIndex;
              const isCorrect = question.answer === optionIndex;
              const resultStyle = submitted
                ? isCorrect
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : isSelected
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-border"
                : isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40";

              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${resultStyle} ${
                    submitted ? "cursor-default" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name={`academy-quiz-${academyModule.slug}-${questionIndex}`}
                    value={optionIndex}
                    checked={isSelected}
                    onChange={() =>
                      setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))
                    }
                    className="mt-0.5 accent-primary"
                  />
                  <span>{option}</span>
                </label>
              );
            })}
            {submitted && (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm leading-6 text-muted-foreground">
                <strong className="text-foreground">
                  {answers[questionIndex] === question.answer ? "Correct. " : "Review. "}
                </strong>
                {question.explanation}
              </p>
            )}
          </fieldset>
        ))}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {!submitted ? (
            <Button
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length !== lecture.quiz.length}
            >
              Submit quiz
            </Button>
          ) : (
            <>
              <p
                aria-live="polite"
                className={`text-sm font-semibold ${
                  score >= passingScore ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {score >= passingScore ? "Passed" : "Keep practicing"} — {score} of {lecture.quiz.length} correct
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Try again
              </Button>
            </>
          )}
          {!submitted && Object.keys(answers).length !== lecture.quiz.length && (
            <p className="text-xs text-muted-foreground">Answer each question to submit.</p>
          )}
        </div>
      </div>
    </section>
  );
}
