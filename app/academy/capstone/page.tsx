import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Calculator,
  CheckCircle2,
  FileText,
  FolderPlus,
  ShieldCheck,
  Layers,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { ButtonLink } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";

export const metadata: Metadata = {
  title: "Guided Research Proposal Capstone | Tinat Academy",
  description:
    "A structured, end-to-end framework to draft, validate, and launch your medical or public health research proposal using the Tinat Research Workspace.",
};

const capstoneSections = [
  {
    step: 1,
    title: "Executive Title & Problem Statement",
    description:
      "Synthesize the health burden, epidemiological significance in Ethiopia/Africa, and the knowledge gap your study addresses.",
    checklist: [
      "Title adheres to PICOT format (Population, Intervention/Exposure, Comparator, Outcome, Timing)",
      "Background establishes global, regional (Sub-Saharan Africa), and national (Ethiopia) burden",
      "Identifies specific knowledge or operational gaps not resolved by previous studies",
      "Explicitly defines primary and secondary objectives",
    ],
    toolIntegration: {
      label: "Open Research Workspace",
      href: "/projects/new",
      description: "Initialize your project repository to organize literature and protocols.",
    },
  },
  {
    step: 2,
    title: "Conceptual Framework & Literature Synthesis",
    description:
      "Map out the hypothesized relationships between independent, confounding, mediating, and dependent variables.",
    checklist: [
      "Literature matrix compiled with verified Vancouver/PubMed citations",
      "Clear graphical or schematic conceptual framework diagram",
      "Operational definitions established for all core variables",
    ],
  },
  {
    step: 3,
    title: "Study Design & Sampling Strategy",
    description:
      "Select an appropriate epidemiological design and calculate rigorous statistical sample size requirements.",
    checklist: [
      "Justification for study design (cross-sectional, cohort, case-control, or pragmatic trial)",
      "Target population, source population, and study population delineated",
      "Inclusion and exclusion criteria unambiguously stated",
      "Sample size calculated using appropriate formula with 95% CI and power >= 80%",
      "Adjustment for finite population, design effect (if clustered), and non-response rate",
    ],
    toolIntegration: {
      label: "Tinat Sample Size Calculator",
      href: "/academy/sampling-sample-size/single-proportion",
      description: "Test sample size parameters with real-time statistical power outputs.",
    },
  },
  {
    step: 4,
    title: "Data Collection Instrument & Quality Assurance",
    description:
      "Draft structured questionnaires, clinical checklists, or lab record extraction templates with pre-testing protocols.",
    checklist: [
      "Instrument translated and back-translated into local languages (e.g. Amharic, Afaan Oromoo)",
      "Pre-test planned on 5% of sample size in a comparable non-study facility",
      "Collector training curriculum, daily debriefing, and supervision protocol documented",
      "Data entry validation rules, constraints, and double-entry auditing specified",
    ],
    toolIntegration: {
      label: "Tinat Form Builder",
      href: "/forms",
      description: "Build digital data collection forms with conditional logic and mobile field sync.",
    },
  },
  {
    step: 5,
    title: "Statistical Analysis & Reporting Plan",
    description:
      "Define statistical models, handling of missing data, and adherence to international EQUATOR reporting guidelines.",
    checklist: [
      "Descriptive statistics: frequencies/proportions for categorical; mean ± SD or median (IQR) for continuous",
      "Bivariable analysis: Chi-square test, Fisher's exact test, or independent t-test (p < 0.20 or 0.25 threshold)",
      "Multivariable modeling: Multivariable logistic/linear/Cox regression checking for multicollinearity (VIF < 5)",
      "Model fitness tests (e.g., Hosmer-Lemeshow goodness-of-fit)",
      "Target reporting guideline identified (STROBE, CONSORT, PRISMA)",
    ],
    toolIntegration: {
      label: "Tinat Statistical Calculator",
      href: "/academy/biostatistics-foundations/measures-central-tendency",
      description: "Explore hypothesis testing, confidence intervals, and effect estimates.",
    },
  },
  {
    step: 6,
    title: "Ethics, Informed Consent & Dissemination",
    description:
      "Ensure adherence to the Declaration of Helsinki, CIOMS guidelines, and national IRB requirements.",
    checklist: [
      "Participant information sheet written in plain local language at an accessible reading level",
      "Explicit statement of voluntary participation and right to withdraw without clinical penalty",
      "Assent procedures for minors (under 18 years) with parental/guardian informed consent",
      "Data confidentiality: de-identification, encrypted cloud storage, and role-based access",
      "Plan for dissemination to local health bureaus, study facilities, and open-access peer review",
    ],
  },
];

export default function CapstonePage() {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Capstone Hero Header */}
      <section className="border-b border-border bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 px-4 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
              ACADEMY CAPSTONE
            </Badge>
            <span className="text-xs text-emerald-200/70 font-medium">
              Applied Health Research Proposal
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl">
            From Learning to Research: Guided Proposal Capstone
          </h1>

          <p className="mt-4 max-w-2xl text-base sm:text-lg text-emerald-100/80 leading-relaxed">
            Transition from coursework to professional health research. Follow this step-by-step master proposal blueprint to design a rigorous, IRB-ready protocol ready for immediate deployment in the Tinat Research Workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink
              href="/projects/new"
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950/50"
            >
              <FolderPlus className="h-4 w-4" /> Start Proposal in Workspace
            </ButtonLink>
            <ButtonLink
              href="/academy"
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              Browse All Modules
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Main Capstone Blueprint */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Master Protocol Checklist & Integration Guide
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Follow these 6 stages to assemble a complete grant and ethical review proposal.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {capstoneSections.map((sec) => (
            <Card key={sec.step} className="border-border/70 overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    STAGE {sec.step} OF 6
                  </span>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    Self-Directed Milestone
                  </Badge>
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-foreground mt-1">
                  {sec.title}
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {sec.description}
                </p>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Essential Protocol Components
                  </h4>
                  <ul className="space-y-2.5">
                    {sec.checklist.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {sec.toolIntegration && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Integrated Tinat Tool
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sec.toolIntegration.description}
                      </p>
                    </div>
                    <ButtonLink
                      href={sec.toolIntegration.href}
                      size="sm"
                      className="shrink-0 gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs"
                    >
                      {sec.toolIntegration.label} <ExternalLink className="h-3 w-3" />
                    </ButtonLink>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Callout */}
        <div className="mt-12 rounded-2xl border border-border bg-card p-8 sm:p-10 text-center shadow-lg">
          <div className="mx-auto rounded-full bg-emerald-500/10 p-3 w-fit text-emerald-600 mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            Ready to Build Your Proposal?
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Create a dedicated research project in Tinat Workspace. Manage collaborators, attach literature citations, generate sampling calculations, and deploy mobile forms all in one unified platform.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink
              href="/projects/new"
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5"
            >
              <FolderPlus className="h-4 w-4" /> Initialize Project in Workspace
            </ButtonLink>
            <ButtonLink href="/academy" variant="outline" className="gap-2">
              Back to Academy
            </ButtonLink>
          </div>
        </div>
      </main>
    </div>
  );
}
