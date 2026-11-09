"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Stethoscope,
  Users,
  MessageCircleQuestion,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface Feature {
  id: string;
  category: "all" | "forms" | "studies" | "tintok" | "projects" | "ask" | "ai";
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
    id: "tintok",
    category: "tintok",
    badge: "Micro-Studies",
    title: "TinTok Card-Format Micro-Surveys",
    summary:
      "Engage mobile and desktop respondents through quick, swipeable card-style micro-surveys (1–10 cards) with separate ethics governance, dedicated respondent codes, and rapid completion.",
    icon: Sparkles,
    highlights: [
      "Swipeable vertical feed designed for quick mobile completion (~2 mins)",
      "Independent datasets and distinct respondent tokens separating micro-study data",
      "Optional teaser links connecting micro-study respondents to full parent investigations",
    ],
    link: "/participant/tintok",
    linkLabel: "Explore TinTok",
    architectureTag: "TinTok Micro-Survey Engine",
  },
  {
    id: "tinat-forms",
    category: "forms",
    badge: "Form Studio",
    title: "Tinat Forms & Questionnaires",
    summary:
      "Design and publish dynamic questionnaires, feedback surveys, and observational checklists with single-choice, Likert scales, and skip logic.",
    icon: ClipboardCheck,
    highlights: [
      "Intuitive form builder with versatile question types",
      "Instant shareable links and mobile-ready response collection",
      "Real-time answer aggregations and clean Excel/CSV exports",
    ],
    link: "/forms/new",
    linkLabel: "Build a Form",
    architectureTag: "Form Studio Engine",
  },
  {
    id: "studies",
    category: "studies",
    badge: "Research Cohorts",
    title: "Studies & Participant Recruitment",
    summary:
      "Launch observational surveys and academic investigations with targeted participant cohorts, optional non-cash credit incentives (TC), or free participation.",
    icon: Stethoscope,
    highlights: [
      "Targeted demographic filters and participant capacity quotas",
      "Optional credit rewards (Tinat Credits) for higher response rates",
      "Real-time progress analytics and verified response verification",
    ],
    link: "/participant/studies",
    linkLabel: "Discover Studies",
    architectureTag: "Study & Cohort Framework",
  },
  {
    id: "research-projects",
    category: "projects",
    badge: "Team Science",
    title: "Collaborative Research Projects",
    summary:
      "Full-lifecycle collaborative workspaces for university faculties, hospitals, and NGO research teams to manage studies from proposal to publication.",
    icon: Users,
    highlights: [
      "6 granular team role tiers (PI, Co-Investigator, Analyst, Assistant)",
      "Milestone Kanban task tracking and real-time team chat",
      "Categorized file repository with version control and audited logs",
    ],
    link: "/projects",
    linkLabel: "Open Workspaces",
    architectureTag: "ResearchProject Hub",
  },
  {
    id: "tinat-ask",
    category: "ask",
    badge: "Confidential Q&A",
    title: "Tinat Ask & Visual Question Decks",
    summary:
      "Create your public or confidential Q&A page, receive honest questions from students or peers, and export sleek branded visual question cards for social sharing.",
    icon: MessageCircleQuestion,
    highlights: [
      "Personal public handle for honest inquiry and community questions",
      "One-click visual deck card exporter formatted for social media",
      "Audited responses with public and private answer workflows",
    ],
    link: "/ask",
    linkLabel: "Explore Tinat Ask",
    architectureTag: "Social Q&A Engine",
  },
  {
    id: "tinat-ai",
    category: "ai",
    badge: "Research Co-Pilot",
    title: "Tinat AI for Researchers",
    summary:
      "Accelerate scientific investigations with an intelligent research assistant that helps synthesize literature, formulate hypotheses, and draft questionnaires.",
    icon: Sparkles,
    highlights: [
      "Grounded querying on authorized study datasets without data exposure",
      "Automated drafting of questionnaire schemas and research protocols",
      "Context-aware scientific assistant powered by Google Gemini",
    ],
    link: "/ai",
    linkLabel: "Launch Tinat AI",
    architectureTag: "Gemini Intelligence Engine",
  },
];

export function FeatureSnapshot() {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "tintok" | "forms" | "studies" | "projects" | "ask" | "ai"
  >("all");

  const filteredFeatures =
    activeCategory === "all"
      ? FEATURES
      : FEATURES.filter(
          (f) =>
            f.category === activeCategory ||
            (activeCategory === "studies" && f.id === "tintok")
        );

  return (
    <section id="features" className="relative z-10 py-20 lg:py-28 bg-muted/20 border-b border-border scroll-mt-16 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            Core Capabilities
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Everything you need to conduct, collaborate, and share research
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            From flexible questionnaire design and participant cohorts to team workspaces, community Q&A, and AI research assistance.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2" role="tablist">
          {[
            { id: "all", label: "All Features" },
            { id: "tintok", label: "TinTok" },
            { id: "forms", label: "Tinat Forms" },
            { id: "studies", label: "Studies" },
            { id: "projects", label: "Research Projects" },
            { id: "ask", label: "Tinat Ask" },
            { id: "ai", label: "Tinat AI" },
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
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
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
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
