import { AcademyModule } from "../types";

export const module5: AcademyModule = {
  slug: "research-designs",
  number: 5,
  pathId: "intermediate",
  title: "Research Designs: Observational & Experimental",
  subtitle: "Cross-Sectional Surveys, Cohort Studies, Case-Control Inquiries, and Randomized Trials",
  duration: "3.5 Hours",
  status: "needs academic review",
  summary: "Examine the architecture of observational and experimental study designs. Contrast the methodological trade-offs between cross-sectional surveys, prospective/retrospective cohorts, case-control studies, and randomized controlled trials (RCTs).",
  learningObjectives: [
    "Understand the theoretical foundations and empirical procedures governing research designs: observational & experimental.",
    "Apply standardized scientific protocols to design and evaluate health research studies.",
    "Critically interpret analytical findings, identify common biases, and apply findings to clinical and public health priorities.",
    "Demonstrate methodological competence through interactive knowledge checks and practical assignments.",
  ],
  prerequisites: ["Completion of previous modules in the Tinat Academy sequence."],
  expectedOutcomes: [
    "Demonstrated proficiency in research designs: observational & experimental in academic and field research contexts.",
    "Preparedness to apply these methodologies inside the Tinat Research Workspace.",
  ],
  glossary: [
    {
      term: "Research Designs",
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
      slug: "cross-sectional-surveys",
      moduleSlug: "research-designs",
      title: "Cross-Sectional Studies: Prevalence, Design, and Temporal Ambiguity",
      orderIndex: 1,
      readingTimeMinutes: 20,
      status: "needs academic review",
      learningObjectives: [
        "Explain the scientific principles underpinning cross-sectional studies: prevalence, design, and temporal ambiguity.",
        "Apply best practices and recognize common pitfalls in observational and experimental research.",
      ],
      sections: [
        {
          id: "core-principles",
          title: "1. Scientific Principles & Methodological Foundations",
          content:
            "A comprehensive study of cross-sectional studies: prevalence, design, and temporal ambiguity is essential for conducting rigorous, reproducible health science in Ethiopia and across the African continent.\n\nInvestigators must ensure that data collection protocols, measurement instruments, and analytical strategies adhere strictly to international best practice standards while remaining responsive to local health system realities.",
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

      checkUnderstanding: [
        {
          id: "m5-l1-q1",
          question: "Which of the following is essential when conducting cross-sectional studies: prevalence, design, and temporal ambiguity?",
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
      slug: "cohort-and-case-control",
      moduleSlug: "research-designs",
      title: "Cohort and Case-Control Studies: Incidence vs. Odds of Exposure",
      orderIndex: 2,
      readingTimeMinutes: 20,
      status: "needs academic review",
      learningObjectives: [
        "Explain the scientific principles underpinning cohort and case-control studies: incidence vs. odds of exposure.",
        "Apply best practices and recognize common pitfalls in observational and experimental research.",
      ],
      sections: [
        {
          id: "core-principles",
          title: "1. Scientific Principles & Methodological Foundations",
          content:
            "A comprehensive study of cohort and case-control studies: incidence vs. odds of exposure is essential for conducting rigorous, reproducible health science in Ethiopia and across the African continent.\n\nInvestigators must ensure that data collection protocols, measurement instruments, and analytical strategies adhere strictly to international best practice standards while remaining responsive to local health system realities.",
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

      checkUnderstanding: [
        {
          id: "m5-l2-q1",
          question: "Which of the following is essential when conducting cohort and case-control studies: incidence vs. odds of exposure?",
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
      slug: "randomized-controlled-trials",
      moduleSlug: "research-designs",
      title: "Randomized Controlled Trials: Randomization, Blinding, and Equipoise",
      orderIndex: 3,
      readingTimeMinutes: 20,
      status: "needs academic review",
      learningObjectives: [
        "Explain the scientific principles underpinning randomized controlled trials: randomization, blinding, and equipoise.",
        "Apply best practices and recognize common pitfalls in observational and experimental research.",
      ],
      sections: [
        {
          id: "core-principles",
          title: "1. Scientific Principles & Methodological Foundations",
          content:
            "A comprehensive study of randomized controlled trials: randomization, blinding, and equipoise is essential for conducting rigorous, reproducible health science in Ethiopia and across the African continent.\n\nInvestigators must ensure that data collection protocols, measurement instruments, and analytical strategies adhere strictly to international best practice standards while remaining responsive to local health system realities.",
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

      checkUnderstanding: [
        {
          id: "m5-l3-q1",
          question: "Which of the following is essential when conducting randomized controlled trials: randomization, blinding, and equipoise?",
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
    moduleSlug: "research-designs",
    title: "Module 5 Mastery Assessment: Research Designs: Observational & Experimental",
    passPercentage: 70,
    displayCount: 10,
    questionBank: [
      {
        id: "m5-q01",
        type: "single-choice",
        topicTag: "Research Designs",
        question: "What is the primary scientific purpose of research designs: observational & experimental?",
        options: [
          { id: "opt-a", text: "To produce robust, reproducible empirical evidence that advances human health and patient care.", isCorrect: true, explanation: "Correct. The overarching purpose is generating reliable scientific knowledge." },
          { id: "opt-b", text: "To guarantee that all study results achieve p-values below 0.001.", isCorrect: false, explanation: "Incorrect. P-values reflect sample data; they are not the purpose of science." },
          { id: "opt-c", text: "To replace formal Institutional Review Board oversight.", isCorrect: false, explanation: "Incorrect." },
          { id: "opt-d", text: "To eliminate the need for sample size planning.", isCorrect: false, explanation: "Incorrect." },
        ],
        explanation: "Health research seeks to generate valid, reproducible knowledge that improves human health.",
      },
      {
        id: "m5-q02",
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
    id: "m5-assignment",
    moduleSlug: "research-designs",
    title: "Practical Assignment: Research Designs: Observational & Experimental",
    overview: "Apply the principles of research designs: observational & experimental to a realistic Ethiopian public health scenario.",
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
