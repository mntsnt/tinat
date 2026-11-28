import { AcademyModule } from "../types";

export const module3: AcademyModule = {
  slug: "literature-review-and-ebm",
  number: 3,
  pathId: "beginner",
  title: "Literature Review and Evidence-Based Medicine",
  subtitle: "Biomedical Databases, MeSH Terms, Boolean Logic, and Systematic Screening",
  duration: "3.5 Hours",
  status: "needs academic review",
  summary: "Master reproducible literature searches in PubMed, Hinari, and Google Scholar. Utilize Medical Subject Headings (MeSH), combine Boolean operators, screen citations with Rayyan, and organize libraries in Zotero.",
  learningObjectives: [
    "Understand the theoretical foundations and empirical procedures governing literature review and evidence-based medicine.",
    "Apply standardized scientific protocols to design and evaluate health research studies.",
    "Critically interpret analytical findings, identify common biases, and apply findings to clinical and public health priorities.",
    "Demonstrate methodological competence through interactive knowledge checks and practical assignments.",
  ],
  prerequisites: ["Completion of previous modules in the Tinat Academy sequence."],
  expectedOutcomes: [
    "Demonstrated proficiency in literature review and evidence-based medicine in academic and field research contexts.",
    "Preparedness to apply these methodologies inside the Tinat Research Workspace.",
  ],
  glossary: [
    {
      term: "Literature Review and Evidence-Based Medicine",
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
      slug: "search-strategy-and-boolean",
      moduleSlug: "literature-review-and-ebm",
      title: "Constructing Reproducible Search Strings with Boolean Logic",
      orderIndex: 1,
      readingTimeMinutes: 20,
      status: "needs academic review",
      learningObjectives: [
        "Explain the scientific principles underpinning constructing reproducible search strings with boolean logic.",
        "Apply best practices and recognize common pitfalls in observational and experimental research.",
      ],
      sections: [
        {
          id: "core-principles",
          title: "1. Scientific Principles & Methodological Foundations",
          content:
            "![Boolean Search Logic Venn Diagram](/assets/academy/diagrams/diagram-boolean-venn.png \"Figure 3.1: Boolean Search Logic Venn Diagram (AND, OR, NOT operations)\")\n\nA comprehensive study of constructing reproducible search strings with Boolean logic is essential for conducting rigorous, reproducible health science in biomedical databases (such as PubMed, Cochrane Library, and African Index Medicus).\n\nBoolean operators (`AND`, `OR`, `NOT`) define how search concepts intersect:\n* **AND (Intersection):** Narrows the search by requiring all terms to appear (e.g., *Malaria* AND *Pregnancy*).\n* **OR (Union):** Broadens the search to capture synonyms and related terms (e.g., *Tuberculosis* OR *TB* OR *Mycobacterium*).\n* **NOT (Exclusion):** Removes unwanted populations or study types, though it must be used cautiously to avoid inadvertently excluding relevant records.\n\nInvestigators must ensure that data collection protocols, measurement instruments, and analytical strategies adhere strictly to international best practice standards while remaining responsive to local health system realities.",
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
          id: "m3-l1-q1",
          question: "Which of the following is essential when conducting constructing reproducible search strings with boolean logic?",
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
      slug: "pubmed-and-mesh-terms",
      moduleSlug: "literature-review-and-ebm",
      title: "Mastering PubMed and Medical Subject Headings (MeSH)",
      orderIndex: 2,
      readingTimeMinutes: 20,
      status: "needs academic review",
      learningObjectives: [
        "Explain the scientific principles underpinning mastering pubmed and medical subject headings (mesh).",
        "Apply best practices and recognize common pitfalls in observational and experimental research.",
      ],
      sections: [
        {
          id: "core-principles",
          title: "1. Scientific Principles & Methodological Foundations",
          content:
            "A comprehensive study of mastering pubmed and medical subject headings (mesh) is essential for conducting rigorous, reproducible health science in Ethiopia and across the African continent.\n\nInvestigators must ensure that data collection protocols, measurement instruments, and analytical strategies adhere strictly to international best practice standards while remaining responsive to local health system realities.",
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
          id: "m3-l2-q1",
          question: "Which of the following is essential when conducting mastering pubmed and medical subject headings (mesh)?",
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
      slug: "critical-appraisal-of-evidence",
      moduleSlug: "literature-review-and-ebm",
      title: "Critically Appraising Biomedical Literature and Evidence Pyramids",
      orderIndex: 3,
      readingTimeMinutes: 20,
      status: "needs academic review",
      learningObjectives: [
        "Explain the scientific principles underpinning critically appraising biomedical literature and evidence pyramids.",
        "Apply best practices and recognize common pitfalls in observational and experimental research.",
      ],
      sections: [
        {
          id: "core-principles",
          title: "1. Scientific Principles & Methodological Foundations",
          content:
            "A comprehensive study of critically appraising biomedical literature and evidence pyramids is essential for conducting rigorous, reproducible health science in Ethiopia and across the African continent.\n\nInvestigators must ensure that data collection protocols, measurement instruments, and analytical strategies adhere strictly to international best practice standards while remaining responsive to local health system realities.",
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
          id: "m3-l3-q1",
          question: "Which of the following is essential when conducting critically appraising biomedical literature and evidence pyramids?",
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
    moduleSlug: "literature-review-and-ebm",
    title: "Module 3 Mastery Assessment: Literature Review and Evidence-Based Medicine",
    passPercentage: 70,
    displayCount: 10,
    questionBank: [
      {
        id: "m3-q01",
        type: "single-choice",
        topicTag: "Literature Review and Evidence-Based Medicine",
        question: "What is the primary scientific purpose of literature review and evidence-based medicine?",
        options: [
          { id: "opt-a", text: "To produce robust, reproducible empirical evidence that advances human health and patient care.", isCorrect: true, explanation: "Correct. The overarching purpose is generating reliable scientific knowledge." },
          { id: "opt-b", text: "To guarantee that all study results achieve p-values below 0.001.", isCorrect: false, explanation: "Incorrect. P-values reflect sample data; they are not the purpose of science." },
          { id: "opt-c", text: "To replace formal Institutional Review Board oversight.", isCorrect: false, explanation: "Incorrect." },
          { id: "opt-d", text: "To eliminate the need for sample size planning.", isCorrect: false, explanation: "Incorrect." },
        ],
        explanation: "Health research seeks to generate valid, reproducible knowledge that improves human health.",
      },
      {
        id: "m3-q02",
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
    id: "m3-assignment",
    moduleSlug: "literature-review-and-ebm",
    title: "Practical Assignment: Literature Review and Evidence-Based Medicine",
    overview: "Apply the principles of literature review and evidence-based medicine to a realistic Ethiopian public health scenario.",
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
