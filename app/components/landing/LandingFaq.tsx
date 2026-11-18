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
      "Tinat is an academic research platform purpose-built for Ethiopian universities, health researchers, clinicians, students, and NGOs. It provides digital infrastructure to design multi-format questionnaires, recruit verified participant cohorts, coordinate field enumerators, and manage collaborative research investigations under standardized ethical protocols.",
  },
  {
    id: "privacy-protection",
    question: "How is participant privacy and identity protected?",
    answer:
      "Research responses on Tinat are confidential and coded (pseudonymized), not anonymous. When you submit answers, they are tied to a randomly generated, unguessable Respondent Code that is completely isolated from your personal identity. Researchers and exported files receive only coded datasets and never see your name, phone number, email, or national ID details.",
  },
  {
    id: "collaboration-projects",
    question: "How can research teams collaborate on Tinat?",
    answer:
      "Tinat provides Collaborative Research Workspaces where multidisciplinary teams can collaborate across the full study lifecycle. Workspaces support 6 role tiers (Project Owner, Principal Investigator, Researcher, Data Analyst, Research Assistant, and Advisor), Kanban task boards, file repositories with version control, threaded discussion forums, and real-time team chat.",
  },
  {
    id: "field-enumerators-rural",
    question: "How does data collection work in rural areas where participants do not have smartphones?",
    answer:
      "Many individuals in rural communities do not own smartphones or have direct internet access. Tinat supports trained Field Enumerators and community researchers who conduct in-person interviews. The enumerator asks each participant the survey questions verbally in their local language and enters the responses into the platform, ensuring inclusive demographic and health research across all populations.",
  },
  {
    id: "free-vs-funded",
    question: "Is it free to publish research studies on Tinat?",
    answer:
      "Yes. Researchers, university students, and non-profits publish data collection studies at zero cost without any upfront credit deposits or platform fees. Tinat automatically issues standardized Tinat Credits (TC) to participants upon study completion. In addition, researchers can recruit and compensate on-the-ground field collectors in Ethiopian Birr (ETB) for in-person community interviews.",
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
