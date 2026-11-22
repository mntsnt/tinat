"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Lock,
  MessageCircleQuestion,
  Share2,
} from "lucide-react";

interface PublicQuestion {
  id: string;
  questionText: string;
  answerText: string | null;
  answeredAt: string | Date | null;
}

interface AskPublicClientProps {
  profile: {
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    theme: string | null;
    allowPublicAnswers: boolean;
  };
  publicQuestions: PublicQuestion[];
}

export function AskPublicClient({ profile, publicQuestions }: AskPublicClientProps) {
  const [questionText, setQuestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = questionText.length;
  const maxChars = 500;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText.trim() || charCount < 3 || charCount > maxChars) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/ask/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          questionText: questionText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send question.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setQuestionText("");
    setSubmitted(false);
    setError(null);
  }

  const initials = (profile.displayName || profile.username || "T")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-14 border-b border-border/70 bg-card/60 backdrop-blur-md px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight text-foreground">Tinat Ask</span>
        </Link>

        <Link
          href="/ask"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          Create your own link <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Recipient Profile Card */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-md ring-4 ring-background mx-auto">
              {initials}
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-1 shadow-xs"
              title="Verified Ask Profile"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {profile.displayName}
            </h1>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="text-xs sm:text-sm text-foreground/80 mt-2 max-w-sm mx-auto leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-500/20 shadow-2xs">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>100% Private &amp; Anonymous Submission</span>
          </div>
        </div>

        {/* Question Submission / Post-Submission Box */}
        {!submitted ? (
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4 transition-all">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="ask-question" className="sr-only">
                  Your Question
                </label>
                <textarea
                  id="ask-question"
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={`Ask ${profile.displayName} a question...\nYour identity is completely private.`}
                  className="w-full rounded-xl border border-input bg-background/60 p-3.5 text-base sm:text-xs leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
                  maxLength={maxChars}
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    No account required
                  </span>
                  <span
                    className={
                      charCount > 450 ? "text-amber-500 font-semibold" : "text-muted-foreground"
                    }
                  >
                    {charCount} / {maxChars}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || charCount < 3}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    Sending anonymously...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Question
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-border/40 text-center">
              <p className="text-[10.5px] text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Submitted confidentially. Your identity and credentials are never recorded.
              </p>
            </div>
          </div>
        ) : (
          /* Clean Confirmation State */
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 space-y-5 text-center shadow-2xs animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Question Sent Privately
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Your question was delivered to {profile.displayName} without any account or profile details.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 px-3 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ask another question
              </button>

              <Link
                href="/ask"
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Create your own Ask link
              </Link>
            </div>
          </div>
        )}

        {/* Public Answered Questions Section */}
        {profile.allowPublicAnswers && publicQuestions.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageCircleQuestion className="w-3.5 h-3.5 text-emerald-500" />
                Answered Questions ({publicQuestions.length})
              </h3>
            </div>

            <div className="space-y-3">
              {publicQuestions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5 shadow-2xs"
                >
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                      Question
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      &ldquo;{q.questionText}&rdquo;
                    </p>
                  </div>

                  {q.answerText && (
                    <div className="pl-3 border-l-2 border-emerald-500/80 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">
                          {profile.displayName}
                        </span>
                        {q.answeredAt && (
                          <span className="text-[10px] text-muted-foreground">
                            &bull; {new Date(q.answeredAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {q.answerText}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-muted-foreground border-t border-border/60">
        Powered by <Link href="/" className="font-semibold hover:text-foreground">Tinat Health Network</Link>
      </footer>
    </div>
  );
}
