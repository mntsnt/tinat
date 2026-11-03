"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Coins,
  Users,
  ShieldCheck,
  WifiOff,
  FileCheck2,
  Sparkles,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Database,
  Lock,
  Layers,
} from "lucide-react";

interface Feature {
  id: string;
  category: "collection" | "collaboration" | "governance" | "ai";
  badge: string;
  title: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
  link: string;
  linkLabel: string;
  architectureTag: string;
}

const FEATURES: Feature[] = [
  {
    id: "survey-studio",
    category: "collection",
    badge: "Form & Study Builder",
    title: "Questionnaire & Survey Studio",
    summary:
      "Design comprehensive, multi-step health questionnaires with single choice, Likert rating scales, matrix grids, date-time pickers, and skip logic.",
    icon: ClipboardCheck,
    highlights: [
      "Full Ethiopic typography (Noto Sans Ethiopic) for Ge'ez script",
      "Dynamic per-study multilingual translations (Amharic, Afaan Oromo, Tigrinya, Somali)",
      "Prefer-not-to-answer toggles on sensitive inquiries",
    ],
    link: "/forms/new",
    linkLabel: "Try Form Studio",
    architectureTag: "Study & Question Models",
  },
  {
    id: "credit-economy",
    category: "governance",
    badge: "Non-Cash Tokenomics",
    title: "Balanced Double-Entry Credit Economy",
    summary:
      "Compensate voluntary respondents fairly using non-monetary platform tokens (TC) backed by a mathematically balanced double-entry accounting ledger.",
    icon: Coins,
    highlights: [
      "Zero-cash design eliminates financial-regulatory and payout friction",
      "Atomic ledger entries prevent overdrafts and minting out of thin air",
      "Automated participant reward distribution upon valid study submission",
    ],
    link: "/participant/studies",
    linkLabel: "Explore Study Rewards",
    architectureTag: "LedgerJournal & LedgerEntry",
  },
  {
    id: "collaboration-hub",
    category: "collaboration",
    badge: "Team Science",
    title: "Collaborative Research Projects",
    summary:
      "A complete workspace for university research teams, hospital investigators, and NGOs to manage investigations from idea to publication.",
    icon: Users,
    highlights: [
      "6 granular team roles (Principal Investigator, Analyst, Assistant, Observer)",
      "Kanban milestone task tracking and real-time project chat",
      "Categorized file repository with versioning and audited decision logs",
    ],
    link: "/projects",
    linkLabel: "View Research Projects",
    architectureTag: "ResearchProject Hub",
  },
  {
    id: "identity-privacy",
    category: "governance",
    badge: "Proclamation 1321/2024",
    title: "National ID & Coded Privacy Linkage",
    summary:
      "Reduces duplicate accounts through Ethiopian National ID (Fayda) verification while keeping participant answers strictly separated via non-guessable respondent codes.",
    icon: ShieldCheck,
    highlights: [
      "Research answers are confidential and coded (pseudonymized), not anonymous",
      "Isolated participant link service prevents researchers from viewing PII",
      "Compliant with Ethiopian Personal Data Protection Proclamation 1321/2024",
    ],
    link: "/privacy",
    linkLabel: "Read Privacy Protocol",
    architectureTag: "ParticipantLink Isolation",
  },
  {
    id: "field-collector",
    category: "collection",
    badge: "Low-Bandwidth & Offline",
    title: "Field Data Enumerator Mode",
    summary:
      "Empower community health workers and field enumerators to gather survey answers in remote rural areas with intermittent or zero internet connectivity.",
    icon: WifiOff,
    highlights: [
      "Offline local draft storage with zero data loss during network disruptions",
      "Batch field enumeration sessions with timestamped sync",
      "Low-bandwidth mode budget under 15KB gzipped per survey",
    ],
    link: "/participant/studies",
    linkLabel: "Collector Framework",
    architectureTag: "StudyDataCollector Engine",
  },
  {
    id: "ethics-gate",
    category: "governance",
    badge: "IRB Adherence",
    title: "Ethics Approval (IRB) Clearance Gate",
    summary:
      "Enforces institutional review board approval before human-subject research can activate, coupled with transparent informed consent comprehension checks.",
    icon: FileCheck2,
    highlights: [
      "Mandatory unexpired committee approval document upload and verification",
      "3-step informed consent with mandatory comprehension validation",
      "Participant voluntary withdrawal and partial response deletion rights",
    ],
    link: "/charter",
    linkLabel: "Ethics Charter",
    architectureTag: "EthicsApproval & ConsentForm",
  },
  {
    id: "ai-assistant",
    category: "ai",
    badge: "AI Co-Pilot",
    title: "Tinat AI Research Assistant",
    summary:
      "Accelerate scientific discovery with an integrated research assistant that helps synthesize literature, formulate hypotheses, and draft questionnaires.",
    icon: Sparkles,
    highlights: [
      "Strict data privacy boundary with zero participant PII exposure",
      "Artifact generation for question schemas and statistical analysis plans",
      "Powered by Google Gemini with contextual research scoping",
    ],
    link: "/ai",
    linkLabel: "Launch Tinat AI",
    architectureTag: "AIConversation & Artifacts",
  },
  {
    id: "deidentified-export",
    category: "governance",
    badge: "Statistical Exports",
    title: "De-Identified Data Exports & Codebook",
    summary:
      "Export research results with automated de-identification safeguards including age banding, geographical generalization, and small-cell suppression.",
    icon: FileSpreadsheet,
    highlights: [
      "Small-cell suppression (<5 count) prevents re-identification in minority cohorts",
      "One-click multi-tab Excel (.xlsx) and CSV exports with auto-generated codebook",
      "Audited ActivityLog recording all researcher data exports",
    ],
    link: "/researcher/studies",
    linkLabel: "Export Framework",
    architectureTag: "Export De-Identification Engine",
  },
];

export function FeatureSnapshot() {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "collection" | "collaboration" | "governance" | "ai"
  >("all");

  const filteredFeatures =
    activeCategory === "all"
      ? FEATURES
      : FEATURES.filter((f) => f.category === activeCategory);

  return (
    <section id="features" className="relative z-10 py-20 lg:py-28 bg-muted/30 border-b border-border scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            Platform Capabilities Snapshot
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Built from the ground up for Ethiopian scientific research
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Every feature on Tinat is tailored to address real-world research challenges across Ethiopia: language inclusion, rural connectivity, participant privacy, and institutional compliance.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2" role="tablist">
          {[
            { id: "all", label: "All Capabilities" },
            { id: "collection", label: "Surveys & Field Data" },
            { id: "collaboration", label: "Team Collaboration" },
            { id: "governance", label: "Ethics, Credits & Privacy" },
            { id: "ai", label: "Tinat AI & Intelligence" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeCategory === tab.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {filteredFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {feat.summary}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {feat.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-foreground/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {feat.architectureTag}
                  </span>
                  <Link
                    href={feat.link}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    {feat.linkLabel} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
