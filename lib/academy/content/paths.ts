import { LearningPath } from "../types";

export const learningPaths: LearningPath[] = [
  {
    id: "beginner",
    title: "Foundations of Health Research",
    levelBadge: "BEGINNER • MODULES 1–4",
    subtitle: "From clinical curiosity to ethical research questions",
    description:
      "Master the fundamental grammar of health science: formulating answerable research questions using PICO/PECO/FINER, navigating biomedical literature databases (PubMed, MeSH), evaluating evidence pyramids, and adhering to international and Ethiopian ethics guidelines.",
    targetAudience:
      "Medical students, nursing officers, health officers, junior resident physicians, and novice public health researchers.",
    estimatedHours: "12–16 Hours",
    moduleSlugs: [
      "introduction-to-health-research",
      "research-questions-and-hypotheses",
      "literature-review-and-ebm",
      "research-ethics-and-informed-consent",
    ],
  },
  {
    id: "intermediate",
    title: "Methodology, Sampling & Quantitative Epidemiology",
    levelBadge: "INTERMEDIATE • MODULES 5–9",
    subtitle: "Study design, sample size determination, and disease frequency measurement",
    description:
      "Design rigorous scientific investigations: compare cross-sectional surveys, prospective cohorts, case-control studies, and clinical trials. Calculate exact statistical sample sizes with finite population corrections, craft validated questionnaires, and compute epidemiological measures of association.",
    targetAudience:
      "Masters of Public Health (MPH) candidates, clinical researchers, principal investigators, and field epidemiologists.",
    estimatedHours: "18–24 Hours",
    moduleSlugs: [
      "research-designs",
      "sampling-methods-and-sample-size",
      "questionnaire-and-instrument-development",
      "introduction-to-epidemiology",
      "introduction-to-biostatistics",
    ],
  },
  {
    id: "advanced",
    title: "Statistical Analysis, Qualitative Methods & Scientific Dissemination",
    levelBadge: "ADVANCED • MODULES 10–13 + CAPSTONE",
    subtitle: "Hypothesis testing, qualitative integration, reporting standards, and peer review",
    description:
      "Execute inferential biostatistical tests (t-tests, Chi-square, multivariable logistic regression), integrate qualitative focus groups and in-depth interviews, write publication-ready manuscripts following STROBE, CONSORT, and PRISMA statements, and navigate the peer-review process without falling prey to predatory journals.",
    targetAudience:
      "Senior investigators, doctoral fellows, academic faculty, and medical research directors.",
    estimatedHours: "20–28 Hours",
    moduleSlugs: [
      "statistical-analysis-and-interpretation",
      "qualitative-and-mixed-methods-research",
      "academic-writing-and-referencing",
      "research-reporting-guidelines",
    ],
  },
];
