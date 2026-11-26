export type AcademyLecture = {
  introduction: string;
  keyPoints: string[];
  workedExample: { title: string; prompt: string; explanation: string };
  reflection: string;
};

const lectures: Record<string, AcademyLecture> = {
  "foundations-of-health-research": {
    introduction: "Health research is a systematic attempt to produce evidence that can improve individual or population health. It differs from routine clinical care because it asks a general question beyond the needs of one person.",
    keyPoints: ["Separate a research question from a health problem.", "Identify the population, exposure or variable, and outcome.", "Treat evidence as useful but uncertain.", "Use findings only within their limits."],
    workedExample: { title: "From problem to evidence", prompt: "A clinic sees many patients with poorly controlled hypertension.", explanation: "The problem is hypertension. A question might ask whether nurse-led follow-up improves blood-pressure control among adults attending the clinic over six months." },
    reflection: "What local health question could improve a service or policy?",
  },
  "research-questions-and-hypotheses": {
    introduction: "A strong question is focused, relevant, feasible and answerable. Frameworks such as PICO, PECO and PICo help learners name the population, intervention or exposure, comparison and outcome.",
    keyPoints: ["Use PICO for intervention questions.", "Use PECO for exposure and outcome questions.", "Use PICo for qualitative experiences.", "Match the question to a compatible design."],
    workedExample: { title: "Building a PICO question", prompt: "Topic: community text messages for diabetes follow-up.", explanation: "Population: adults with type 2 diabetes. Intervention: weekly SMS reminders. Comparison: routine care. Outcome: medication adherence at three months." },
    reflection: "Rewrite one broad topic into PICO, PECO or PICo.",
  },
  "objectives-and-protocols": {
    introduction: "Objectives convert the research question into a measurable plan. The protocol then explains where, when, how and for whom the study will take place.",
    keyPoints: ["Write one general objective.", "Break it into specific, measurable objectives.", "Define variables before data collection.", "Keep question, objectives, methods and analysis aligned."],
    workedExample: { title: "Objective alignment", prompt: "A study compares mask use and respiratory symptoms.", explanation: "Objective: estimate symptom prevalence. Variable: self-reported symptom in the past seven days. Method: cross-sectional survey. Analysis: prevalence with confidence interval." },
    reflection: "For one objective, identify its variable, method and analysis.",
  },
  "literature-search": {
    introduction: "A reproducible literature search documents how evidence was found. Search planning combines a clear question, controlled terms, synonyms and transparent screening decisions.",
    keyPoints: ["Translate each PICO element into search terms.", "Combine concepts with AND and alternatives with OR.", "Search more than one database when possible.", "Record exclusions and de-duplicate records."],
    workedExample: { title: "Boolean search", prompt: "Find studies of SMS reminders for tuberculosis treatment adherence.", explanation: "Use: ('text messaging' OR SMS) AND tuberculosis AND (adherence OR completion). Keep the exact search string and date for your methods section." },
    reflection: "Create and document one reproducible search string.",
  },
  "research-designs": {
    introduction: "A study design is the structure used to collect evidence. The best design answers the question ethically and efficiently rather than simply being the most complicated design.",
    keyPoints: ["Cross-sectional studies measure at one time point.", "Cohort studies follow exposure groups over time.", "Case-control studies compare people with and without an outcome.", "Trials assign interventions prospectively."],
    workedExample: { title: "Choosing a design", prompt: "A team wants to identify exposures associated with rare poisoning.", explanation: "A case-control design is often efficient because it recruits existing cases and suitable controls, then compares previous exposure histories." },
    reflection: "Why might a trial be impractical for a harmful exposure?",
  },
  "sampling-and-sample-size": {
    introduction: "Sampling determines who is studied and how confidently findings represent a larger population. Sample-size calculation translates assumptions about precision or power into a practical number.",
    keyPoints: ["Define target, source and study populations.", "Probability samples support population inference.", "Precision improves with larger samples.", "Document prevalence, alpha, power and design effects."],
    workedExample: { title: "Single-proportion planning", prompt: "Estimate a 40% prevalence with 5% margin of error at 95% confidence.", explanation: "The commonly used formula gives n = 1.96² × 0.40 × 0.60 / 0.05² ≈ 369. Add non-response and cluster or finite-population adjustments when applicable." },
    reflection: "Which assumptions would change the estimated sample size?",
  },
  "questionnaire-development": {
    introduction: "A useful instrument measures the construct it claims to measure. Questionnaire development moves from concepts and indicators to clear items, cognitive review and pilot testing.",
    keyPoints: ["Use one concept per question.", "Avoid leading, loaded and double-barreled wording.", "Define recall periods and response categories.", "Pilot for comprehension, missingness and burden."],
    workedExample: { title: "Improving a question", prompt: "Weak: 'Do you exercise regularly and eat healthily?'", explanation: "Split and operationalize it: 'How many days in the past seven days did you do at least 30 minutes of moderate activity?' Then ask a separate nutrition question." },
    reflection: "How could participants interpret one of your draft items differently?",
  },
  "data-collection-and-management": {
    introduction: "Good data are accurate, complete, traceable and secure. Field planning links interviewer training, standardized tools, real-time checks and documented corrections.",
    keyPoints: ["Create a data dictionary before collection.", "Test skip logic and required fields.", "Record corrections without deleting source data.", "Apply least-access and retention rules."],
    workedExample: { title: "Quality-control workflow", prompt: "Two enumerators upload the same household twice.", explanation: "A stable household ID and duplicate rule detect the match. The team audits timestamps and source records before merging or removing one entry." },
    reflection: "What check would catch an implausible but possible value?",
  },
  epidemiology: {
    introduction: "Epidemiology measures health in populations and compares disease occurrence across people, places and times. Interpretation requires both numerical measures and causal reasoning.",
    keyPoints: ["Prevalence describes existing cases.", "Incidence describes new cases during time at risk.", "Risk ratios and odds ratios compare occurrence.", "Confounding and bias can imitate or obscure association."],
    workedExample: { title: "Two-by-two table", prompt: "Among 100 exposed people, 20 are cases; among 100 unexposed, 10 are cases.", explanation: "The risk in exposed is 20/100 = 0.20; in unexposed 10/100 = 0.10. The risk ratio is 0.20 / 0.10 = 2.0, subject to bias and chance." },
    reflection: "What alternative explanation could bias an observed association?",
  },
  biostatistics: {
    introduction: "Biostatistics summarizes data, estimates unknown population values and tests claims. A result should include the estimate, uncertainty and assumptions, not only a p-value.",
    keyPoints: ["Mean and median describe center differently.", "Confidence intervals show uncertainty around estimates.", "Choose tests based on outcome and design.", "Check model assumptions and inspect residuals."],
    workedExample: { title: "Interpreting an estimate", prompt: "An intervention lowers blood pressure by 4 mmHg, 95% CI: 1 to 7.", explanation: "The estimate is 4 mmHg. The interval is compatible with benefits between 1 and 7 mmHg; it does not mean all patients improve by exactly 4." },
    reflection: "Why can a narrow confidence interval still contain a biased estimate?",
  },
  "qualitative-data-analysis": {
    introduction: "Qualitative analysis develops an interpretive account from text, observations or images. Reflexive thematic analysis requires transparent coding and researcher awareness, not merely counting words.",
    keyPoints: ["Familiarize yourself with the whole dataset.", "Generate codes tied to analytic questions.", "Develop and refine candidate themes.", "Report reflexivity and negative cases."],
    workedExample: { title: "Building a theme", prompt: "Interviews repeatedly describe transport cost, lost work and fear of judgment.", explanation: "These codes may support a theme of 'structural and social barriers to care.' The analyst should explain how quotations support the theme and what contradicts it." },
    reflection: "What personal assumption could shape this code or theme?",
  },
  "research-ethics": {
    introduction: "Research ethics protects people and communities while enabling valuable knowledge. Respect for persons, beneficence and justice are implemented through consent, proportional risk and fair selection.",
    keyPoints: ["Consent must be voluntary, informed and ongoing.", "Use assent and guardian permission for children when required.", "Minimize identifiable and sensitive data.", "Plan risk, withdrawal and emergency procedures."],
    workedExample: { title: "Consent safeguard", prompt: "An outreach study includes adults who cannot read.", explanation: "The team can use a plain-language verbal consent script, independent witness, teach-back and documentation that follows local ethics requirements." },
    reflection: "How would payment affect the voluntariness of participation?",
  },
  "critical-appraisal": {
    introduction: "Critical appraisal assesses whether findings are valid, complete and relevant. It asks how a study was conducted before deciding whether evidence should influence practice.",
    keyPoints: ["Identify the study question and design.", "Assess selection, measurement and confounding bias.", "Distinguish precision from clinical importance.", "Use GRADE to summarize certainty across studies."],
    workedExample: { title: "Appraising a claim", prompt: "A trial reports a strong benefit but has 40% participant loss.", explanation: "The result may be valid, but attrition could bias outcome groups. Examine intention-to-treat analysis and missing-data reasons before deciding." },
    reflection: "Can evidence be statistically significant but clinically modest?",
  },
  "academic-writing": {
    introduction: "Scientific writing makes an argument easy to evaluate. IMRaD structure separates what was studied, how it was studied, what was found and what it means.",
    keyPoints: ["Use precise, active and economical language.", "Define abbreviations and acronyms.", "Describe methods reproducibly.", "Report results before interpretation."],
    workedExample: { title: "Strengthening a method sentence", prompt: "Weak: 'We analyzed the data statistically.'", explanation: "Use: 'We summarized categorical variables with frequencies and percentages and fitted a logistic regression adjusted for age and facility type.'" },
    reflection: "Could another researcher reproduce your method from the paragraph?",
  },
  "scientific-publication": {
    introduction: "Publication is a responsibility, not merely a destination. Authors communicate transparent methods, avoid deceptive claims and follow author, reporting and journal policies.",
    keyPoints: ["Match the journal to the audience and article type.", "Check scope, reporting checklist and word limits.", "Define contributions and conflicts of interest.", "Respond to reviewers with evidence and traceability."],
    workedExample: { title: "Journal selection", prompt: "A small qualitative implementation study is complete.", explanation: "Choose a journal publishing qualitative health implementation research, with fair open-access costs, no predatory indicators and an appropriate readership." },
    reflection: "What quality signs help you identify a trustworthy journal?",
  },
  "reporting-guidelines": {
    introduction: "Reporting guidelines tell authors which study details must be visible for readers to judge and reuse research. The guideline depends on the design.",
    keyPoints: ["CONSORT is for randomized trials.", "STROBE is for observational studies.", "PRISMA is for systematic reviews.", "STARD is for diagnostic accuracy studies."],
    workedExample: { title: "Matching a guideline", prompt: "A team reports a prospective cohort of pregnant participants.", explanation: "Use STROBE to disclose cohort selection, follow-up, exposure measurement, confounders and missing data." },
    reflection: "Which reporting items would best expose bias in your design?",
  },
  "systematic-reviews": {
    introduction: "A systematic review collects, appraises and synthesizes relevant studies using explicit and reproducible methods. Meta-analysis combines compatible numerical estimates statistically.",
    keyPoints: ["Register the protocol and research question.", "Define eligibility before screening.", "Extract outcomes consistently.", "Report heterogeneity and certainty."],
    workedExample: { title: "Interpreting a forest plot", prompt: "Two studies favor the intervention and two favor the control.", explanation: "A pooled estimate combines effects but only if studies are sufficiently comparable. Wide confidence intervals and high heterogeneity may limit certainty." },
    reflection: "Why might combining studies into an average hide important differences?",
  },
  "proposal-and-thesis": {
    introduction: "A proposal integrates the research rationale, question, design, participants, measures, ethics, analysis, budget and timeline into one defendable plan.",
    keyPoints: ["State a clear problem and evidence gap.", "Connect each objective to an analysis.", "Budget methods and field realities.", "Plan dissemination and data stewardship."],
    workedExample: { title: "Alignment matrix", prompt: "Objective: estimate contraceptive uptake among first-time mothers.", explanation: "Population: eligible first-time mothers. Outcome: current contraceptive use. Design: facility-based cross-sectional study. Analysis: weighted prevalence and 95% confidence interval." },
    reflection: "Where does your plan currently have weak alignment?",
  },
};

export function getAcademyLecture(slug: string): AcademyLecture {
  return lectures[slug];
}
