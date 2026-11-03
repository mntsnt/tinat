"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Search, ShieldCheck } from "lucide-react";

interface FaqItem {
  id: string;
  category: "general" | "credits" | "privacy" | "ethics" | "field";
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-tinat",
    category: "general",
    question: "What is Tinat and who is it designed for?",
    answer:
      "Tinat is an academic research platform purpose-built for Ethiopian universities, health researchers, clinicians, students, and NGOs. It provides digital infrastructure to design multi-format questionnaires, recruit verified participant cohorts, coordinate field enumerators, and manage collaborative research investigations under standardized ethical protocols.",
  },
  {
    id: "credits-not-money",
    category: "credits",
    question: "Do Tinat Credits (TC) have monetary value, and can they be converted into currency?",
    answer:
      "No. Tinat Credits (TC) are non-monetary platform tokens earned by participants for voluntary research participation. They have zero cash value, cannot be redeemed for fiat currency (such as Telebirr or bank transfers), cannot be transferred between users, and cannot be purchased with money. They operate within a closed, double-entry token economy to recognize contribution without financial-regulatory risk.",
  },
  {
    id: "privacy-proclamation",
    category: "privacy",
    question: "How is participant privacy protected under Ethiopian law?",
    answer:
      "Under the Ethiopian Personal Data Protection Proclamation No. 1321/2024, research responses are confidential and coded (pseudonymized), not anonymous. When you submit answers, they are tied to a randomly generated, unguessable Respondent Code that is completely isolated from your personal identity. Researchers and exported files receive only coded datasets and never see your name, phone number, email, or national ID details.",
  },
  {
    id: "ethics-irb-gate",
    category: "ethics",
    question: "Does my study require Institutional Review Board (IRB) ethics approval?",
    answer:
      "Yes. Any human-subject observational study or funded survey on Tinat requires verified approval from a recognized Institutional Review Board (IRB) or Ethics Committee (e.g., from an Ethiopian university, hospital, or regional health bureau). Researchers upload their clearance certificate, and studies cannot be activated until the ethics approval is verified by platform administrators.",
  },
  {
    id: "collaboration-projects",
    category: "general",
    question: "How can research teams collaborate on Tinat?",
    answer:
      "Tinat provides Collaborative Research Workspaces where multidisciplinary teams can collaborate across the full study lifecycle. Workspaces support 6 role tiers (Project Owner, Principal Investigator, Researcher, Data Analyst, Research Assistant, and Advisor), Kanban task boards, file repositories with version control, threaded discussion forums, and real-time team chat.",
  },
  {
    id: "offline-field-collection",
    category: "field",
    question: "How does data collection work in rural areas with poor connectivity?",
    answer:
      "Tinat features an integrated Field Enumerator mode and Low-Bandwidth Mode. Survey questionnaires automatically save progress locally in the browser or mobile storage on every answered question. If internet connection drops, enumerators can continue collecting responses offline without data loss, and sync their batch session once reconnected.",
  },
  {
    id: "language-support",
    category: "general",
    question: "What languages are supported on Tinat?",
    answer:
      "Tinat supports 5 major Ethiopian languages: English, Amharic (አማርኛ), Afaan Oromo, Tigrinya (ትግርኛ), and Somali (Af-Soomaali). The platform loads Google's Noto Sans Ethiopic font to guarantee native Ge'ez script typography, diacritics, and Ethiopic punctuation across web surveys, mobile devices, and data exports.",
  },
  {
    id: "free-vs-funded",
    category: "credits",
    question: "Is it free to publish research studies on Tinat?",
    answer:
      "Yes. Researchers, university students, and non-profits can publish Free Academic Forms at zero cost without any fees or credit requirements. For studies where researchers wish to provide incentives to voluntary participants, they can configure a Funded Study with non-cash Tinat Credits (TC) approved by platform administrators.",
  },
];

export function LandingFaq() {
  const [openId, setOpenId] = useState<string | null>("what-is-tinat");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="relative z-10 py-20 lg:py-28 bg-background border-b border-border scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions (FAQ)
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Everything you need to know about Tinat
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Clear, transparent answers about research participation, data confidentiality, non-cash credits, and institutional ethics.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions (e.g. privacy, credits, ethics, offline)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {[
              { id: "all", label: "All Questions" },
              { id: "general", label: "General & Platform" },
              { id: "credits", label: "Tinat Credits" },
              { id: "privacy", label: "Privacy & Data" },
              { id: "ethics", label: "Ethics & IRB" },
              { id: "field", label: "Fieldwork & Offline" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-emerald-600 text-white"
                    : "bg-muted/50 border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3 pt-2">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all ${
                    isOpen
                      ? "border-emerald-500/40 bg-card shadow-sm"
                      : "border-border bg-card/60 hover:border-border/80"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl min-h-[48px]"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 mt-1"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No matching questions found for &ldquo;{searchQuery}&rdquo;.
            </div>
          )}
        </div>

        {/* Assistance / Contact Pill */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Have a specific research protocol or institutional question?{" "}
            <a href="mailto:contact@tinat.app" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Contact the Editorial Board &rarr;
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
