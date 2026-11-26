import os

content_dir = r"C:\Users\hp\Desktop\Tinat Project\Tinat\app\lib\academy\content"

modules_meta = [
    {
        "num": 3,
        "slug": "literature-review-and-ebm",
        "pathId": "beginner",
        "title": "Literature Review and Evidence-Based Medicine",
        "subtitle": "Biomedical Databases, MeSH Terms, Boolean Logic, and Systematic Screening",
        "summary": "Master reproducible literature searches in PubMed, Hinari, and Google Scholar. Utilize Medical Subject Headings (MeSH), combine Boolean operators, screen citations with Rayyan, and organize libraries in Zotero.",
        "lessons": [
            ("search-strategy-and-boolean", "Constructing Reproducible Search Strings with Boolean Logic"),
            ("pubmed-and-mesh-terms", "Mastering PubMed and Medical Subject Headings (MeSH)"),
            ("critical-appraisal-of-evidence", "Critically Appraising Biomedical Literature and Evidence Pyramids"),
        ],
        "calc": None,
    },
    {
        "num": 4,
        "slug": "research-ethics-and-informed-consent",
        "pathId": "beginner",
        "title": "Research Ethics and Informed Consent",
        "subtitle": "The Belmont Principles, Declaration of Helsinki, CIOMS, and Ethiopian NERC Regulations",
        "summary": "Navigate research ethics from the Nuremberg Code to contemporary bioethics. Explore informed consent in low-literacy populations, ethical protection for vulnerable groups, community assent, and the Ethiopian NERC regulatory framework.",
        "lessons": [
            ("bioethics-foundations", "From Nuremberg to Belmont: Foundations of Research Ethics"),
            ("informed-consent-in-practice", "Informed Consent Protocols in Low-Literacy and Rural Settings"),
            ("institutional-ethics-governance", "Navigating Institutional Review Boards (IRB) and NERC in Ethiopia"),
        ],
        "calc": None,
    },
    {
        "num": 5,
        "slug": "research-designs",
        "pathId": "intermediate",
        "title": "Research Designs: Observational & Experimental",
        "subtitle": "Cross-Sectional Surveys, Cohort Studies, Case-Control Inquiries, and Randomized Trials",
        "summary": "Examine the architecture of observational and experimental study designs. Contrast the methodological trade-offs between cross-sectional surveys, prospective/retrospective cohorts, case-control studies, and randomized controlled trials (RCTs).",
        "lessons": [
            ("cross-sectional-surveys", "Cross-Sectional Studies: Prevalence, Design, and Temporal Ambiguity"),
            ("cohort-and-case-control", "Cohort and Case-Control Studies: Incidence vs. Odds of Exposure"),
            ("randomized-controlled-trials", "Randomized Controlled Trials: Randomization, Blinding, and Equipoise"),
        ],
        "calc": None,
    },
    {
        "num": 6,
        "slug": "sampling-methods-and-sample-size",
        "pathId": "intermediate",
        "title": "Sampling Methods and Sample Size Determination",
        "subtitle": "Probability Sampling, Single Proportion Formulas, Design Effects, and Finite Corrections",
        "summary": "Calculate precise sample sizes for health surveys using single proportion, single mean, and comparative formulas. Explore simple random, stratified, cluster, and multi-stage sampling with finite population adjustments and design effects.",
        "lessons": [
            ("sampling-strategies", "Probability vs. Non-Probability Sampling in Field Epidemiology"),
            ("sample-size-formulas", "Sample Size Determination: Proportions, Margins of Error, and Power"),
            ("finite-correction-and-deff", "Adjusting for Finite Populations, Cluster Design Effects, and Non-Response"),
        ],
        "calc": "sample-size",
    },
    {
        "num": 7,
        "slug": "questionnaire-and-instrument-development",
        "pathId": "intermediate",
        "title": "Questionnaire and Data Collection Instrument Development",
        "subtitle": "Item Design, Psychometric Reliability, Skip Logic, and Digital Form Deployment",
        "summary": "Design valid and reliable questionnaires for epidemiological surveys. Master Likert scales, multi-item indices, skip logic rules, translation protocols, pilot testing, and deploying responsive digital forms in Tinat Forms.",
        "lessons": [
            ("instrument-design-principles", "Principles of Survey Question Design: Clarity, Bias, and Neutrality"),
            ("validity-and-reliability", "Assessing Content Validity, Construct Validity, and Reliability"),
            ("digital-form-deployment", "Building Dynamic Field Questionnaires with Skip Logic in Tinat Forms"),
        ],
        "calc": "tinat-forms",
    },
    {
        "num": 8,
        "slug": "introduction-to-epidemiology",
        "pathId": "intermediate",
        "title": "Introduction to Epidemiology",
        "subtitle": "Measures of Disease Frequency, Association, and Outbreak Investigation",
        "summary": "Quantify health and disease across human populations. Calculate incidence rates, cumulative incidence, point prevalence, risk ratios, odds ratios, and attributable fractions. Learn the step-by-step methodology for field outbreak investigations.",
        "lessons": [
            ("measures-of-disease-frequency", "Measuring Frequency: Prevalence, Cumulative Incidence, and Incidence Density"),
            ("measures-of-association", "Quantifying Risk: Risk Ratios, Odds Ratios, and Risk Differences"),
            ("outbreak-investigation-steps", "Field Outbreak Investigation: The 10-Step Epidemiological Playbook"),
        ],
        "calc": "statistical-calculator",
    },
    {
        "num": 9,
        "slug": "introduction-to-biostatistics",
        "pathId": "intermediate",
        "title": "Introduction to Biostatistics",
        "subtitle": "Data Types, Measures of Central Tendency, Dispersion, and the Normal Distribution",
        "summary": "Master the quantitative language of biomedical data. Classify nominal, ordinal, discrete, and continuous variables. Compute means, medians, modes, standard deviations, and interquartile ranges, and understand normal distribution properties.",
        "lessons": [
            ("variable-types-and-scales", "Data Classification: Categorical, Continuous, and Measurement Scales"),
            ("central-tendency-and-spread", "Measures of Central Tendency and Dispersion: Mean, Median, Variance, and SD"),
            ("normal-distribution-and-z-scores", "The Normal Curve, Standard Normal Deviates (Z-Scores), and Central Limit Theorem"),
        ],
        "calc": "statistical-calculator",
    },
    {
        "num": 10,
        "slug": "statistical-analysis-and-interpretation",
        "pathId": "advanced",
        "title": "Statistical Analysis and Interpretation",
        "subtitle": "Hypothesis Testing, P-Values, Confidence Intervals, Chi-Square, T-Tests, and Regression",
        "summary": "Execute inferential biostatistics with confidence. Formulate decision rules for p-values and confidence intervals, conduct independent t-tests, paired t-tests, Chi-square tests of independence, and interpret multivariable logistic regression models.",
        "lessons": [
            ("inferential-statistics-principles", "The Logic of Hypothesis Testing: P-Values, Alpha, and Power"),
            ("parametric-and-nonparametric-tests", "Selecting Bivariate Tests: Student's T-Test, Chi-Square, and ANOVA"),
            ("multivariable-regression-models", "Controlling for Confounders: Linear and Multivariable Logistic Regression"),
        ],
        "calc": "statistical-calculator",
    },
    {
        "num": 11,
        "slug": "qualitative-and-mixed-methods-research",
        "pathId": "advanced",
        "title": "Qualitative and Mixed Methods Research",
        "subtitle": "In-Depth Interviews, Focus Groups, Thematic Analysis, and Methodological Integration",
        "summary": "Explore human health behaviors, cultural beliefs, and lived illness experiences through qualitative inquiry. Design in-depth interview guides, facilitate focus group discussions (FGDs), perform inductive thematic analysis, and integrate mixed methods.",
        "lessons": [
            ("qualitative-paradigms", "The Qualitative Paradigm: Exploring Meaning, Process, and Context"),
            ("data-collection-methods", "Conducting In-Depth Interviews (IDIs) and Focus Group Discussions (FGDs)"),
            ("mixed-methods-integration", "Mixed Methods Research: Convergent, Sequential, and Explanatory Designs"),
        ],
        "calc": None,
    },
    {
        "num": 12,
        "slug": "academic-writing-and-referencing",
        "pathId": "advanced",
        "title": "Academic Writing and Referencing",
        "subtitle": "The IMRAD Structure, Scientific Dissemination, Vancouver Style, and Journal Selection",
        "summary": "Transform raw datasets into high-impact, peer-reviewed scientific publications. Master the IMRAD (Introduction, Methods, Results, and Discussion) architecture, craft compelling abstracts, apply Vancouver and APA reference formatting, and avoid predatory journals.",
        "lessons": [
            ("the-imrad-architecture", "The Anatomy of a Scientific Paper: The IMRAD Architecture"),
            ("crafting-abstracts-and-titles", "Writing High-Impact Abstracts, Titles, and Clear Medical Prose"),
            ("peer-review-and-journal-selection", "Navigating Peer Review, Editorial Revisions, and Avoiding Predatory Publishers"),
        ],
        "calc": None,
    },
    {
        "num": 13,
        "slug": "research-reporting-guidelines",
        "pathId": "advanced",
        "title": "Research Reporting Guidelines: STROBE, CONSORT, and PRISMA",
        "subtitle": "The EQUATOR Network Standards, Methodological Transparency, and Publication Ethics",
        "summary": "Ensure complete transparency and reproducibility in scientific publishing. Apply the EQUATOR Network guidelines: STROBE for observational studies, CONSORT for randomized trials, PRISMA for systematic reviews, and COREQ for qualitative research.",
        "lessons": [
            ("equator-network-standards", "The EQUATOR Network and the Global Imperative for Transparent Reporting"),
            ("strobe-for-observational-studies", "The STROBE Statement: Reporting Cross-Sectional, Case-Control, and Cohort Studies"),
            ("consort-and-prisma-statements", "CONSORT for Randomized Trials and PRISMA for Systematic Reviews"),
        ],
        "calc": None,
    },
]

for m in modules_meta:
    module_code = f'''import {{ AcademyModule }} from "../types";

export const module{m["num"]}: AcademyModule = {{
  slug: "{m["slug"]}",
  number: {m["num"]},
  pathId: "{m["pathId"]}",
  title: "{m["title"]}",
  subtitle: "{m["subtitle"]}",
  duration: "3.5 Hours",
  status: "needs academic review",
  summary: "{m["summary"]}",
  learningObjectives: [
    "Understand the theoretical foundations and empirical procedures governing {m["title"].lower()}.",
    "Apply standardized scientific protocols to design and evaluate health research studies.",
    "Critically interpret analytical findings, identify common biases, and apply findings to clinical and public health priorities.",
    "Demonstrate methodological competence through interactive knowledge checks and practical assignments.",
  ],
  prerequisites: ["Completion of previous modules in the Tinat Academy sequence."],
  expectedOutcomes: [
    "Demonstrated proficiency in {m["title"].lower()} in academic and field research contexts.",
    "Preparedness to apply these methodologies inside the Tinat Research Workspace.",
  ],
  glossary: [
    {{
      term: "{m['title'].split(':')[0]}",
      definition: "Core scientific discipline and methodology in health science research.",
    }},
    {{
      term: "Internal Validity",
      definition: "The degree to which observed results can be attributed to the study intervention or exposure rather than flaws in methodology.",
    }},
  ],
  resources: [
    {{
      title: "Designing Clinical Research (5th Edition)",
      authorOrOrg: "Hulley SB et al. (Wolters Kluwer)",
      description: "Standard methodology manual for clinical investigators.",
      url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
      type: "book",
      isVerified: true,
    }},
    {{
      title: "Gordis Epidemiology (7th Edition)",
      authorOrOrg: "Celentano DD, Szklo M (Elsevier)",
      description: "Comprehensive textbook on epidemiology and disease frequency.",
      url: "https://www.us.elsevierhealth.com/gordis-epidemiology-9780323877756.html",
      type: "book",
      isVerified: true,
    }},
  ],
  lessons: [
'''
    for i, (l_slug, l_title) in enumerate(m["lessons"]):
        tool_config = ""
        if m["calc"] == "sample-size":
            tool_config = '''      toolIntegration: {
        type: "sample-size",
        title: "Tinat Sample Size Calculator",
        description: "Calculate required sample sizes for prevalence surveys with finite population corrections directly inside this lesson.",
        prefilledParams: { p: "0.35", margin: "0.05", confidence: "95" },
        ctaText: "Open Sample Size Calculator",
        ctaHref: "/research-tools/sample-size-calculator",
      },'''
        elif m["calc"] == "statistical-calculator":
            tool_config = '''      toolIntegration: {
        type: "statistical-calculator",
        title: "Tinat Statistical Calculator",
        description: "Compute means, medians, standard deviations, confidence intervals, and odds ratios with live data inputs.",
        prefilledParams: { values: "12, 14, 15, 18, 22, 25, 29, 31" },
        ctaText: "Open Statistical Calculator",
        ctaHref: "/research-tools/statistical-calculator",
      },'''
        elif m["calc"] == "tinat-forms":
            tool_config = '''      toolIntegration: {
        type: "tinat-forms",
        title: "Tinat Forms Builder",
        description: "Deploy field questionnaires with skip logic, rosters, and validated item formats directly to mobile enumerators.",
        ctaText: "Build Form in Tinat Forms",
        ctaHref: "/forms/new",
      },'''

        module_code += f'''    {{
      slug: "{l_slug}",
      moduleSlug: "{m["slug"]}",
      title: "{l_title}",
      orderIndex: {i + 1},
      readingTimeMinutes: 20,
      status: "needs academic review",
      learningObjectives: [
        "Explain the scientific principles underpinning {l_title.lower()}.",
        "Apply best practices and recognize common pitfalls in observational and experimental research.",
      ],
      sections: [
        {{
          id: "core-principles",
          title: "1. Scientific Principles & Methodological Foundations",
          content:
            "A comprehensive study of {l_title.lower()} is essential for conducting rigorous, reproducible health science in Ethiopia and across the African continent.\\n\\nInvestigators must ensure that data collection protocols, measurement instruments, and analytical strategies adhere strictly to international best practice standards while remaining responsive to local health system realities.",
          callout: {{
            type: "key-idea",
            title: "Methodological Rigor",
            content:
              "Sound research design protects against bias, confounding, and random variation, ensuring that conclusions translate reliably into clinical practice and health policy.",
          }},
        }},
        {{
          id: "practical-application",
          title: "2. Practical Application and Worked Field Scenarios",
          content:
            "When designing protocols in clinical or community health settings, researchers must anticipate challenges in participant recruitment, data completeness, cultural sensitivities, and logistical feasibility.\\n\\nStructured protocols, standardized operating procedures (SOPs), and pre-tested data collection instruments ensure high measurement fidelity across diverse field enumerators.",
          callout: {{
            type: "ethiopian-case-study",
            title: "Ethiopian Field Context",
            content:
              "Studies conducted across regional referral hospitals and rural health centers must account for multilingual communities, seasonal transport accessibility, and local community leadership engagement.",
          }},
        }},
      ],
{tool_config}
      checkUnderstanding: [
        {{
          id: "m{m['num']}-l{i+1}-q1",
          question: "Which of the following is essential when conducting {l_title.lower()}?",
          options: [
            "Following pre-specified, transparent scientific protocols and documenting all assumptions.",
            "Changing analytical hypotheses only after observing the final p-values.",
            "Omitting non-significant findings from the final report.",
            "Ignoring local ethical clearance if the study is self-funded.",
          ],
          correctIndex: 0,
          explanation: "Scientific integrity requires pre-specified protocols and transparent reporting of all outcomes.",
        }},
      ],
      keyTakeaways: [
        "Rigorous methodology and pre-specified protocols protect against systematic bias.",
        "Local context and cultural appropriateness are as vital to study success as mathematical formulas.",
      ],
      references: [
        {{
          id: "hulley-ref",
          citationText: "Hulley SB, Cummings SR, Browner WS, et al. Designing Clinical Research. 5th ed. Philadelphia: Wolters Kluwer; 2022.",
          url: "https://shop.lww.com/Designing-Clinical-Research/p/9781975174408",
          isVerified: true,
        }},
      ],
    }},
'''

    module_code += f'''  ],
  quiz: {{
    moduleSlug: "{m["slug"]}",
    title: "Module {m["num"]} Mastery Assessment: {m["title"]}",
    passPercentage: 70,
    displayCount: 10,
    questionBank: [
      {{
        id: "m{m['num']}-q01",
        type: "single-choice",
        topicTag: "{m['title'].split(':')[0]}",
        question: "What is the primary scientific purpose of {m['title'].lower()}?",
        options: [
          {{ id: "opt-a", text: "To produce robust, reproducible empirical evidence that advances human health and patient care.", isCorrect: true, explanation: "Correct. The overarching purpose is generating reliable scientific knowledge." }},
          {{ id: "opt-b", text: "To guarantee that all study results achieve p-values below 0.001.", isCorrect: false, explanation: "Incorrect. P-values reflect sample data; they are not the purpose of science." }},
          {{ id: "opt-c", text: "To replace formal Institutional Review Board oversight.", isCorrect: false, explanation: "Incorrect." }},
          {{ id: "opt-d", text: "To eliminate the need for sample size planning.", isCorrect: false, explanation: "Incorrect." }},
        ],
        explanation: "Health research seeks to generate valid, reproducible knowledge that improves human health.",
      }},
      {{
        id: "m{m['num']}-q02",
        type: "true-false-justification",
        topicTag: "Scientific Rigor",
        question: "True or False: In rigorous scientific research, all measurement instruments and analytical methods must be specified prior to data collection.",
        options: [
          {{ id: "opt-a", text: "True, because pre-specifying methods protects against post hoc data dredging and confirmation bias.", isCorrect: true, explanation: "Correct. Pre-registration and protocol specification prevent selective reporting." }},
          {{ id: "opt-b", text: "False, because researchers should only choose statistical tests after seeing which ones yield significant results.", isCorrect: false, explanation: "Incorrect. This practice constitutes 'p-hacking' and invalidates scientific inference." }},
        ],
        explanation: "Specifying protocols in advance is a cornerstone of reproducible biomedical science.",
      }},
    ],
  }},
  assignment: {{
    id: "m{m['num']}-assignment",
    moduleSlug: "{m["slug"]}",
    title: "Practical Assignment: {m['title']}",
    overview: "Apply the principles of {m['title'].lower()} to a realistic Ethiopian public health scenario.",
    scenario: "You are tasked with developing a 400-word methodological concept section for a regional health research proposal in Ethiopia.",
    instructions: [
      "1. Define the specific methodological approach and justify your selection.",
      "2. Outline the step-by-step procedures to minimize bias and measurement error.",
      "3. Address local contextual factors (languages, logistics, ethical clearance).",
      "4. Submit your draft concept inside the Tinat Research Workspace.",
    ],
    deliverables: ["Methodological concept document submitted via Research Workspace."],
    rubric: [
      {{ criterion: "Methodological Soundness", points: 40, description: "Clear alignment between research question and chosen methods." }},
      {{ criterion: "Contextual Grounding", points: 30, description: "Realistic adaptation to Ethiopian healthcare facilities and population." }},
      {{ criterion: "Ethical & Quality Safeguards", points: 30, description: "Procedures to ensure data fidelity, privacy, and informed consent." }},
    ],
    workspaceTemplateId: "CROSS_SECTIONAL",
  }},
}};
'''
    file_path = os.path.join(content_dir, f"module{m['num']}.ts")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(module_code)
    print(f"Generated module{m['num']}.ts")

print("All module files generated successfully!")
