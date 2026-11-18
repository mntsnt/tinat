"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-tinat",
    question: "What is Tinat and who is it designed for?",
    answer:
      "Tinat is an academic research platform purpose-built for Ethiopian universities, health researchers, clinicians, students, and NGOs. It provides end-to-end digital infrastructure to search ScholarXIV preprints, design multi-format questionnaires, recruit verified participant cohorts, deploy ground field enumerators, and manage collaborative research investigations under standardized ethical protocols.",
  },
  {
    id: "scholarxiv-integration",
    question: "How does ScholarXIV literature search help before making a study and during publication?",
    answer:
      "Tinat integrates directly with ScholarXIV to give researchers immediate access to millions of open-access arXiv preprints across medicine, machine learning, public health, and quantitative statistics. Before designing a study, researchers can explore prior findings, formulate evidence-grounded hypotheses, and pre-fill study rationale. When writing manuscripts for publication, researchers can generate 1-click citations in BibTeX, APA 7th, MLA 9th, and Chicago formats, and bookmark references directly to their collaborative project binders.",
  },
  {
    id: "credits-rewards-tc",
    question: "What are Tinat Credits (TC) and how are participant rewards determined?",
    answer:
      "Tinat Credits (TC) are internal platform tokens awarded to participants for their valuable time and research contribution. Researchers do not need to buy credits or set reward amounts—the platform automatically calculates and issues standardized TC upon study completion based algorithmically on survey duration (estimated minutes) and question depth. Participants can view their accumulated TC balance and contribution history in their personal Wallet.",
  },
  {
    id: "field-enumerators-rural",
    question: "How does Ground Field Collection work and how are enumerators paid in ETB?",
    answer:
      "In rural and low-connectivity communities where participants do not have smartphones, researchers can deploy trained Field Enumerators. Enumerators conduct in-person verbal interviews in local languages (Amharic, Afaan Oromo, Tigrinya, and Somali) and log responses using the platform's mobile-optimized interface. Unlike online participant TC rewards, field enumerators earn real compensation in Ethiopian Birr (ETB) based on agreed fixed or per-response rates, tracked in their dedicated Collector Wallet deck.",
  },
  {
    id: "free-to-publish",
    question: "Is it free for researchers to publish studies on Tinat?",
    answer:
      "Yes. Any verified researcher, faculty member, or university student can publish data collection studies at zero cost without any upfront credit deposits or platform hosting fees. Tinat provides the questionnaire builder, demographic filtering, automated TC reward distribution, and instant Excel/CSV data exports free of charge.",
  },
  {
    id: "collaboration-projects",
    question: "How can research teams collaborate on Tinat?",
    answer:
      "Tinat provides Collaborative Research Workspaces where multidisciplinary teams manage studies from proposal to publication. Workspaces support role-based permissions (Project Lead, Co-Investigator, Researcher, Data Analyst, Research Assistant, Advisor), milestone Kanban task boards with drag-and-drop workflows, categorized project literature binders, file repositories, and private team chat rooms.",
  },
  {
    id: "privacy-protection",
    question: "How is participant privacy and identity protected?",
    answer:
      "Research responses on Tinat are strictly confidential and coded (pseudonymized), adhering to Ethiopian Proclamation 1321/2024 data protection standards. When participants submit answers, responses are indexed exclusively by an unguessable Respondent Code. Researchers only receive coded datasets and never see personal identifiers such as names, phone numbers, or national ID details.",
  },
];

export function LandingFaq() {
  const [openId, setOpenId] = useState<string | null>("what-is-tinat");

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="relative z-10 py-20 lg:py-28 bg-muted/20 text-foreground border-b border-border scroll-mt-16 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            FAQ
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Everything you need to know about the platform, credits, and research ethics
          </p>
        </div>

        <div className="divide-y divide-border border-t border-b border-border pt-2">
          {FAQ_ITEMS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className="py-4">
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  className="w-full text-left flex items-start sm:items-center justify-between gap-4 py-2 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg transition-colors"
                >
                  <span
                    className={`text-sm sm:text-base font-medium transition-colors ${
                      isOpen
                        ? "text-emerald-600 dark:text-emerald-400 underline underline-offset-4 decoration-emerald-500 font-semibold"
                        : "text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 sm:mt-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : "group-hover:text-foreground"
                    }`}
                  />
                </button>

                <div
                  id={`faq-answer-${faq.id}`}
                  hidden={!isOpen}
                  className="pt-3 pb-2 text-xs sm:text-sm text-muted-foreground leading-relaxed pr-8"
                >
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
