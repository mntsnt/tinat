import { AcademyModule } from "../types";

export const module10: AcademyModule = {
  slug: "statistical-analysis-and-interpretation",
  number: 10,
  pathId: "advanced",
  title: "Statistical Analysis and Interpretation",
  subtitle: "Hypothesis Testing, P-Values, Confidence Intervals, Chi-Square, T-Tests, and Regression",
  duration: "3.5 Hours",
  status: "needs academic review",
  summary: "Execute inferential biostatistics with confidence. Formulate decision rules for p-values and confidence intervals, conduct independent t-tests, paired t-tests, Chi-square tests of independence, and interpret multivariable logistic regression models.",
  learningObjectives: [
    "Understand the theoretical foundations and empirical procedures governing statistical analysis and interpretation.",
    "Apply standardized scientific protocols to design and evaluate health research studies.",
    "Critically interpret analytical findings, identify common biases, and apply findings to clinical and public health priorities.",
    "Demonstrate methodological competence through interactive knowledge checks and practical assignments.",
  ],
  prerequisites: ["Completion of previous modules in the Tinat Academy sequence."],
  expectedOutcomes: [
    "Demonstrated proficiency in statistical analysis and interpretation in academic and field research contexts.",
    "Preparedness to apply these methodologies inside the Tinat Research Workspace.",
  ],
  glossary: [
    {
      term: "Statistical Analysis and Interpretation",
      definition: "Core scientific discipline and methodology in health science research.",
    },
    {
      term: "Internal Validity",
      definition: "The degree to which observed results can be attributed to the study intervention or exposure rather than flaws in methodology.",
    },
  ],
  resources: [
    {
      title: "Designing Clinical Research (5th Edition)",
      authorOrOrg: "Hulley SB et al. (Wolters Kluwer)",
      description: "Standard methodology manual for clinical investigators.",
      url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
      type: "book",
      isVerified: true,
    },
    {
      title: "Gordis Epidemiology (7th Edition)",
      authorOrOrg: "Celentano DD, Szklo M (Elsevier)",
      description: "Comprehensive textbook on epidemiology and disease frequency.",
      url: "https://www.us.elsevierhealth.com/gordis-epidemiology-9780323877756.html",
      type: "book",
      isVerified: true,
    },
  ],
  lessons: [
    {
      slug: "inferential-statistics-principles",
      moduleSlug: "statistical-analysis-and-interpretation",
      title: "The Logic of Hypothesis Testing: P-Values, Alpha, and Power",
      orderIndex: 1,
      readingTimeMinutes: 20,
      status: "needs academic review",
      learningObjectives: [
        "Explain the scientific principles underpinning the logic of hypothesis testing: p-values, alpha, and power.",
        "Apply best practices and recognize common pitfalls in observational and experimental research.",
      ],
      sections: [
        {
          id: "core-principles",
          title: "1. Scientific Principles & Methodological Foundations",
          content:
            "![Hypothesis Testing 2x2 Decision Matrix](/assets/academy/diagrams/diagram-hypothesis-errors-matrix.png \"Figure 10.1: Hypothesis Testing 2x2 Decision Matrix (Type I vs. Type II Errors)\")\n\nHypothesis testing uses sample data to determine whether to reject a null hypothesis ($H_0$). Because samples are subject to random sampling variability, investigators face two distinct types of statistical errors:\n\n* **Type I Error ($\\alpha$, False Positive):** Rejecting the null hypothesis when it is actually true in the population (e.g., claiming a drug works when it has no true effect). Typically capped at $\\alpha = 0.05$ (5%).\n* **Type II Error ($\\beta$, False Negative):** Failing to reject the null hypothesis when the alternative hypothesis is true (e.g., missing a real treatment benefit due to an inadequate sample size). Typically capped at $\\beta = 0.20$ (20%).\n* **Statistical Power ($1 - \\beta$):** The probability of correctly detecting a true effect when one exists, typically targeted at $\\ge 80\\%$ in health research protocols.\n* **P-Value:** The probability of obtaining results at least as extreme as those observed, assuming $H_0$ is true. A small p-value ($p < 0.05$) indicates that the observed data would be unlikely under the null hypothesis alone.\n\nInvestigators must ensure that data collection protocols, measurement instruments, and analytical strategies adhere strictly to international best practice standards while remaining responsive to local health system realities.",
          callout: {
            type: "key-idea",
            title: "Methodological Rigor",
            content:
              "Sound research design protects against bias, confounding, and random variation, ensuring that conclusions translate reliably into clinical practice and health policy.",
          },
        },
        {
          id: "practical-application",
          title: "2. Practical Application and Worked Field Scenarios",
          content:
            "When designing protocols in clinical or community health settings, researchers must anticipate challenges in participant recruitment, data completeness, cultural sensitivities, and logistical feasibility.\n\nStructured protocols, standardized operating procedures (SOPs), and pre-tested data collection instruments ensure high measurement fidelity across diverse field enumerators.",
          callout: {
            type: "ethiopian-case-study",
            title: "Ethiopian Field Context",
            content:
              "Studies conducted across regional referral hospitals and rural health centers must account for multilingual communities, seasonal transport accessibility, and local community leadership engagement.",
          },
        },
      ],
      toolIntegration: {
        type: "statistical-calculator",
        title: "Tinat Statistical Calculator",
        description: "Compute means, medians, standard deviations, confidence intervals, and odds ratios with live data inputs.",
        prefilledParams: { values: "12, 14, 15, 18, 22, 25, 29, 31" },
        ctaText: "Open Statistical Calculator",
        ctaHref: "/research-tools/statistical-calculator",
      },
      checkUnderstanding: [
        {
          id: "m10-l1-q1",
          question: "Which of the following is essential when conducting the logic of hypothesis testing: p-values, alpha, and power?",
          options: [
            "Following pre-specified, transparent scientific protocols and documenting all assumptions.",
            "Changing analytical hypotheses only after observing the final p-values.",
            "Omitting non-significant findings from the final report.",
            "Ignoring local ethical clearance if the study is self-funded.",
          ],
          correctIndex: 0,
          explanation: "Scientific integrity requires pre-specified protocols and transparent reporting of all outcomes.",
        },
      ],
      keyTakeaways: [
        "Rigorous methodology and pre-specified protocols protect against systematic bias.",
        "Local context and cultural appropriateness are as vital to study success as mathematical formulas.",
      ],
      references: [
        {
          id: "hulley-ref",
          citationText: "Hulley SB, Cummings SR, Browner WS, et al. Designing Clinical Research. 5th ed. Philadelphia: Wolters Kluwer; 2022.",
          url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
          isVerified: true,
        },
      ],
    },
    {
      slug: "parametric-and-nonparametric-tests",
      moduleSlug: "statistical-analysis-and-interpretation",
      title: "Selecting Bivariate Tests: Student's T-Test, Chi-Square, and ANOVA",
      orderIndex: 2,
      readingTimeMinutes: 20,
      status: "needs academic review",
      learningObjectives: [
        "Explain the scientific principles underpinning selecting bivariate tests: student's t-test, chi-square, and anova.",
        "Apply best practices and recognize common pitfalls in observational and experimental research.",
      ],
      sections: [
        {
          id: "core-principles",
          title: "1. Scientific Principles & Methodological Foundations",
          content:
            "A comprehensive study of selecting bivariate tests: student's t-test, chi-square, and anova is essential for conducting rigorous, reproducible health science in Ethiopia and across the African continent.\n\nInvestigators must ensure that data collection protocols, measurement instruments, and analytical strategies adhere strictly to international best practice standards while remaining responsive to local health system realities.",
          callout: {
            type: "key-idea",
            title: "Methodological Rigor",
            content:
              "Sound research design protects against bias, confounding, and random variation, ensuring that conclusions translate reliably into clinical practice and health policy.",
          },
        },
        {
          id: "practical-application",
          title: "2. Practical Application and Worked Field Scenarios",
          content:
            "When designing protocols in clinical or community health settings, researchers must anticipate challenges in participant recruitment, data completeness, cultural sensitivities, and logistical feasibility.\n\nStructured protocols, standardized operating procedures (SOPs), and pre-tested data collection instruments ensure high measurement fidelity across diverse field enumerators.",
          callout: {
            type: "ethiopian-case-study",
            title: "Ethiopian Field Context",
            content:
              "Studies conducted across regional referral hospitals and rural health centers must account for multilingual communities, seasonal transport accessibility, and local community leadership engagement.",
          },
        },
      ],
      toolIntegration: {
        type: "statistical-calculator",
        title: "Tinat Statistical Calculator",
        description: "Compute means, medians, standard deviations, confidence intervals, and odds ratios with live data inputs.",
        prefilledParams: { values: "12, 14, 15, 18, 22, 25, 29, 31" },
        ctaText: "Open Statistical Calculator",
        ctaHref: "/research-tools/statistical-calculator",
      },
      checkUnderstanding: [
        {
          id: "m10-l2-q1",
          question: "Which of the following is essential when conducting selecting bivariate tests: student's t-test, chi-square, and anova?",
          options: [
            "Following pre-specified, transparent scientific protocols and documenting all assumptions.",
            "Changing analytical hypotheses only after observing the final p-values.",
            "Omitting non-significant findings from the final report.",
            "Ignoring local ethical clearance if the study is self-funded.",
          ],
          correctIndex: 0,
          explanation: "Scientific integrity requires pre-specified protocols and transparent reporting of all outcomes.",
        },
      ],
      keyTakeaways: [
        "Rigorous methodology and pre-specified protocols protect against systematic bias.",
        "Local context and cultural appropriateness are as vital to study success as mathematical formulas.",
      ],
      references: [
        {
          id: "hulley-ref",
          citationText: "Hulley SB, Cummings SR, Browner WS, et al. Designing Clinical Research. 5th ed. Philadelphia: Wolters Kluwer; 2022.",
          url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
          isVerified: true,
        },
      ],
    },
    {
      slug: "multivariable-regression-models",
      moduleSlug: "statistical-analysis-and-interpretation",
      title: "Controlling for Confounders: Linear and Multivariable Logistic Regression",
      orderIndex: 3,
      readingTimeMinutes: 20,
      status: "needs academic review",
      learningObjectives: [
        "Explain the scientific principles underpinning controlling for confounders: linear and multivariable logistic regression.",
        "Apply best practices and recognize common pitfalls in observational and experimental research.",
      ],
      sections: [
        {
          id: "core-principles",
          title: "1. Scientific Principles & Methodological Foundations",
          content:
            "A comprehensive study of controlling for confounders: linear and multivariable logistic regression is essential for conducting rigorous, reproducible health science in Ethiopia and across the African continent.\n\nInvestigators must ensure that data collection protocols, measurement instruments, and analytical strategies adhere strictly to international best practice standards while remaining responsive to local health system realities.",
          callout: {
            type: "key-idea",
            title: "Methodological Rigor",
            content:
              "Sound research design protects against bias, confounding, and random variation, ensuring that conclusions translate reliably into clinical practice and health policy.",
          },
        },
        {
          id: "practical-application",
          title: "2. Practical Application and Worked Field Scenarios",
          content:
            "When designing protocols in clinical or community health settings, researchers must anticipate challenges in participant recruitment, data completeness, cultural sensitivities, and logistical feasibility.\n\nStructured protocols, standardized operating procedures (SOPs), and pre-tested data collection instruments ensure high measurement fidelity across diverse field enumerators.",
          callout: {
            type: "ethiopian-case-study",
            title: "Ethiopian Field Context",
            content:
              "Studies conducted across regional referral hospitals and rural health centers must account for multilingual communities, seasonal transport accessibility, and local community leadership engagement.",
          },
        },
      ],
      toolIntegration: {
        type: "statistical-calculator",
        title: "Tinat Statistical Calculator",
        description: "Compute means, medians, standard deviations, confidence intervals, and odds ratios with live data inputs.",
        prefilledParams: { values: "12, 14, 15, 18, 22, 25, 29, 31" },
        ctaText: "Open Statistical Calculator",
        ctaHref: "/research-tools/statistical-calculator",
      },
      checkUnderstanding: [
        {
          id: "m10-l3-q1",
          question: "Which of the following is essential when conducting controlling for confounders: linear and multivariable logistic regression?",
          options: [
            "Following pre-specified, transparent scientific protocols and documenting all assumptions.",
            "Changing analytical hypotheses only after observing the final p-values.",
            "Omitting non-significant findings from the final report.",
            "Ignoring local ethical clearance if the study is self-funded.",
          ],
          correctIndex: 0,
          explanation: "Scientific integrity requires pre-specified protocols and transparent reporting of all outcomes.",
        },
      ],
      keyTakeaways: [
        "Rigorous methodology and pre-specified protocols protect against systematic bias.",
        "Local context and cultural appropriateness are as vital to study success as mathematical formulas.",
      ],
      references: [
        {
          id: "hulley-ref",
          citationText: "Hulley SB, Cummings SR, Browner WS, et al. Designing Clinical Research. 5th ed. Philadelphia: Wolters Kluwer; 2022.",
          url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
          isVerified: true,
        },
      ],
    },
  ],
  quiz: {
    moduleSlug: "statistical-analysis-and-interpretation",
    title: "Module 10 Mastery Assessment: Statistical Analysis and Interpretation",
    passPercentage: 70,
    displayCount: 10,
    questionBank: [
      {
        id: "m10-q01",
        type: "single-choice",
        topicTag: "Statistical Analysis and Interpretation",
        question: "What is the primary scientific purpose of statistical analysis and interpretation?",
        options: [
          { id: "opt-a", text: "To produce robust, reproducible empirical evidence that advances human health and patient care.", isCorrect: true, explanation: "Correct. The overarching purpose is generating reliable scientific knowledge." },
          { id: "opt-b", text: "To guarantee that all study results achieve p-values below 0.001.", isCorrect: false, explanation: "Incorrect. P-values reflect sample data; they are not the purpose of science." },
          { id: "opt-c", text: "To replace formal Institutional Review Board oversight.", isCorrect: false, explanation: "Incorrect." },
          { id: "opt-d", text: "To eliminate the need for sample size planning.", isCorrect: false, explanation: "Incorrect." },
        ],
        explanation: "Health research seeks to generate valid, reproducible knowledge that improves human health.",
      },
      {
        id: "m10-q02",
        type: "true-false-justification",
        topicTag: "Scientific Rigor",
        question: "True or False: In rigorous scientific research, all measurement instruments and analytical methods must be specified prior to data collection.",
        options: [
          { id: "opt-a", text: "True, because pre-specifying methods protects against post hoc data dredging and confirmation bias.", isCorrect: true, explanation: "Correct. Pre-registration and protocol specification prevent selective reporting." },
          { id: "opt-b", text: "False, because researchers should only choose statistical tests after seeing which ones yield significant results.", isCorrect: false, explanation: "Incorrect. This practice constitutes 'p-hacking' and invalidates scientific inference." },
        ],
        explanation: "Specifying protocols in advance is a cornerstone of reproducible biomedical science.",
      },
    ],
  },
  assignment: {
    id: "m10-assignment",
    moduleSlug: "statistical-analysis-and-interpretation",
    title: "Practical Assignment: Statistical Analysis and Interpretation",
    overview: "Apply the principles of statistical analysis and interpretation to a realistic Ethiopian public health scenario.",
    scenario: "You are tasked with developing a 400-word methodological concept section for a regional health research proposal in Ethiopia.",
    instructions: [
      "1. Define the specific methodological approach and justify your selection.",
      "2. Outline the step-by-step procedures to minimize bias and measurement error.",
      "3. Address local contextual factors (languages, logistics, ethical clearance).",
      "4. Submit your draft concept inside the Tinat Research Workspace.",
    ],
    deliverables: ["Methodological concept document submitted via Research Workspace."],
    rubric: [
      { criterion: "Methodological Soundness", points: 40, description: "Clear alignment between research question and chosen methods." },
      { criterion: "Contextual Grounding", points: 30, description: "Realistic adaptation to Ethiopian healthcare facilities and population." },
      { criterion: "Ethical & Quality Safeguards", points: 30, description: "Procedures to ensure data fidelity, privacy, and informed consent." },
    ],
    workspaceTemplateId: "CROSS_SECTIONAL",
  },
};
