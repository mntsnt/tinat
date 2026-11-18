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
    id: "who-can-publish",
    question: "Who can publish studies on Tinat?",
    answer:
      "Health researchers, university lecturers, medical doctors, and students can all publish studies. Creating an account and launching a questionnaire is free.",
  },
  {
    id: "publishing-cost",
    question: "How much does it cost to publish a study?",
    answer:
      "Publishing online studies is completely free. There are no fees or deposit requirements. Participants receive platform credits for their time, covered by Tinat.",
  },
  {
    id: "field-collection",
    question: "How does in-person field collection work?",
    answer:
      "If you need responses from rural areas, clinics, or people without smartphones, you can assign field enumerators. Enumerators interview participants in person using local languages (Amharic, Afaan Oromo, Tigrinya, Somali) and enter the responses. Enumerators are paid directly in Birr (ETB).",
  },
  {
    id: "download-data",
    question: "In what format can I download my data?",
    answer:
      "You can export your dataset anytime as an Excel (.xlsx) or CSV file. Responses are coded cleanly, ready to open in SPSS, Stata, R, or Excel.",
  },
  {
    id: "privacy-protection",
    question: "How is participant privacy protected?",
    answer:
      "Responses are anonymous and linked only to a random respondent code. Researchers receive coded datasets and never see participant names, phone numbers, or personal identifying information.",
  },
];

export function LandingFaq() {
  const [openId, setOpenId] = useState<string | null>("who-can-publish");

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="relative z-10 py-16 lg:py-20 bg-muted/20 text-foreground border-b border-border scroll-mt-16 transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-sm">
            Quick answers about publishing studies, collecting data, and privacy.
          </p>
        </div>

        <div className="divide-y divide-border border-t border-b border-border">
          {FAQ_ITEMS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className="py-4">
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  className="w-full text-left flex items-start sm:items-center justify-between gap-4 py-1 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg transition-colors"
                >
                  <span
                    className={`text-sm sm:text-base font-medium transition-colors ${
                      isOpen
                        ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                        : "text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 sm:mt-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-emerald-700 dark:text-emerald-400" : "group-hover:text-foreground"
                    }`}
                  />
                </button>

                <div
                  id={`faq-answer-${faq.id}`}
                  hidden={!isOpen}
                  className="pt-2 pb-1 text-sm text-muted-foreground leading-relaxed pr-6"
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
