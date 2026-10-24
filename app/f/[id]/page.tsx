"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Sparkles,
  ClipboardList,
  Coins,
  MessageCircleMore,
  ArrowRight,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";

type QuestionOption = {
  id: string;
  text: string;
  value: string;
  order: number;
};

type Question = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  order: number;
  scaleMin?: number | null;
  scaleMax?: number | null;
  scaleMinLabel?: string | null;
  scaleMaxLabel?: string | null;
  options: QuestionOption[];
};

type FormData = {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED";
  author: string;
  questions: Question[];
};

export default function PublicFormFillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const formId = resolvedParams.id;

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchForm();
  }, [formId]);

  async function fetchForm() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/f/${formId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Form not found");
      }
      const data = await res.json();
      setForm(data.form);
    } catch (err: any) {
      setError(err.message || "Failed to load form.");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(questionId: string, value: any) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  function handleCheckboxToggle(questionId: string, optionText: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [];
      const index = current.indexOf(optionText);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(optionText);
      }
      return {
        ...prev,
        [questionId]: current,
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setError(null);

    // Validate required questions
    for (const q of form.questions) {
      if (q.required) {
        const val = answers[q.id];
        const isEmpty =
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.trim() === "") ||
          (Array.isArray(val) && val.length === 0);

        if (isEmpty) {
          setError(`Please answer required question: "${q.text}"`);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/f/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit response");
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Failed to submit response.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setAnswers({});
    setSubmitted(false);
    setError(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
        <div className="text-sm text-muted-foreground">Loading form...</div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="inline-flex p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold">Unable to Open Form</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link href="/">
            <Button variant="outline" className="mt-2 text-xs">
              Go to Tinat Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!form) return null;

  // Post-submission Screen with Referral / Account Recommendation
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex flex-col items-center">
        <div className="max-w-lg w-full space-y-6">
          {/* Confirmation Card */}
          <div className="bg-card border rounded-2xl shadow-sm p-8 text-center space-y-4 overflow-hidden relative">
            <div className="h-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 absolute top-0 left-0 right-0" />
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 mt-2">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold">{form.title}</h1>
            <p className="text-sm text-muted-foreground">
              Your response has been recorded. Thank you for your feedback!
            </p>

            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Submit another response
              </Button>
            </div>
          </div>

          {/* Growth / Referral Recommendation Card */}
          <div className="bg-gradient-to-br from-emerald-950/20 via-card to-card border border-emerald-500/30 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Discover More on Tinat
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold">
                Want to earn rewards or create your own surveys?
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tinat is Ethiopia's research and survey platform. Join for free today:
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-semibold block text-foreground">
                    Participate & Earn Credits
                  </span>
                  <span className="text-muted-foreground">
                    Get rewarded for completing health and academic studies directly to your Tinat wallet.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-semibold block text-foreground">
                    Create Free Surveys
                  </span>
                  <span className="text-muted-foreground">
                    Easily build Tinat Forms for school, projects, or work and export data to Excel anytime.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 shrink-0 mt-0.5">
                  <MessageCircleMore className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-semibold block text-foreground">
                    Ask Ethiopian Researchers
                  </span>
                  <span className="text-muted-foreground">
                    Engage with Tinat Ask to discuss topics, pose questions, and explore knowledge.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Link href="/register" className="flex-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5">
                  <span>Create Free Account</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/login" className="sm:w-auto">
                <Button variant="outline" className="w-full text-xs">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="text-center text-xs text-muted-foreground">
            Powered by{" "}
            <Link href="/" className="font-semibold hover:underline text-foreground">
              Tinat
            </Link>{" "}
            • Research and Data Platform
          </div>
        </div>
      </div>
    );
  }

  // Active Answering Form View
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 sm:py-12 px-4">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
        {/* Form Header Card */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden relative">
          <div className="h-3 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5" /> Tinat Form
              </span>
              <span className="text-xs text-muted-foreground">
                By {form.author}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {form.title}
            </h1>

            {form.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {form.description}
              </p>
            )}

            <div className="pt-2 text-[11px] text-muted-foreground border-t flex items-center justify-between">
              <span className="text-destructive font-medium">* Required question</span>
              <span>No sign-in required to submit</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Questions Cards */}
        {form.questions.map((q, idx) => {
          const currentAnswer = answers[q.id];

          return (
            <div
              key={q.id}
              className="rounded-xl border bg-card shadow-sm p-6 space-y-4 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-medium">
                    {idx + 1}. {q.text}
                    {q.required && <span className="text-destructive ml-1">*</span>}
                  </h3>
                </div>
              </div>

              {/* Input Renderers */}
              <div className="pt-1">
                {/* Short Answer */}
                {q.type === "SHORT_TEXT" && (
                  <input
                    type="text"
                    value={currentAnswer || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Your answer"
                    className="w-full text-sm bg-transparent border-b border-border focus:border-emerald-500 focus:outline-none py-2 transition-colors"
                  />
                )}

                {/* Long Answer */}
                {q.type === "LONG_TEXT" && (
                  <textarea
                    value={currentAnswer || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Your answer"
                    rows={3}
                    className="w-full text-sm bg-transparent border rounded-lg p-3 border-border focus:border-emerald-500 focus:outline-none resize-none transition-colors"
                  />
                )}

                {/* Number */}
                {q.type === "NUMBER" && (
                  <input
                    type="number"
                    value={currentAnswer || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Enter a number"
                    className="w-full max-w-xs text-sm bg-transparent border-b border-border focus:border-emerald-500 focus:outline-none py-2 transition-colors"
                  />
                )}

                {/* Date */}
                {q.type === "DATE" && (
                  <input
                    type="date"
                    value={currentAnswer || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="text-sm bg-transparent border rounded-lg px-3 py-2 border-border focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                )}

                {/* Yes / No */}
                {q.type === "YES_NO" && (
                  <div className="flex items-center gap-3">
                    {["Yes", "No"].map((option) => (
                      <label
                        key={option}
                        className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                          currentAnswer === option
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-border hover:bg-muted/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={option}
                          checked={currentAnswer === option}
                          onChange={() => handleAnswerChange(q.id, option)}
                          className="sr-only"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Single Choice (Radio) */}
                {q.type === "SINGLE_CHOICE" && (
                  <div className="space-y-2.5">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-3 text-sm cursor-pointer group py-1"
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={opt.text}
                          checked={currentAnswer === opt.text}
                          onChange={() => handleAnswerChange(q.id, opt.text)}
                          className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                        <span className="text-foreground group-hover:text-emerald-600 transition-colors">
                          {opt.text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Multiple Choice (Checkboxes) */}
                {q.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2.5">
                    {q.options.map((opt) => {
                      const isChecked =
                        Array.isArray(currentAnswer) && currentAnswer.includes(opt.text);
                      return (
                        <label
                          key={opt.id}
                          className="flex items-center gap-3 text-sm cursor-pointer group py-1"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxToggle(q.id, opt.text)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                          />
                          <span className="text-foreground group-hover:text-emerald-600 transition-colors">
                            {opt.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown */}
                {q.type === "DROPDOWN" && (
                  <select
                    value={currentAnswer || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="w-full text-sm bg-background border rounded-lg px-3 py-2.5 border-border focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Choose an option...</option>
                    {q.options.map((opt) => (
                      <option key={opt.id} value={opt.text}>
                        {opt.text}
                      </option>
                    ))}
                  </select>
                )}

                {/* Linear Scale (1 to 5) */}
                {q.type === "LINEAR_SCALE" && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <span>{q.scaleMinLabel || "1"}</span>
                      <span>{q.scaleMaxLabel || "5"}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <label
                          key={val}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${
                            currentAnswer === val
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={val}
                            checked={currentAnswer === val}
                            onChange={() => handleAnswerChange(q.id, val)}
                            className="sr-only"
                          />
                          <span>{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-2.5 shadow-sm text-sm"
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear form
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 text-xs text-muted-foreground">
          Never submit passwords through Tinat Forms. •{" "}
          <Link href="/" className="underline hover:text-foreground">
            Tinat Platform
          </Link>
        </div>
      </form>
    </div>
  );
}
