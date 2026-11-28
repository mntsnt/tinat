import { AcademyModule } from "../types";

export const module2: AcademyModule = {
  slug: "research-questions-and-hypotheses",
  number: 2,
  pathId: "beginner",
  title: "Developing Research Questions and Hypotheses",
  subtitle: "PICO, PECO, FINER Criteria, and Constructing Testable Hypotheses",
  duration: "3 Hours",
  status: "needs academic review",
  summary:
    "Transform broad clinical or public health curiosities into structured, answerable, and feasible research questions. Master the PICO and PECO frameworks for clinical and observational inquiries, apply the FINER feasibility criteria, formulate directional and null hypotheses, and construct conceptual frameworks.",
  learningObjectives: [
    "Deconstruct research topics using PICO (Population, Intervention, Comparison, Outcome) and PECO (Exposure) frameworks.",
    "Evaluate question feasibility, interest, novelty, ethics, and relevance using the FINER criteria.",
    "Formulate testable null ($H_0$) and alternative ($H_1$) hypotheses.",
    "Distinguish between primary and secondary research questions and map them to measurable study variables.",
  ],
  prerequisites: ["Completion of Module 1: Introduction to Health Research."],
  expectedOutcomes: [
    "Ability to write a flawless, structured PICO question for clinical trials or PECO question for observational epidemiology.",
    "Skill in assessing financial, sample size, and timeline feasibility before submitting study proposals.",
  ],
  glossary: [
    {
      term: "PICO",
      definition: "A framework for structuring research questions: Population, Intervention, Comparison, Outcome.",
    },
    {
      term: "FINER Criteria",
      definition: "A feasibility heuristic: Feasible, Interesting, Novel, Ethical, Relevant.",
    },
    {
      term: "Null Hypothesis (H0)",
      definition: "The default assumption that there is no true difference, association, or effect between study groups in the population.",
    },
  ],
  resources: [
    {
      title: "Designing Clinical Research (Chapter 2: Conceiving the Research Question)",
      authorOrOrg: "Hulley SB et al. (Wolters Kluwer)",
      description: "Comprehensive guide to developing research questions and FINER appraisal.",
      url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
      type: "book",
      isVerified: true,
    },
  ],
  lessons: [
    {
      slug: "framing-with-pico-and-peco",
      moduleSlug: "research-questions-and-hypotheses",
      title: "Framing Clinical and Epidemiological Questions: PICO, PECO, and PICo",
      orderIndex: 1,
      readingTimeMinutes: 18,
      status: "needs academic review",
      learningObjectives: [
        "Deconstruct intervention questions using PICO and exposure questions using PECO.",
        "Apply PICo for qualitative phenomena of interest.",
      ],
      sections: [
        {
          id: "pico-framework",
          title: "1. The PICO and PECO Architecture",
          content:
            "![The PICO and PECO Clinical Research Framework](/assets/academy/diagrams/diagram-pico-framework.png \"Figure 2.1: The PICO / PECO Framework Architecture\")\n\nA well-structured research question acts as the compass for the entire study protocol. Without a clear question, sample size calculations are impossible, eligibility criteria become arbitrary, and data analysis drifts into unguided 'data dredging'.\n\n* **P (Population / Patient):** Who are the subjects? (e.g., 'Adults aged 18–65 with confirmed Type 2 Diabetes residing in Addis Ababa').\n* **I / E (Intervention / Exposure):** What is the experimental drug, procedure, or environmental exposure? (e.g., 'Twice-weekly nurse-led mobile SMS adherence reminders').\n* **C (Comparison / Control):** What is the alternative? (e.g., 'Standard routine clinic follow-up counseling alone').\n* **O (Outcome):** What is the specific clinical, laboratory, or behavioral endpoint? (e.g., 'Mean reduction in Glycated Hemoglobin [HbA1c] at 6 months').",
          callout: {
            type: "worked-example",
            title: "Worked Example: From Vague Concern to PICO Question",
            content:
              "**Vague:** 'Does telemedicine work for rural clinics?'\n\n**Structured PICO:** 'Among adult patients with newly diagnosed uncomplicated hypertension attending primary health centers in Arsi Zone (P), does weekly tele-consultation by a physician (I) compared to routine health officer management (C) achieve higher rates of blood pressure control (<140/90 mmHg) at 6 months (O)?'",
          },
        },
      ],
      checkUnderstanding: [
        {
          id: "m2-l1-q1",
          question: "In the PECO framework for observational epidemiology, what does 'E' substitute for?",
          options: ["Evaluation", "Exposure (instead of an assigned experimental Intervention)", "Ethics", "Eligibility"],
          correctIndex: 1,
          explanation: "In observational research, the investigator does not assign an intervention; they observe an existing Exposure.",
        },
      ],
      keyTakeaways: [
        "PICO guides intervention trials; PECO guides observational exposures; PICo guides qualitative inquiry.",
        "Every element of PICO directly dictates eligibility criteria, intervention delivery, and statistical endpoints.",
      ],
      references: [
        {
          id: "hulley-ch2",
          citationText: "Hulley SB et al. Designing Clinical Research. 5th ed. 2022. Chapter 2; p. 15-28.",
          url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
          isVerified: true,
        },
      ],
    },
    {
      slug: "the-finer-criteria",
      moduleSlug: "research-questions-and-hypotheses",
      title: "Appraising Feasibility and Value: The FINER Criteria",
      orderIndex: 2,
      readingTimeMinutes: 16,
      status: "needs academic review",
      learningObjectives: [
        "Score research questions against Feasibility, Interest, Novelty, Ethics, and Relevance.",
        "Anticipate logistical barriers before launching field protocols.",
      ],
      sections: [
        {
          id: "finer-framework",
          title: "1. The Five FINER Pillars",
          content:
            "Before spending months drafting a 50-page protocol, every investigator must rigorously audit their question against the **FINER criteria**:\n\n* **F — Feasible:** Do you have the requisite sample size, clinical expertise, laboratory equipment, funding, and time?\n* **I — Interesting:** Does this question genuinely stimulate the scientific team and regional health decision-makers?\n* **N — Novel:** Does it contribute new knowledge, refute conflicting evidence, or adapt established global therapies to African populations?\n* **E — Ethical:** Does the protocol present acceptable risk-benefit ratios to human subjects?\n* **R — Relevant:** Will the findings influence clinical practice, national treatment guidelines, or future scientific discovery?",
          callout: {
            type: "common-mistake",
            title: "The Fatal 'F' Failure",
            content:
              "The most common cause of abandoned master's theses and clinical trials is overestimating eligible participant numbers. If you calculate that you need 800 patients with a rare complication, but the local hospital only admits 15 per year, your study is not feasible.",
          },
        },
      ],
      checkUnderstanding: [
        {
          id: "m2-l2-q1",
          question: "Which of the FINER criteria is most directly threatened if a required laboratory test costs $200 per sample but the total grant budget is $1,000?",
          options: ["Novelty", "Feasibility", "Relevance", "Interest"],
          correctIndex: 1,
          explanation: "Inadequate financial resources directly invalidate study Feasibility.",
        },
      ],
      keyTakeaways: [
        "The FINER criteria prevent wasted effort on unanswerable or unfeasible research concepts.",
        "Feasibility must account for patient volume, equipment, budget, and local ethics requirements.",
      ],
      references: [
        {
          id: "cummings-finer",
          citationText: "Cummings SR et al. Conceiving the research question. Designing Clinical Research. 2022; p. 19-25.",
          url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
          isVerified: true,
        },
      ],
    },
    {
      slug: "formulating-testable-hypotheses",
      moduleSlug: "research-questions-and-hypotheses",
      title: "Constructing Testable Hypotheses and Conceptual Frameworks",
      orderIndex: 3,
      readingTimeMinutes: 18,
      status: "needs academic review",
      learningObjectives: [
        "State unambiguous null ($H_0$) and alternative ($H_1$) hypotheses.",
        "Distinguish directional (one-tailed) from non-directional (two-tailed) hypotheses.",
        "Draw an epidemiological conceptual framework connecting distal, intermediate, and proximate variables.",
      ],
      sections: [
        {
          id: "null-vs-alternative",
          title: "1. The Null and Alternative Hypotheses",
          content:
            "In inferential statistics, hypotheses are formal mathematical statements about population parameters:\n\n* **Null Hypothesis ($H_0$):** States that there is no true difference between groups, or no true association between exposure and outcome ($H_0: \\mu_1 = \\mu_2$ or $H_0: OR = 1.0$). Statistical tests determine whether empirical sample data provides sufficient evidence to reject $H_0$.\n* **Alternative Hypothesis ($H_1$):** States that a true difference or association exists ($H_1: \\mu_1 \\neq \\mu_2$).",
          callout: {
            type: "key-idea",
            title: "Hypotheses Must Precede Data Inspection",
            content:
              "Formulating a hypothesis *after* inspecting dataset correlations is scientific malpractice ('HARKing': Hypothesizing After Results are Known). Hypotheses must be documented in the pre-registered protocol.",
          },
        },
      ],
      checkUnderstanding: [
        {
          id: "m2-l3-q1",
          question: "Which of the following represents a properly formulated null hypothesis ($H_0$)?",
          options: [
            "Dietary salt intake significantly causes hypertension in Ethiopian adults.",
            "There is no difference in mean systolic blood pressure between adults adhering to a low-sodium diet and those consuming standard diets ($H_0: \\mu_1 = \\mu_2$).",
            "Low-sodium diet is definitely 100% better for everyone in Hawassa.",
            "Why do people with hypertension eat salty foods?",
          ],
          correctIndex: 1,
          explanation: "The null hypothesis explicitly states the absence of difference between population parameters.",
        },
      ],
      keyTakeaways: [
        "Null hypotheses ($H_0$) state no effect; statistical tests evaluate whether empirical evidence warrants rejecting $H_0$.",
        "Hypotheses must be stated a priori to protect against bias and p-hacking.",
      ],
      references: [
        {
          id: "altman-stats",
          citationText: "Altman DG. Practical Statistics for Medical Research. London: Chapman & Hall/CRC; 1991. Chapter 8: Comparing groups - continuous data; p. 179-228.",
          url: "https://www.routledge.com/Practical-Statistics-for-Medical-Research/Altman/p/book/9780412276309",
          isVerified: true,
        },
      ],
    },
  ],
  quiz: {
    moduleSlug: "research-questions-and-hypotheses",
    title: "Module 2 Mastery Assessment: Research Questions & Hypotheses",
    passPercentage: 70,
    displayCount: 10,
    questionBank: [
      {
        id: "m2-q01",
        type: "single-choice",
        topicTag: "PICO Framework",
        question: "In the PICO acronym, what does 'O' stand for?",
        options: [
          { id: "opt-a", text: "Outcome", isCorrect: true, explanation: "Correct. 'O' represents the primary clinical or epidemiological Outcome." },
          { id: "opt-b", text: "Observation", isCorrect: false, explanation: "Incorrect." },
          { id: "opt-c", text: "Objective", isCorrect: false, explanation: "Incorrect." },
          { id: "opt-d", text: "Operation", isCorrect: false, explanation: "Incorrect." },
        ],
        explanation: "PICO stands for Population, Intervention, Comparison, and Outcome.",
      },
      {
        id: "m2-q02",
        type: "single-choice",
        topicTag: "FINER Criteria",
        question: "A junior researcher proposes a study requiring 50,000 PET-CT scans across a rural woreda with no electricity grid. Which FINER criterion is violated?",
        options: [
          { id: "opt-a", text: "Feasibility", isCorrect: true, explanation: "Correct. Lack of electricity and technology renders the study physically unfeasible." },
          { id: "opt-b", text: "Novelty", isCorrect: false, explanation: "Incorrect." },
          { id: "opt-c", text: "Relevance", isCorrect: false, explanation: "Incorrect." },
          { id: "opt-d", text: "Interest", isCorrect: false, explanation: "Incorrect." },
        ],
        explanation: "Feasibility audits available equipment, logistics, budget, and time.",
      },
    ],
  },
  assignment: {
    id: "m2-assignment",
    moduleSlug: "research-questions-and-hypotheses",
    title: "Practical Assignment: Developing and Defending a PICO/PECO Question",
    overview: "Formulate a structured research question and testable hypothesis using the FINER framework.",
    scenario: "Choose an urgent health priority in Ethiopia (e.g. childhood stunting, maternal sepsis, diabetic foot ulcers). Draft a complete PICO/PECO table and write testable null and alternative hypotheses.",
    instructions: [
      "1. State the clinical problem in 100 words.",
      "2. Build a 4-part PICO or PECO table defining P, I/E, C, and O.",
      "3. State your formal Null Hypothesis ($H_0$) and Alternative Hypothesis ($H_1$).",
      "4. Write a 200-word FINER feasibility appraisal.",
    ],
    deliverables: ["PICO concept table with FINER appraisal submitted via Research Workspace."],
    rubric: [
      { criterion: "PICO Structure", points: 40, description: "All 4 components clearly articulated and measurable." },
      { criterion: "Hypothesis Rigor", points: 30, description: "H0 and H1 correctly stated with proper statistical direction." },
      { criterion: "FINER Feasibility", points: 30, description: "Honest evaluation of local resources and timeline." },
    ],
    workspaceTemplateId: "SURVEY",
  },
};
