"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ExternalLink,
  Layers,
  HelpCircle,
  Stethoscope,
  Smile,
  Check,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Card, CardContent } from "@/app/components/ui/Card";

export interface TintokQuestionOption {
  id: string;
  text: string;
  value: string;
  order: number;
}

export interface TintokQuestion {
  id: string;
  order: number;
  text: string;
  type: string;
  required: boolean;
  scaleMin?: number | null;
  scaleMax?: number | null;
  scaleMinLabel?: string | null;
  scaleMaxLabel?: string | null;
  options: TintokQuestionOption[];
}

export interface TintokStudyItem {
  id: string;
  title: string;
  description?: string | null;
  objective?: string | null;
  category?: string | null;
  estimatedMinutes?: number | null;
  fundingType: string;
  rewardCredits: number;
  participantTarget: number;
  researcher: {
    id: string;
    name: string;
    institution?: string | null;
    isVerified: boolean;
    avatarUrl?: string | null;
  };
  questions: TintokQuestion[];
  consentForms: Array<{
    id: string;
    version: number;
  }>;
  parentStudy?: {
    id: string;
    title: string;
    status: string;
    estimatedMinutes?: number | null;
    rewardCredits: number;
    fundingType: string;
  } | null;
  teaserLinkEnabled: boolean;
  hasConsented?: boolean;
}

interface Props {
  studies: TintokStudyItem[];
  currentUserId: string;
}

export function TinTokFeedClient({ studies: initialStudies, currentUserId }: Props) {
  const [studies, setStudies] = useState<TintokStudyItem[]>(initialStudies);
  const [activeStudyIndex, setActiveStudyIndex] = useState(0);

  // Active study state
  const [answeringStudyId, setAnsweringStudyId] = useState<string | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [consentedStudies, setConsentedStudies] = useState<Record<string, boolean>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedStudies, setCompletedStudies] = useState<Record<string, { creditsEarned: number }>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const currentStudy = studies[activeStudyIndex];
  const isCompleted = completedStudies[currentStudy?.id];
  const isAnswering = answeringStudyId === currentStudy?.id;
  const isConsented = consentedStudies[currentStudy?.id] || currentStudy?.hasConsented;

  // Keyboard navigation for cover card feed and question deck
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (answeringStudyId) {
        // While in answering mode, let arrow keys navigate cards if not in text input
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") return;

        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          handleNextCard();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrevCard();
        }
        return;
      }

      // Browsing cover cards feed
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goToNextStudy();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goToPrevStudy();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStudyIndex, answeringStudyId, activeCardIndex, answers, studies]);

  // Wheel and Touch navigation for cover card feed and question deck
  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      const target = e.target as HTMLElement;
      if (target?.closest?.("input, textarea, select")) return;

      const now = Date.now();
      if (now - lastScrollTime.current < 450) return;

      if (Math.abs(e.deltaY) > 25) {
        if (e.deltaY > 0) {
          // Scroll down -> next
          if (!answeringStudyId) {
            goToNextStudy();
            lastScrollTime.current = now;
          } else if (isConsented && !isCompleted) {
            handleNextCard();
            lastScrollTime.current = now;
          }
        } else {
          // Scroll up -> prev
          if (!answeringStudyId) {
            goToPrevStudy();
            lastScrollTime.current = now;
          } else if (isConsented && !isCompleted) {
            handlePrevCard();
            lastScrollTime.current = now;
          }
        }
      }
    }

    function handleTouchStart(e: TouchEvent) {
      touchStartY.current = e.touches[0].clientY;
    }

    function handleTouchEnd(e: TouchEvent) {
      const target = e.target as HTMLElement;
      if (target?.closest?.("input, textarea, select, button")) return;

      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartY.current - touchEndY;

      if (Math.abs(diffY) > 50) {
        if (diffY > 0) {
          // Swiped up -> next
          if (!answeringStudyId) {
            goToNextStudy();
          } else if (isConsented && !isCompleted) {
            handleNextCard();
          }
        } else {
          // Swiped down -> prev
          if (!answeringStudyId) {
            goToPrevStudy();
          } else if (isConsented && !isCompleted) {
            handlePrevCard();
          }
        }
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [activeStudyIndex, answeringStudyId, activeCardIndex, isConsented, isCompleted, currentStudy, studies.length]);

  function goToNextStudy() {
    if (activeStudyIndex < studies.length - 1) {
      setActiveStudyIndex((prev) => prev + 1);
      setAnsweringStudyId(null);
      setActiveCardIndex(0);
      setAnswers({});
      setSubmitError(null);
    }
  }

  function goToPrevStudy() {
    if (activeStudyIndex > 0) {
      setActiveStudyIndex((prev) => prev - 1);
      setAnsweringStudyId(null);
      setActiveCardIndex(0);
      setAnswers({});
      setSubmitError(null);
    }
  }

  function startStudy(study: TintokStudyItem) {
    setAnsweringStudyId(study.id);
    setActiveCardIndex(0);
    setAnswers({});
    setSubmitError(null);
  }

  function exitAnswering() {
    setAnsweringStudyId(null);
    setActiveCardIndex(0);
    setAnswers({});
    setSubmitError(null);
  }

  function updateAnswer(questionId: string, value: any, autoAdvance = false) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    if (autoAdvance && currentStudy && activeCardIndex < currentStudy.questions.length - 1) {
      setTimeout(() => {
        setActiveCardIndex((prev) => Math.min(prev + 1, currentStudy.questions.length - 1));
      }, 260);
    }
  }

  function handleNextCard() {
    if (!currentStudy) return;
    if (activeCardIndex < currentStudy.questions.length - 1) {
      setActiveCardIndex((prev) => prev + 1);
    }
  }

  function handlePrevCard() {
    if (activeCardIndex > 0) {
      setActiveCardIndex((prev) => prev - 1);
    }
  }

  async function handleConsentAndProceed(study: TintokStudyItem) {
    const consentFormId = study.consentForms[0]?.id;
    if (consentFormId) {
      try {
        await fetch(`/api/studies/${study.id}/consent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consentFormId, language: "en" }),
        });
      } catch (err) {
        console.error("Consent recording warning:", err);
      }
    }
    setConsentedStudies((prev) => ({ ...prev, [study.id]: true }));
  }

  async function handleSubmitStudy() {
    if (!currentStudy) return;

    // Validate required questions
    for (const q of currentStudy.questions) {
      if (q.required) {
        const val = answers[q.id];
        const empty =
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0);
        if (empty) {
          setSubmitError(`Please answer card ${q.order}: "${q.text}"`);
          const targetCardIdx = currentStudy.questions.findIndex((item) => item.id === q.id);
          if (targetCardIdx >= 0) setActiveCardIndex(targetCardIdx);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Ensure consent recorded first
      const consentFormId = currentStudy.consentForms[0]?.id;
      if (consentFormId && !consentedStudies[currentStudy.id]) {
        await fetch(`/api/studies/${currentStudy.id}/consent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consentFormId, language: "en" }),
        });
      }

      const res = await fetch(`/api/studies/${currentStudy.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          language: "en",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit micro-survey responses.");
      }

      setCompletedStudies((prev) => ({
        ...prev,
        [currentStudy.id]: { creditsEarned: data.creditsEarned || currentStudy.rewardCredits || 0 },
      }));
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit study");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── No Studies Empty State ──
  if (!studies || studies.length === 0) {
    return (
      <div className="flex h-full min-h-[80vh] items-center justify-center p-4">
        <Card className="max-w-md w-full border-dashed p-8 text-center bg-card shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">You&apos;re All Caught Up!</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            There are currently no new TinTok micro-surveys available for your account. You have either completed all available micro-studies or they have reached capacity.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link href="/participant/studies">
              <Button className="w-full text-xs">Explore Comprehensive Studies</Button>
            </Link>
            <Link href="/participant">
              <Button variant="outline" className="w-full text-xs">Return to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full min-h-[calc(100vh-4rem)] md:min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-2 sm:p-4 md:p-6"
    >
      {/* ── Top Header Navigation Bar ── */}
      <div className="w-full max-w-xl flex items-center justify-between pb-3 px-2 z-20">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-foreground">TinTok Feed</span>
            <span className="ml-2 text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
              Micro-Studies
            </span>
          </div>
        </div>

        {/* Counter indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span>{activeStudyIndex + 1} of {studies.length}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToPrevStudy}
              disabled={activeStudyIndex === 0}
              className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous study (Arrow Up)"
              aria-label="Previous study"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goToNextStudy}
              disabled={activeStudyIndex === studies.length - 1}
              className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next study (Arrow Down)"
              aria-label="Next study"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Container: Cover Card OR Interactive Card Questionnaire ── */}
      <div className="relative w-full max-w-xl flex-1 flex flex-col justify-center items-center my-auto">
        {!isAnswering ? (
          /* ==================================================================== */
          /* COVER CARD VIEW                                                      */
          /* ==================================================================== */
          <div
            className="w-full flex flex-col rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95"
            data-testid="tintok-cover-card"
          >
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500" />

            {/* Badges Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  TinTok Micro-Survey
                </span>
                {currentStudy.category && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    {currentStudy.category}
                  </span>
                )}
              </div>

              {currentStudy.rewardCredits > 0 ? (
                <span className="text-xs font-bold text-white bg-emerald-600 px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  {currentStudy.rewardCredits} TC
                </span>
              ) : (
                <span className="text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full">
                  Volunteer
                </span>
              )}
            </div>

            {/* Study Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-snug mb-3">
              {currentStudy.title}
            </h1>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-4 h-4 text-purple-500" />
                {currentStudy.questions.length} Quick Cards
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-emerald-500" />
                ~{currentStudy.estimatedMinutes || 2} mins
              </span>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Stethoscope className="w-4 h-4 text-primary" />
                {currentStudy.researcher.name}
              </span>
            </div>

            {/* Objective / Description Box */}
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 mb-6 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              <span className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                Survey Objective
              </span>
              <p className="italic">
                &ldquo;{currentStudy.objective || currentStudy.description || "Micro-survey collecting community health insights for academic and clinical research."}&rdquo;
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full">
              <Button
                size="lg"
                onClick={() => startStudy(currentStudy)}
                className="w-full h-12 text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md gap-2"
                data-testid="start-tintok-study-btn"
              >
                <span>Continue &amp; Answer Cards</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              {activeStudyIndex < studies.length - 1 ? (
                <button
                  type="button"
                  onClick={goToNextStudy}
                  className="group flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
                >
                  <span>Or scroll down to browse next study</span>
                  <ChevronDown className="w-4 h-4 animate-bounce group-hover:translate-y-0.5 transition-transform" />
                </button>
              ) : (
                <p className="text-center text-[11px] text-muted-foreground pt-1">
                  Last micro-study in the feed.
                </p>
              )}
            </div>
          </div>
        ) : isCompleted ? (
          /* ==================================================================== */
          /* COMPLETION & OPTIONAL TEASER CARD VIEW                               */
          /* ==================================================================== */
          <div
            className="w-full flex flex-col items-center rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl text-center animate-in fade-in zoom-in-95"
            data-testid="tintok-completion-card"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-4 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-1">
              Micro-Study Completed!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Thank you for contributing to health research on Tinat. Your responses have been submitted securely.
            </p>

            {isCompleted.creditsEarned > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-6">
                <Coins className="w-4 h-4" />
                +{isCompleted.creditsEarned} Tinat Credits Credited
              </div>
            )}

            {/* TEASER CARD (If parent study active & teaser link enabled) */}
            {currentStudy.teaserLinkEnabled && currentStudy.parentStudy && currentStudy.parentStudy.status === "ACTIVE" && (
              <div
                className="w-full rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 text-left mb-6 shadow-xs"
                data-testid="tintok-teaser-card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Comprehensive Research Study
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-foreground mb-1.5">
                  {currentStudy.parentStudy.title}
                </h3>

                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Would you like to participate in the full, in-depth research study? It involves comprehensive questions and its own separate informed consent.
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    ~{currentStudy.parentStudy.estimatedMinutes || 15} minutes
                  </span>
                  {currentStudy.parentStudy.rewardCredits > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <Coins className="w-3.5 h-3.5" />
                      {currentStudy.parentStudy.rewardCredits} TC Reward
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Link href={`/participant/studies/${currentStudy.parentStudy.id}`} className="flex-1">
                    <Button size="sm" className="w-full text-xs font-semibold gap-1.5">
                      <span>Take the full study</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (activeStudyIndex < studies.length - 1) {
                        goToNextStudy();
                      } else {
                        exitAnswering();
                      }
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    No thanks
                  </Button>
                </div>
              </div>
            )}

            {/* Next study or return button */}
            <div className="flex flex-col gap-2 w-full">
              {activeStudyIndex < studies.length - 1 ? (
                <Button
                  size="lg"
                  onClick={goToNextStudy}
                  className="w-full text-xs font-bold gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <span>Browse Next TinTok Study</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              ) : (
                <Link href="/participant/studies" className="w-full">
                  <Button size="lg" className="w-full text-xs font-bold">
                    Discover More Studies
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : !isConsented ? (
          /* ==================================================================== */
          /* STREAMLINED MICRO-CONSENT CARD                                       */
          /* ==================================================================== */
          <div className="w-full flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm text-foreground">Informed Participant Consent</span>
              </div>
              <button
                type="button"
                onClick={exitAnswering}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
              Before starting the cards for <strong className="text-foreground">{currentStudy.title}</strong>, please confirm your voluntary participation:
            </p>

            <div className="space-y-3 mb-6">
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 text-xs text-foreground/90 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Voluntary &amp; Adult Only (18+)
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Participation is completely voluntary. You may stop at any point without penalty.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 text-xs text-foreground/90 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Confidential &amp; Coded Linkage
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Your responses are decoupled from your profile and coded under an unguessable respondent token. Tinat Credits have strictly zero cash redemption value.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={exitAnswering}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => handleConsentAndProceed(currentStudy)}
                className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                data-testid="consent-and-start-btn"
              >
                <span>I Agree &amp; Begin Cards</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* ==================================================================== */
          /* QUESTION CARDS SCROLLING / SWIPING DECK                             */
          /* ==================================================================== */
          <div
            className="w-full flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl relative min-h-[420px] transition-all animate-in fade-in"
            data-testid="tintok-question-deck"
          >
            {/* Top Deck Header: Progress & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  Card {activeCardIndex + 1} of {currentStudy.questions.length}
                </span>
                    {/* Progress Bar and Indicator */}
                    <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-300"
                        style={{
                          width: `${((activeCardIndex + 1) / currentStudy.questions.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                      Scroll, swipe, or use arrows
                    </span>
                    <button
                      type="button"
                      onClick={exitAnswering}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      title="Exit to cover card"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
            </div>

            {/* Question Card Content */}
            {(() => {
              const currentQuestion = currentStudy.questions[activeCardIndex];
              if (!currentQuestion) return null;

              const val = answers[currentQuestion.id];

              return (
                <div className="flex-1 flex flex-col justify-between space-y-6">
                  <div>
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Question {currentQuestion.order}
                      </span>
                      {currentQuestion.required && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug mb-5">
                      {currentQuestion.text}
                    </h2>

                    {/* Question Type Inputs */}
                    {/* 1. SINGLE_CHOICE */}
                    {currentQuestion.type === "SINGLE_CHOICE" && (
                      <div className="space-y-2.5">
                        {currentQuestion.options.map((option) => {
                          const isSelected = val === option.value;
                          return (
                            <button
                              type="button"
                              key={option.id}
                              onClick={() => {
                                updateAnswer(currentQuestion.id, option.value, true);
                              }}
                              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all ${
                                isSelected
                                  ? "border-purple-600 bg-purple-500/10 font-bold text-foreground shadow-xs"
                                  : "border-border hover:bg-muted/40 text-foreground"
                              }`}
                            >
                              <span>{option.text}</span>
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "border-purple-600 bg-purple-600 text-white"
                                    : "border-muted-foreground/40"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. MULTIPLE_CHOICE */}
                    {currentQuestion.type === "MULTIPLE_CHOICE" && (
                      <div className="space-y-2.5">
                        {currentQuestion.options.map((option) => {
                          const currentArr: string[] = Array.isArray(val) ? val : [];
                          const isChecked = currentArr.includes(option.value);
                          return (
                            <button
                              type="button"
                              key={option.id}
                              onClick={() => {
                                if (isChecked) {
                                  updateAnswer(
                                    currentQuestion.id,
                                    currentArr.filter((v) => v !== option.value)
                                  );
                                } else {
                                  updateAnswer(currentQuestion.id, [...currentArr, option.value]);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all ${
                                isChecked
                                  ? "border-purple-600 bg-purple-500/10 font-bold text-foreground shadow-xs"
                                  : "border-border hover:bg-muted/40 text-foreground"
                              }`}
                            >
                              <span>{option.text}</span>
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? "border-purple-600 bg-purple-600 text-white"
                                    : "border-muted-foreground/40"
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. LINEAR_SCALE / RATING (1 to 5) */}
                    {(currentQuestion.type === "LINEAR_SCALE" || currentQuestion.type === "RATING_SCALE") && (() => {
                      const min = currentQuestion.scaleMin ?? 1;
                      const max = currentQuestion.scaleMax ?? 5;
                      const scaleNums: number[] = [];
                      for (let i = min; i <= max; i++) scaleNums.push(i);

                      return (
                        <div className="space-y-3 pt-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {scaleNums.map((num) => {
                              const isPicked = Number(val) === num;
                              return (
                                <button
                                  type="button"
                                  key={num}
                                  onClick={() => updateAnswer(currentQuestion.id, num, true)}
                                  className={`flex-1 min-w-[48px] h-12 rounded-xl border font-bold text-sm flex items-center justify-center transition-all ${
                                    isPicked
                                      ? "border-purple-600 bg-purple-600 text-white shadow-md scale-105"
                                      : "border-border hover:bg-muted/50 text-foreground"
                                  }`}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>

                          {(currentQuestion.scaleMinLabel || currentQuestion.scaleMaxLabel) && (
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                              <span>{currentQuestion.scaleMinLabel || `${min} (Lowest)`}</span>
                              <span>{currentQuestion.scaleMaxLabel || `${max} (Highest)`}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 4. NUMBER */}
                    {currentQuestion.type === "NUMBER" && (
                      <div className="pt-2">
                        <input
                          type="number"
                          value={val !== undefined ? val : ""}
                          onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                          placeholder="Enter a number..."
                          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                        />
                      </div>
                    )}

                    {/* 5. SHORT_TEXT */}
                    {currentQuestion.type === "SHORT_TEXT" && (
                      <div className="pt-2">
                        <input
                          type="text"
                          value={val !== undefined ? val : ""}
                          onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                          placeholder="Type your brief answer..."
                          maxLength={120}
                          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                        />
                        <span className="block text-right text-[10px] text-muted-foreground mt-1">
                          {(val || "").length} / 120 chars
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submission error message */}
                  {submitError && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                      {submitError}
                    </div>
                  )}

                  {/* Card Navigation Controls */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/60">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevCard}
                      disabled={activeCardIndex === 0}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                    </Button>

                    {activeCardIndex < currentStudy.questions.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={handleNextCard}
                        className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 px-5"
                      >
                        <span>Next Card</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleSubmitStudy}
                        disabled={isSubmitting}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 px-6"
                        data-testid="submit-tintok-responses-btn"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Responses"}
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Bottom Micro Indicator ── */}
      <div className="w-full max-w-xl text-center py-2 text-[11px] text-muted-foreground z-10">
        <span>TinTok Mobile Micro-Survey &bull; Tinat Health Research Protocol</span>
      </div>
    </div>
  );
}
