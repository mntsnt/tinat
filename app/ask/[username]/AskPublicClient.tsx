"use client";

import { useState } from "react";
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
  Heart,
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

const STARTER_PROMPTS = [
  "What is your biggest goal for this year? 🎯",
  "What is one piece of advice you'd give your younger self? 💡",
  "What's something people misunderstand about you? 🤔",
  "What are you most passionate about right now? ✨",
];

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
    <div className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Recipient Profile Card */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-background mx-auto">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {profile.displayName}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="text-sm text-foreground/80 mt-2 max-w-md mx-auto leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Ask me anything anonymously!
          </div>
        </div>

        {/* Question Submission / Post-Submission Box */}
        {!submitted ? (
          <div className="bg-card border border-border/80 rounded-2xl shadow-xl p-5 sm:p-6 space-y-5 transition-all">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="sr-only">Your Question</label>
                <textarea
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={`Send an anonymous question to ${profile.displayName}...\nI will never know who sent this 🤫`}
                  className="w-full rounded-xl border border-input bg-background/50 p-4 text-sm sm:text-base placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all"
                  maxLength={maxChars}
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    100% Anonymous
                  </span>
                  <span
                    className={
                      charCount > 450
                        ? "text-amber-500 font-semibold"
                        : "text-muted-foreground"
                    }
                  >
                    {charCount} / {maxChars}
                  </span>
                </div>
              </div>

              {/* Starter Prompts */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Need inspiration? Tap to use:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuestionText(prompt)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground/80 hover:text-foreground transition-colors text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || charCount < 3}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-md hover:bg-primary/95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Sending anonymously...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Anonymously
                  </>
                )}
              </button>
            </form>

            {/* Zero Identification Disclaimer */}
            <div className="pt-2 border-t border-border/40 text-center">
              <p className="text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Zero sender data is logged. No accounts, cookies, IP addresses, or fingerprints.
              </p>
            </div>
          </div>
        ) : (
          /* Post-Submission Viral Conversion Card */
          <div className="bg-card border border-border/80 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Question Sent Anonymously! 🚀
              </h2>
              <p className="text-sm text-muted-foreground">
                Your question was delivered to {profile.displayName}. They will never know who sent it.
              </p>
            </div>

            {/* High-converting prompt to sign up and get their own link */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-indigo-500/10 to-primary/5 border border-primary/20 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Viral Social Q&A
              </div>
              <h3 className="text-base font-bold text-foreground">
                Want people to ask YOU anything anonymously?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create your own free Tinat Ask link in 10 seconds. Share it on Instagram Stories, Telegram, WhatsApp, or X, and export sleek visual question decks!
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/register?redirect=/ask"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
                >
                  Create Your Free Ask Link <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login?redirect=/ask"
                  className="py-2.5 px-4 rounded-xl border border-border bg-card font-medium text-xs sm:text-sm hover:bg-muted transition-all flex items-center justify-center"
                >
                  Log In
                </Link>
              </div>
            </div>

            {/* Send Another Button */}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ask another question to {profile.displayName}
            </button>
          </div>
        )}

        {/* Public Answered Questions Section (if enabled) */}
        {profile.allowPublicAnswers && publicQuestions.length > 0 && (
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MessageCircleQuestion className="w-4 h-4 text-primary" />
                Answered by {profile.displayName} ({publicQuestions.length})
              </h3>
            </div>

            <div className="space-y-4">
              {publicQuestions.map((q) => (
                <div
                  key={q.id}
                  className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3 shadow-sm"
                >
                  {/* Question */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                      Anonymous Asked
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      &ldquo;{q.questionText}&rdquo;
                    </p>
                  </div>

                  {/* Recipient's Answer */}
                  {q.answerText && (
                    <div className="pl-3 border-l-2 border-primary/60 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {profile.displayName}
                        </span>
                        {q.answeredAt && (
                          <span className="text-[10px] text-muted-foreground">
                            • {new Date(q.answeredAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {q.answerText}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
