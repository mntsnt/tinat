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
  BookOpen,
  MapPin,
  Coins,
} from "lucide-react";

interface Feature {
  id: string;
  category: "all" | "literature" | "studies" | "field" | "projects" | "forms" | "ask" | "ai";
  badge: string;
  title: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
  link: string;
  linkLabel: string;
}

const FEATURE_TABS: Array<{ id: Feature["category"]; label: string }> = [
  { id: "all", label: "All Capabilities" },
  { id: "literature", label: "ScholarXIV Literature" },
  { id: "studies", label: "Studies & TC Rewards" },
  { id: "field", label: "Field Collection (ETB)" },
  { id: "projects", label: "Research Projects" },
  { id: "forms", label: "Tinat Forms" },
  { id: "ask", label: "Tinat Ask" },
  { id: "ai", label: "Tinat AI" },
];

const FEATURES: Feature[] = [
  {
    id: "scholarxiv-literature",
    category: "literature",
    badge: "Preprint Search & Citations",
    title: "ScholarXIV Literature Discovery",
    summary:
      "Explore millions of arXiv open-access papers directly on Tinat. Ground your study proposals in empirical science, generate 1-click BibTeX/APA citations, and extract AI methodology suggestions.",
    icon: BookOpen,
    highlights: [
      "Full-text search across arXiv preprints, medicine, AI, and biostatistics",
      "Instant 1-click citation export in BibTeX, APA 7th, MLA 9th, and Chicago formats",
      "Direct paper bookmarking to research projects and 1-click study prefill",
    ],
    link: "/researcher/literature",
    linkLabel: "Search ScholarXIV",
  },
  {
    id: "studies",
    category: "studies",
    badge: "Digital Cohorts & TC",
    title: "Digital Data Collection & TC Rewards",
    summary:
      "Publish health studies, observational cohorts, and pilot surveys at zero cost. Tinat automatically issues standardized Tinat Credits (TC) to participants based on survey duration and question count.",
    icon: Stethoscope,
    highlights: [
      "Zero cost for researchers & students to publish data collection studies",
      "Platform-calculated Tinat Credits (TC) rewarding participant time and effort",
      "Standardized participant demographics and instant coded Excel/CSV dataset exports",
    ],
    link: "/participant/studies",
    linkLabel: "Explore Studies",
  },
  {
    id: "ground-field-collection",
    category: "field",
    badge: "Rural & In-Person Surveys",
    title: "Ground Field Collection & ETB Payouts",
    summary:
      "Overcome the digital divide by deploying trained field enumerators who conduct in-person verbal interviews in rural and low-smartphone communities, earning real compensation in Ethiopian Birr (ETB).",
    icon: MapPin,
    highlights: [
      "Offline-friendly mobile collection in Amharic, Afaan Oromo, Tigrinya, and Somali",
      "Direct compensation in Ethiopian Birr (ETB) with dedicated enumerator wallet tracking",
      "Verbal informed consent protocols adhering to Ethiopian research ethics",
    ],
    link: "/collector/dashboard",
    linkLabel: "Field Collection Hub",
  },
  {
    id: "research-projects",
    category: "projects",
    badge: "Team Science & Tasks",
    title: "Collaborative Research Workspaces",
    summary:
      "End-to-end project management for university departments, clinical teams, and cross-institutional investigators with role-based access, milestone tracking, and task Kanban boards.",
    icon: Users,
    highlights: [
      "Granular team role tiers (Lead, Co-Investigator, Analyst, Assistant, Viewer)",
      "Interactive Kanban task boards with status filtering and team assignment",
      "Centralized project literature reference binder and audited team chat rooms",
    ],
    link: "/projects",
    linkLabel: "Open Workspaces",
  },
  {
    id: "tinat-forms",
    category: "forms",
    badge: "Independent Form Studio",
    title: "Tinat Forms & Questionnaires",
    summary:
      "Build standalone dynamic surveys, event registrations, and clinical checklists with rating scales, matrix grids, date pickers, and instant public sharing links.",
    icon: ClipboardCheck,
    highlights: [
      "Versatile question types including single-choice, rating scales, and matrix grids",
      "Public response collection without mandatory participant registration",
      "Real-time answer aggregations, response analytics, and clean data exports",
    ],
    link: "/forms/new",
    linkLabel: "Build a Form",
  },
  {
    id: "tinat-ask",
    category: "ask",
    badge: "Public & Peer Q&A",
    title: "Tinat Ask & Visual Question Cards",
    summary:
      "Host your personal research Q&A portal, receive thoughtful questions from students or peers, and export sleek branded visual cards optimized for academic social sharing.",
    icon: MessageCircleQuestion,
    highlights: [
      "Custom public handle for academic inquiries, student guidance, and peer feedback",
      "Instant visual question deck exporter formatted for social and presentation sharing",
      "Controlled workflow supporting public answers or private direct correspondence",
    ],
    link: "/ask",
    linkLabel: "Explore Tinat Ask",
  },
  {
    id: "tinat-ai",
    category: "ai",
    badge: "Ethical Research Co-Pilot",
    title: "Tinat AI Scientific Assistant",
    summary:
      "Accelerate scientific workflows with multi-model AI (Google Gemini & NVIDIA) designed to draft questionnaire schemas, synthesize literature, and advise on Ethiopian field methodologies.",
    icon: Sparkles,
    highlights: [
      "Strict data protection under Ethiopian Proclamation 1321/2024 compliance",
      "Automated drafting of structured survey questions and research objectives",
      "Multi-model provider support with seamless contextual assistance",
    ],
    link: "/ai",
    linkLabel: "Launch Tinat AI",
  },
];

export function FeatureSnapshot() {
  const [activeCategory, setActiveCategory] = useState<Feature["category"]>("all");

  const filteredFeatures =
    activeCategory === "all"
      ? FEATURES
      : FEATURES.filter((f) => f.category === activeCategory);

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
        <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Filter platform features">
          {FEATURE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeCategory === tab.id}
              onClick={() => setActiveCategory(tab.id)}
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

                <div className="pt-4 border-t border-border flex items-center justify-end">
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
