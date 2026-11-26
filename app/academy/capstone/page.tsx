import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, ExternalLink, FolderPlus } from "lucide-react";
import { ButtonLink } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { AcademyPageFrame } from "../components/AcademyPageFrame";

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
    <AcademyPageFrame
      backLink={{ href: "/academy", label: "All courses" }}
      eyebrow="Academy capstone"
      title="Research proposal capstone"
      description="Use this six-stage checklist to turn your research question into a complete, review-ready proposal."
      actions={
        <>
          <ButtonLink href="/projects/new" className="gap-2">
            <FolderPlus className="h-4 w-4" /> Start a research project
          </ButtonLink>
          <ButtonLink href="/academy" variant="outline">
            Browse courses
          </ButtonLink>
        </>
      }
      contentClassName="max-w-5xl space-y-8"
    >
        <section>
          <h2 className="text-xl font-semibold tracking-tight">Proposal checklist</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Work through each stage at your own pace.
          </p>
        </section>

        <div className="space-y-4">
          {capstoneSections.map((sec) => (
            <Card key={sec.step} className="overflow-hidden">
              <CardHeader className="border-b border-border pb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Stage {sec.step} of 6
                </span>
                <CardTitle className="mt-1 text-lg font-semibold text-foreground">
                  {sec.title}
                </CardTitle>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {sec.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-5 p-5">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4" /> Checklist
                  </h3>
                  <ul className="space-y-2.5">
                    {sec.checklist.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {sec.toolIntegration && (
                  <div className="flex flex-col justify-between gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {sec.toolIntegration.label}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {sec.toolIntegration.description}
                      </p>
                    </div>
                    <ButtonLink
                      href={sec.toolIntegration.href}
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                    >
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </ButtonLink>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="border-t border-border pt-5">
          <ButtonLink href="/projects/new" variant="outline" className="gap-2">
            <FolderPlus className="h-4 w-4" /> Start a research project
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
    </AcademyPageFrame>
  );
}
