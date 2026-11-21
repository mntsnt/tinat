"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Stethoscope,
  Activity,
  Coins,
  MapPin,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet,
  Users,
  Clock,
  Play,
  RotateCcw,
  Check,
} from "lucide-react";
import { ButtonLink } from "../ui/Button";

interface FeaturedStudyData {
  id: string;
  title: string;
  category?: string | null;
  objective?: string | null;
  description?: string | null;
  rewardCredits: number;
  estimatedMinutes?: number | null;
  _count: {
    responses: number;
    questions: number;
  };
}

interface LandingHeroInteractiveProps {
  featuredStudy: FeaturedStudyData | null;
}

type RoleType = "researcher" | "participant" | "collector";

export function LandingHeroInteractive({ featuredStudy }: LandingHeroInteractiveProps) {
  const [role, setRole] = useState<RoleType>("researcher");
  const [cardMode, setCardMode] = useState<"live" | "demo">("live");

  // Interactive Demo State
  const [demoAnswer, setDemoAnswer] = useState<number | null>(null);
  const [demoStep, setDemoStep] = useState<1 | 2>(1);

  const demoOptions = [
    { id: 1, label: "Piped water / tap into dwelling", isSafe: true, code: "1" },
    { id: 2, label: "Protected community borehole or spring", isSafe: true, code: "2" },
    { id: 3, label: "Unprotected surface water (river / stream)", isSafe: false, code: "3" },
  ];

  const handleSelectDemoOption = (optionId: number) => {
    setDemoAnswer(optionId);
    setTimeout(() => {
      setDemoStep(2);
    }, 400);
  };

  const handleResetDemo = () => {
    setDemoAnswer(null);
    setDemoStep(1);
  };

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      {/* ── Left Column: Interactive Persona Switcher & Value Proposition ── */}
      <div className="relative z-10 space-y-6">
        {/* Role Switcher Pill Bar */}
        <div className="inline-flex p-1 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-2xs">
          <button
            type="button"
            onClick={() => setRole("researcher")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              role === "researcher"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Researchers &amp; Doctors
          </button>
          <button
            type="button"
            onClick={() => setRole("participant")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              role === "participant"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Participants
          </button>
          <button
            type="button"
            onClick={() => setRole("collector")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              role === "collector"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Field Enumerators
          </button>
        </div>

        {/* Dynamic Tag */}
        <div>
          {role === "researcher" && (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-300/20 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Stethoscope className="h-3.5 w-3.5" />
              Health Research &amp; Biostatistical Sampling
            </div>
          )}
          {role === "participant" && (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-300/20 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Coins className="h-3.5 w-3.5" />
              Earn Tinat Credits (TC) &bull; Verified Health Studies
            </div>
          )}
          {role === "collector" && (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-300/20 dark:bg-emerald-950/50 dark:text-emerald-300">
              <MapPin className="h-3.5 w-3.5" />
              Ground Field Enumerators &bull; Direct Cash in ETB
            </div>
          )}
        </div>

        {/* Dynamic Headline */}
        <h1 className="max-w-xl text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl text-foreground">
          {role === "researcher" && (
            <>
              Publish health studies.
              <br />
              <span className="text-emerald-700 dark:text-emerald-400">
                Collect reliable data.
              </span>
            </>
          )}
          {role === "participant" && (
            <>
              Shape medical research.
              <br />
              <span className="text-emerald-700 dark:text-emerald-400">
                Earn Tinat Credits.
              </span>
            </>
          )}
          {role === "collector" && (
            <>
              Conduct field surveys.
              <br />
              <span className="text-emerald-700 dark:text-emerald-400">
                Earn cash in Birr (ETB).
              </span>
            </>
          )}
        </h1>

        {/* Dynamic Description */}
        <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
          {role === "researcher" &&
            "Create questionnaires with skip logic and household rosters, reach participants across Ethiopia, and download clean data in SPSS, Excel, or CSV."}
          {role === "participant" &&
            "Participate in clinical and public health investigations from leading Ethiopian medical colleges. Completely confidential and rewarded with platform credits."}
          {role === "collector" &&
            "Conduct door-to-door community interviews for health institutions and research teams. Works offline with dynamic household rosters and instant ETB earnings."}
        </p>

        {/* Dynamic Action Buttons */}
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
          {role === "researcher" && (
            <>
              <ButtonLink
                href="/researcher/studies/new"
                size="lg"
                className="group h-12 w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 px-6 text-sm font-semibold shadow-md shadow-emerald-900/10 sm:w-auto dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                Publish a Study
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
              <ButtonLink
                href="/participant/studies"
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-xl border-border bg-card px-6 text-sm font-semibold hover:bg-muted sm:w-auto"
              >
                Browse Studies
              </ButtonLink>
            </>
          )}
          {role === "participant" && (
            <>
              <ButtonLink
                href="/participant/studies"
                size="lg"
                className="group h-12 w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 px-6 text-sm font-semibold shadow-md shadow-emerald-900/10 sm:w-auto dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                Browse Active Studies
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
              <ButtonLink
                href="/participant/wallet"
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-xl border-border bg-card px-6 text-sm font-semibold hover:bg-muted sm:w-auto"
              >
                View Credit Wallet
              </ButtonLink>
            </>
          )}
          {role === "collector" && (
            <>
              <ButtonLink
                href="/collector/dashboard"
                size="lg"
                className="group h-12 w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 px-6 text-sm font-semibold shadow-md shadow-emerald-900/10 sm:w-auto dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                Field Collector Portal
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
              <ButtonLink
                href="/participant/studies?type=FIELD_COLLECTION"
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-xl border-border bg-card px-6 text-sm font-semibold hover:bg-muted sm:w-auto"
              >
                Find Field Assignments
              </ButtonLink>
            </>
          )}
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
          {(role === "researcher"
            ? [
                "SPSS & Excel Direct Export",
                "Automated 95% CIs & Biostatistics",
                "Dynamic Household Rosters",
                "Multi-Language Questions",
                "Coded & Confidential Data",
              ]
            : role === "participant"
            ? [
                "Platform-Determined TC Rewards",
                "100% Anonymous & Confidential",
                "Verified Ethiopian Universities",
                "Mobile & Phone Friendly",
                "Community Health Impact",
              ]
            : [
                "Direct Cash Payouts in ETB",
                "Offline Survey Storage & Sync",
                "Audio Verbal Consent Recording",
                "Census Demographic Rosters",
                "Official Researcher Accreditation",
              ]
          ).map((feature) => (
            <span key={feature} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right Column: Dual Mode Card (Live Active Study ⟷ Interactive Demo) ── */}
      <div className="relative z-10">
        <div className="rounded-2xl border border-emerald-900/10 bg-card p-5 shadow-xl shadow-emerald-950/[0.05] sm:p-6 dark:border-emerald-100/10 transition-all">
          {/* Card Mode Header Bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setCardMode("live")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  cardMode === "live"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                <span>Live Active Study</span>
              </button>
              <button
                type="button"
                onClick={() => setCardMode("demo")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  cardMode === "demo"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                <span>Try Live Demo</span>
              </button>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
              Interactive Preview
            </span>
          </div>

          {/* Mode 1: Live Active Study */}
          {cardMode === "live" && (
            <div>
              {featuredStudy ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="rounded-xl border border-emerald-700/15 bg-emerald-50/50 p-4 dark:bg-emerald-950/20 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        {featuredStudy.category || "Public Health"}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {featuredStudy.rewardCredits > 0 ? `+${featuredStudy.rewardCredits} TC` : "Open Data"}
                      </span>
                    </div>
                    <p className="text-base font-semibold leading-snug text-foreground">
                      {featuredStudy.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {featuredStudy.objective || featuredStudy.description || "Healthcare research study collecting participant responses on Tinat."}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                      <p className="text-xl font-bold text-foreground">
                        {featuredStudy._count.responses}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        Responses
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                      <p className="text-xl font-bold text-foreground">
                        {featuredStudy._count.questions}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        Questions
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                        ~{featuredStudy.estimatedMinutes || 5} min
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        Est. Time
                      </p>
                    </div>
                  </div>

                  <ButtonLink
                    href={`/participant/studies/${featuredStudy.id}`}
                    variant="outline"
                    size="sm"
                    className="mt-1 w-full text-xs gap-1.5 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 dark:hover:bg-emerald-950/30"
                  >
                    View &amp; Answer Questionnaire <ArrowRight className="w-3.5 h-3.5" />
                  </ButtonLink>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <p className="text-sm font-semibold text-foreground">No active studies currently</p>
                  <p className="text-xs text-muted-foreground">Be the first to publish a health questionnaire.</p>
                  <ButtonLink href="/researcher/studies/new" size="sm" className="bg-emerald-700 text-white">
                    Create Study
                  </ButtonLink>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Interactive Micro-Survey Demo */}
          {cardMode === "demo" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {demoStep === 1 ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Step 1 of 2 &bull; Interactive Question Demo
                    </span>
                    <span className="text-[10px] text-muted-foreground">Click an option</span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-4 mb-3">
                    <p className="text-xs font-semibold text-foreground leading-snug">
                      &quot;In your household or local community, what is the primary source of drinking water?&quot;
                    </p>
                  </div>

                  <div className="space-y-2">
                    {demoOptions.map((opt) => {
                      const isSelected = demoAnswer === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectDemoOption(opt.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-500/10 font-bold text-foreground ring-2 ring-emerald-500/20"
                              : "border-border bg-card hover:border-emerald-500/40 hover:bg-muted/40 text-foreground/90 font-medium"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected ? (
                            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="h-3 w-3 rounded-full border border-muted-foreground/40 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Step 2: Instant Biostatistical Processing
                    </span>
                    <button
                      type="button"
                      onClick={handleResetDemo}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Try Again
                    </button>
                  </div>

                  {/* Logic Branch Notification Pill */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-foreground space-y-1">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {demoAnswer === 3
                        ? "Logic Trigger: Household Waterborne Roster Activated"
                        : "Logic Trigger: Advanced to Hygiene & Storage Module"}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {demoAnswer === 3
                        ? "Because surface water was selected, Tinat automatically un-hides follow-up clinical diarrhea indicators without manual intervention."
                        : "Safe water source detected. Skips redundant acute contamination sections and logs clean coded answer."}
                    </p>
                  </div>

                  {/* Live Coded Research Data Preview */}
                  <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase">
                      <span>SPSS / Excel Data Row</span>
                      <span className="text-emerald-600">Auto-Coded</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-muted/40 border border-border">
                        <span className="text-[10px] text-muted-foreground block">Variable</span>
                        <span className="font-mono font-bold text-foreground">water_src</span>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/40 border border-border">
                        <span className="text-[10px] text-muted-foreground block">Coded Val</span>
                        <span className="font-mono font-bold text-emerald-600">{demoAnswer}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/40 border border-border">
                        <span className="text-[10px] text-muted-foreground block">95% CI</span>
                        <span className="font-mono font-bold text-foreground">± 2.4%</span>
                      </div>
                    </div>
                  </div>

                  <ButtonLink
                    href="/participant/studies"
                    size="sm"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                  >
                    Explore Real Health Studies <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </ButtonLink>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
