"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Flag,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  BookOpen,
  Check,
} from "lucide-react";
import { ModuleQuiz, QuizQuestion } from "@/lib/academy/types";
import { Button } from "@/app/components/ui/Button";
import { cn } from "@/lib/utils";
import { CompletionCard } from "./CompletionCard";

interface QuizEngineProps {
  quiz: ModuleQuiz;
}

export function QuizEngine({ quiz }: QuizEngineProps) {
  // Select active question slice
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    passed: boolean;
    totalQuestions: number;
    correctCount: number;
    passPercentage: number;
    feedback: Record<string, { isCorrect: boolean; explanation: string }>;
  } | null>(null);

  // Review mode
  const [reviewMistakesOnly, setReviewMistakesOnly] = useState(false);

  // Initialize questions
  useEffect(() => {
    const bank = quiz.questionBank;
    // Pick questions up to displayCount
    const selected = bank.slice(0, Math.min(bank.length, quiz.displayCount || 10));
    setQuestions(selected);

    // Load any saved best score from localStorage
    const savedBest = localStorage.getItem(`tinat_academy_quiz_${quiz.moduleSlug}`);
    if (savedBest) {
      try {
        const parsed = JSON.parse(savedBest);
        // Available for display
      } catch {}
    }
  }, [quiz]);

  if (!questions.length) return null;

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (qId: string, optId: string, isMulti: boolean) => {
    if (results) return; // Locked once submitted

    if (isMulti) {
      const existing = (userAnswers[qId] as string[]) || [];
      const updated = existing.includes(optId)
        ? existing.filter((id) => id !== optId)
        : [...existing, optId];
      setUserAnswers({ ...userAnswers, [qId]: updated });
    } else {
      setUserAnswers({ ...userAnswers, [qId]: optId });
    }
  };

  const handleTextAnswer = (qId: string, val: string) => {
    if (results) return;
    setUserAnswers({ ...userAnswers, [qId]: val });
  };

  const toggleFlag = (qId: string) => {
    setFlagged({ ...flagged, [qId]: !flagged[qId] });
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/academy/quiz/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleSlug: quiz.moduleSlug,
          answers: userAnswers,
        }),
      });
      const data = await res.json();
      setResults(data);

      // Save to localStorage for anonymous users
      localStorage.setItem(
        `tinat_academy_quiz_${quiz.moduleSlug}`,
        JSON.stringify({
          score: data.score,
          passed: data.passed,
          completedAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.error("Grading failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const retakeQuiz = () => {
    setResults(null);
    setUserAnswers({});
    setCurrentIndex(0);
    setReviewMistakesOnly(false);
  };

  const filteredQuestions = reviewMistakesOnly && results
    ? questions.filter((q) => !results.feedback[q.id]?.isCorrect)
    : questions;

  const activeQuestion = filteredQuestions[currentIndex] || filteredQuestions[0];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-md transition-all">
      {/* Quiz Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-emerald-700 dark:text-emerald-400 uppercase">
            FLAGSHIP MASTERY ASSESSMENT
          </span>
          <h3 className="text-xl font-bold text-foreground m-0">{quiz.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Pass mark: <strong>{quiz.passPercentage}%</strong>
          </span>
        </div>
      </div>

      {/* Results View */}
      {results && !reviewMistakesOnly && (
        results.passed ? (
          <div className="mb-8">
            <CompletionCard
              moduleSlug={quiz.moduleSlug}
              moduleTitle={quiz.title}
              moduleNumber={parseInt(quiz.moduleSlug.replace(/\D/g, ""), 10) || 1}
              score={results.score}
              correctCount={results.correctCount}
              totalQuestions={results.totalQuestions}
              onRetake={retakeQuiz}
              onReviewMistakes={() => {
                setReviewMistakesOnly(true);
                setCurrentIndex(0);
              }}
              hasMistakes={results.score < 100}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-amber-600/30 bg-amber-500/10 p-6 mb-8 text-center space-y-4 text-amber-950 dark:text-amber-100">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg">
                <RotateCcw className="h-8 w-8" />
              </div>
            </div>

            <div>
              <h4 className="text-2xl font-extrabold m-0">Needs Review</h4>
              <p className="text-sm opacity-90 mt-1">
                You scored <strong>{results.score}%</strong> ({results.correctCount} of {results.totalQuestions} questions correct). A minimum score of <strong>{quiz.passPercentage}%</strong> is required.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button size="sm" variant="outline" onClick={retakeQuiz} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Retake Quiz
              </Button>
              {results.score < 100 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setReviewMistakesOnly(true);
                    setCurrentIndex(0);
                  }}
                  className="gap-1.5"
                >
                  Review Mistakes Only
                </Button>
              )}
            </div>
          </div>
        )
      )}

      {/* Progress & Navigator Bar */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
          <span>
            Question {currentIndex + 1} of {filteredQuestions.length}
          </span>
          <span className="flex items-center gap-2">
            {flagged[activeQuestion.id] && (
              <span className="flex items-center gap-1 text-amber-600 text-[11px] font-bold">
                <Flag className="h-3 w-3 fill-amber-500" /> Flagged for review
              </span>
            )}
            <span>{progressPercent}% Complete</span>
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Active Question Box */}
      <div className="space-y-5">
        {/* Scenario/Excerpt Box if present */}
        {activeQuestion.scenario && (
          <div className="rounded-xl border border-sky-600/20 bg-sky-50/60 dark:bg-sky-950/20 p-4 text-xs sm:text-sm text-sky-950 dark:text-sky-200">
            <strong className="block font-bold mb-1 uppercase tracking-wider text-[10px] text-sky-700 dark:text-sky-400">
              CLINICAL / FIELD SCENARIO
            </strong>
            {activeQuestion.scenario}
          </div>
        )}

        {activeQuestion.excerpt && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs sm:text-sm font-serif italic text-foreground">
            <strong className="block not-italic font-sans font-bold mb-1 uppercase tracking-wider text-[10px] text-muted-foreground">
              PUBLISHED EXCERPT FOR CRITICAL APPRAISAL
            </strong>
            "{activeQuestion.excerpt}"
          </div>
        )}

        <h4 className="text-base font-bold text-foreground leading-snug m-0">
          {activeQuestion.question}
        </h4>

        {/* Question Options */}
        {activeQuestion.options && (
          <div className="space-y-2.5">
            {activeQuestion.options.map((opt) => {
              const isMulti = activeQuestion.type === "multiple-select";
              const isSelected = isMulti
                ? ((userAnswers[activeQuestion.id] as string[]) || []).includes(opt.id)
                : userAnswers[activeQuestion.id] === opt.id;

              const isFeedbackAvailable = !!results;
              const isCorrectOpt = opt.isCorrect;

              let cardStyle = "border-border hover:border-emerald-600/40 hover:bg-muted/40";
              if (isSelected) {
                cardStyle = "border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 font-medium";
              }
              if (isFeedbackAvailable) {
                if (isCorrectOpt) {
                  cardStyle = "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 font-semibold";
                } else if (isSelected && !isCorrectOpt) {
                  cardStyle = "border-red-500 bg-red-50 dark:bg-red-950/40";
                }
              }

              return (
                <div key={opt.id} className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectOption(activeQuestion.id, opt.id, isMulti)}
                    className={cn(
                      "w-full text-left rounded-xl border p-3.5 text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer",
                      cardStyle
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                        isSelected
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {isSelected ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : null}
                    </span>
                    <span className="flex-1 leading-relaxed">{opt.text}</span>
                  </button>

                  {/* Immediate Explanation after submission */}
                  {isFeedbackAvailable && (
                    <div
                      className={cn(
                        "ml-7 rounded-lg p-2.5 text-[11px] leading-relaxed border",
                        isCorrectOpt
                          ? "bg-emerald-50 text-emerald-900 border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-200"
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      <strong>{isCorrectOpt ? "Why Right:" : "Why Wrong:"}</strong> {opt.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Numeric Question Input */}
        {activeQuestion.type === "numeric" && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold">
              Enter calculated numerical answer ({activeQuestion.numericUnit || "value"}):
              <input
                type="number"
                step="0.01"
                value={userAnswers[activeQuestion.id] || ""}
                onChange={(e) => handleTextAnswer(activeQuestion.id, e.target.value)}
                disabled={!!results}
                placeholder="e.g. 384"
                className="mt-1 w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
              />
            </label>
            {results && (
              <div className="rounded-lg p-3 bg-muted text-xs leading-relaxed border border-border">
                <strong>Authoritative Explanation:</strong> {activeQuestion.explanation}
              </div>
            )}
          </div>
        )}

        {/* Fill-in-the-Blank Input */}
        {activeQuestion.type === "fill-blank" && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold">
              Type the missing scientific term:
              <input
                type="text"
                value={userAnswers[activeQuestion.id] || ""}
                onChange={(e) => handleTextAnswer(activeQuestion.id, e.target.value)}
                disabled={!!results}
                placeholder="Enter term here..."
                className="mt-1 w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            {results && (
              <div className="rounded-lg p-3 bg-muted text-xs leading-relaxed border border-border">
                <strong>Authoritative Explanation:</strong> {activeQuestion.explanation}
              </div>
            )}
          </div>
        )}

        {/* Hint toggle */}
        {activeQuestion.hint && !results && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowHint({ ...showHint, [activeQuestion.id]: !showHint[activeQuestion.id] })}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              {showHint[activeQuestion.id] ? "Hide hint" : "Need a hint?"}
            </button>
            {showHint[activeQuestion.id] && (
              <p className="mt-2 text-xs italic text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
                💡 {activeQuestion.hint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation & Submit Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 mt-8">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Previous
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleFlag(activeQuestion.id)}
            className={cn(
              "gap-1.5 text-xs",
              flagged[activeQuestion.id] && "text-amber-600 font-bold"
            )}
          >
            <Flag className="h-3.5 w-3.5" />
            {flagged[activeQuestion.id] ? "Unflag" : "Flag"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {currentIndex < filteredQuestions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            !results && (
              <Button
                size="sm"
                onClick={submitQuiz}
                isLoading={isSubmitting}
                className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-5 font-bold shadow-sm"
              >
                Submit Assessment
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
