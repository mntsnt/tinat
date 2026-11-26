export type AcademyQuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type AcademyLecture = {
  introduction: string;
  keyPoints: string[];
  workedExample: { title: string; prompt: string; explanation: string };
  reflection: string;
  lessonContent: string[];
  quiz: AcademyQuizQuestion[];
};

const lectures: Record<string, AcademyLecture> = {
  "foundations-of-health-research": {
    introduction: "Health research is a systematic way to answer questions about health and produce evidence that can guide care, services and policy. Strong research begins with a relevant problem, uses a transparent method and communicates both what the evidence says and what it cannot say.",
    keyPoints: ["Distinguish a health problem from a research question.", "Define the population, setting, variables and outcomes.", "Treat evidence as provisional and context-dependent.", "Consider community priorities and ethics from the beginning."],
    workedExample: { title: "From a service problem to a study", prompt: "A clinic notices that many adults with hypertension miss follow-up visits.", explanation: "First describe the problem and who experiences it. A feasible study might estimate missed-visit frequency and explore barriers among adults attending that clinic. The result can inform local service changes, but should not automatically be generalized to every clinic." },
    reflection: "Which local health problem is important to the people affected, and what evidence would help address it?",
    lessonContent: [
      "Research uses planned observations or experiments to answer a defined question. Descriptive research measures what is happening; analytic research examines relationships; implementation research studies how evidence-based services work in real settings. Choose the research purpose before choosing a method.",
      "A population is the group a study aims to understand; the sample is the subset actually observed. Define the setting and eligibility clearly. Outcomes are the results or events of interest, while exposures, interventions and contextual factors may help explain those outcomes.",
      "Evidence varies in strength because designs, measurement quality, sample selection and chance vary. A result is not automatically causal just because two variables move together. Report estimates with uncertainty and explain plausible alternative explanations.",
      "Research priorities should reflect local burden, community knowledge, feasibility and potential benefit. In Ethiopia, consider language, geography, health-system capacity and local review requirements. Engage relevant communities early rather than treating them only as data sources.",
    ],
    quiz: [
      { question: "Which statement best describes health research?", options: ["A systematic process for answering a defined health question", "Any collection of patient information for administration", "A guarantee that a treatment will work"], answer: 0, explanation: "Research is systematic and question-driven; it does not guarantee a particular result." },
      { question: "A clinic counts missed visits during one month. What is the sample?", options: ["All adults in the country", "The eligible clinic patients whose visits were observed", "Only patients who attended every visit"], answer: 1, explanation: "The sample is the subset of the target population that is actually included and observed." },
      { question: "Why should a local study's findings be interpreted carefully?", options: ["Local results can never be useful", "Every study proves causation", "Setting and sampling may limit transfer to other populations"], answer: 2, explanation: "Findings can inform decisions, but their relevance elsewhere depends on context and study methods." },
    ],
  },
  "research-questions-and-hypotheses": {
    introduction: "A focused question turns a broad concern into a study that can be designed, resourced and ethically reviewed. Frameworks make the key elements visible; hypotheses state a testable expectation when the design calls for one.",
    keyPoints: ["Use PICO for intervention questions and PECO for exposure questions.", "Use PICo or related frameworks for experience-focused questions.", "Check feasibility, importance, novelty and ethics.", "Make objectives and hypotheses consistent with the question."],
    workedExample: { title: "Build a PICO question", prompt: "A team wants to study text reminders for diabetes follow-up.", explanation: "Population: adults with type 2 diabetes. Intervention: weekly SMS reminders. Comparison: routine follow-up. Outcome: attendance within three months. The question can now guide eligibility, intervention delivery and outcome measurement." },
    reflection: "Rewrite one broad topic as a structured question and explain why it is feasible.",
    lessonContent: [
      "Start with a problem statement: who is affected, what is happening, where and why it matters. Narrow the topic by population, setting, period and outcome. A question should be neither so broad that it is unanswerable nor so narrow that it has no practical value.",
      "PICO identifies Population, Intervention, Comparison and Outcome, especially for treatment questions. PECO substitutes Exposure for Intervention in observational questions. PICo can structure qualitative questions around Population, phenomenon of Interest and Context. Frameworks are aids, not rigid formulas.",
      "Descriptive questions ask how common or how distributed something is. Analytical questions ask whether factors are associated. Qualitative questions explore meaning, experience or process. The question type should determine which evidence and design are appropriate.",
      "A null hypothesis commonly states no difference or association; an alternative hypothesis states that a difference or association exists. Specify direction only when scientifically justified in advance. Do not write a statistical hypothesis for exploratory qualitative work simply to make it look quantitative.",
    ],
    quiz: [
      { question: "Which framework is most directly suited to an intervention comparison?", options: ["PICO", "PRISMA", "STROBE"], answer: 0, explanation: "PICO structures Population, Intervention, Comparison and Outcome for intervention questions." },
      { question: "In PECO, what does E represent?", options: ["Evidence", "Exposure", "Evaluation"], answer: 1, explanation: "PECO is useful when studying an exposure rather than assigning an intervention." },
      { question: "When should a directional hypothesis be used?", options: ["Whenever a significant result is desired", "Only after seeing the results", "When prior evidence justifies predicting a direction before analysis"], answer: 2, explanation: "Hypotheses must be specified before observing results to avoid post hoc prediction." },
    ],
  },
  "objectives-and-protocols": {
    introduction: "Objectives translate a research question into a set of tasks that can be completed and evaluated. The protocol is the operational blueprint that links those objectives to people, measurements, procedures, ethics and analysis.",
    keyPoints: ["Write one focused general objective and aligned specific objectives.", "Define concepts as measurable variables.", "Specify methods before data collection.", "Use an alignment matrix to expose gaps and unnecessary methods."],
    workedExample: { title: "Align objective and analysis", prompt: "A study will estimate the prevalence of anemia among pregnant women attending selected clinics.", explanation: "The objective specifies the population and quantity to estimate. The protocol must define anemia using a justified threshold, describe how hemoglobin is measured, set eligibility and sampling procedures, and plan a prevalence estimate with appropriate uncertainty." },
    reflection: "Choose one specific objective and map it to its population, variable, data source and analysis.",
    lessonContent: [
      "The general objective states the overall purpose. Specific objectives break it into observable tasks, usually using action verbs such as estimate, compare, describe, assess or explore. Avoid vague verbs such as understand unless the intended evidence is made explicit.",
      "A conceptual definition explains an idea; an operational definition says exactly how it will be observed. For example, 'adherence' needs a specified instrument, recall period and scoring rule. Define categories, units and cutoffs before analysis to reduce inconsistent decisions.",
      "A complete protocol typically includes rationale, question, objectives, design, setting, population, sampling, measurements, procedures, analysis, ethics, timeline, budget and dissemination. Detail should be sufficient for reviewers and another research team to judge feasibility and reproduce the work.",
      "An alignment matrix places each objective beside its variables, data source, collection method and analysis. Empty cells reveal missing plans; methods that serve no objective may be unnecessary. Revise the matrix whenever the question or protocol changes.",
    ],
    quiz: [
      { question: "What is the main purpose of a specific objective?", options: ["To name a broad topic", "To state a measurable task that contributes to the overall aim", "To list every statistical test"], answer: 1, explanation: "Specific objectives make the study's intended work observable and assessable." },
      { question: "Which is an operational definition?", options: ["A precise rule for measuring a variable", "A general discussion of why a topic matters", "A list of author names"], answer: 0, explanation: "Operational definitions specify how a concept becomes data." },
      { question: "What can an alignment matrix reveal?", options: ["Whether objectives, measurements and analyses fit together", "Whether results are statistically significant", "Whether participants gave consent"], answer: 0, explanation: "It checks the logical connection among each objective and its methods." },
    ],
  },
  "literature-search": {
    introduction: "A rigorous literature search is reproducible: another person should be able to understand where, when and how evidence was found. Search strategy, screening and reference management all contribute to a trustworthy review.",
    keyPoints: ["Break the question into searchable concepts and synonyms.", "Combine alternatives with OR and concepts with AND.", "Use controlled vocabulary alongside free-text terms.", "Record databases, dates, exact searches and screening decisions."],
    workedExample: { title: "A searchable question", prompt: "Find studies on SMS reminders and tuberculosis treatment completion.", explanation: "Search concept groups such as (SMS OR text messag* OR mobile phone) AND (tuberculosis OR TB) AND (treatment completion OR adherence). Adapt terms to each database, document the exact strings and assess whether the results are relevant." },
    reflection: "What synonyms, controlled terms and databases would you include for your topic?",
    lessonContent: [
      "Before searching, define the question and decide which concepts are essential. Build a search table with each concept, synonyms, spelling variants, abbreviations and subject headings. Do not add every PICO element automatically; an overly restrictive search can miss relevant studies.",
      "Boolean operators control how terms combine. OR gathers synonyms and usually broadens retrieval. AND joins distinct concepts and narrows retrieval. Truncation and phrase searching vary by database; test syntax and inspect sample results instead of assuming commands behave identically everywhere.",
      "Databases use controlled vocabularies such as MeSH to group related concepts. Combine subject headings with title/abstract terms because new or unindexed records may not yet have headings. Choose databases that cover the disciplines and regions relevant to the question.",
      "Save the database name, platform, date, exact query and number of records retrieved. Export records, remove duplicates using a documented rule and screen titles/abstracts against predefined criteria. Keep reasons for full-text exclusions so the selection pathway can be reported.",
    ],
    quiz: [
      { question: "How are synonyms for one concept usually combined?", options: ["With AND", "With OR", "With NOT only"], answer: 1, explanation: "OR retrieves records containing any of the alternative terms." },
      { question: "Why combine controlled vocabulary with free-text terms?", options: ["To find indexed records and newer or differently worded records", "To guarantee there will be no duplicates", "To avoid documenting the search"], answer: 0, explanation: "The two approaches complement one another and improve retrieval." },
      { question: "Which detail is essential for search reproducibility?", options: ["The reviewer's preferred citation style", "The search date and exact database strategy", "Only the final number of included studies"], answer: 1, explanation: "The exact strategy and date allow others to understand and repeat the search." },
    ],
  },
  "research-designs": {
    introduction: "Research design is the overall structure used to answer a question. Choosing well means matching the design to the question, ethical constraints, timeline and available resources—not selecting the most complex method.",
    keyPoints: ["Cross-sectional designs estimate a snapshot; cohorts follow people over time.", "Case-control studies begin with outcome status and look back at exposures.", "Trials assign interventions and need safeguards against bias.", "Qualitative and mixed-methods designs answer process and meaning questions."],
    workedExample: { title: "Choose a design for a rare outcome", prompt: "Researchers want to explore prior exposures associated with a rare adverse event.", explanation: "A case-control study can efficiently compare previous exposures among people with and without the event. Careful control selection, exposure measurement and confounding assessment are essential; the design does not directly estimate incidence." },
    reflection: "What design best answers your question, and what important limitation comes with it?",
    lessonContent: [
      "Cross-sectional studies measure exposure and outcome around the same time and are useful for describing prevalence. Because temporal order may be unclear, they often cannot establish whether an exposure preceded an outcome. Sampling and non-response strongly affect generalizability.",
      "Cohort studies classify participants by exposure and observe outcomes over time, enabling incidence estimates and clearer temporal ordering. They can be prospective or use existing records. Attrition, long follow-up and rare outcomes can make them costly or biased.",
      "Case-control studies select participants by outcome status and compare prior exposures. They are efficient for rare outcomes or long latency, but are vulnerable to selection and recall bias and usually do not directly estimate risk. Trials prospectively assign interventions; randomization can balance confounders, but allocation concealment, follow-up and ethical equipoise matter.",
      "Qualitative designs investigate experiences, meanings and processes using interviews, observations or documents. Mixed methods deliberately integrate quantitative and qualitative evidence, for example to explain why an intervention had different effects across sites. Integration must be planned, not added as an afterthought.",
    ],
    quiz: [
      { question: "Which design is often efficient for studying a rare outcome?", options: ["Case-control study", "Cross-sectional census only", "Uncontrolled case series"], answer: 0, explanation: "Case-control studies start with outcome status, making rare outcomes practical to study." },
      { question: "What is a key limitation of a cross-sectional study?", options: ["It cannot collect numerical data", "Exposure and outcome timing may be unclear", "It always requires random assignment"], answer: 1, explanation: "Measuring exposure and outcome at one time can make temporal order difficult to establish." },
      { question: "What makes a mixed-methods study genuinely mixed?", options: ["Using two questionnaires", "Integrating quantitative and qualitative evidence to answer the question", "Collecting data at two hospitals"], answer: 1, explanation: "Integration, not simply having two data types, is central to mixed methods." },
    ],
  },
  "sampling-and-sample-size": {
    introduction: "Sampling defines who contributes data; sample-size planning estimates how many participants are needed for a specified precision or power. Neither calculation repairs a biased sampling frame or an unclear research question.",
    keyPoints: ["Distinguish target, source and study populations.", "Choose probability or non-probability sampling to match inference goals.", "State assumptions for precision or power calculations.", "Adjust for clustering, non-response and finite populations when justified."],
    workedExample: { title: "Estimate a single proportion", prompt: "Estimate a prevalence of 40% with 95% confidence and a 5 percentage-point margin of error.", explanation: "Using n = z²p(1-p)/d² gives approximately 369 before adjustment. A cluster design may require a design effect; non-response requires inflation. The assumed prevalence, desired precision and sampling design should all be documented." },
    reflection: "Which design assumptions drive your sample-size estimate, and how would you justify each?",
    lessonContent: [
      "The target population is the group to which the research question refers. The source population is the group that can realistically be sampled; the study population is the eligible group from which participants are recruited. Differences among these groups can introduce selection bias and limit generalization.",
      "Simple random, systematic, stratified and cluster sampling are probability methods when selection probabilities are known. Convenience, purposive and snowball approaches can be useful for access or qualitative depth, but they do not automatically support population estimates. Match the strategy to the inference you intend to make.",
      "For a single proportion, precision-based planning depends on confidence level, expected proportion and margin of error. Comparative studies often use a power calculation based on the effect worth detecting, variability or event rates, alpha, power and group allocation. Smaller effects generally require larger samples.",
      "Cluster sampling reduces field costs but observations within a cluster may be correlated, increasing required sample size. Non-response inflation anticipates incomplete participation; finite-population correction may reduce the required sample when a substantial fraction of a small population is sampled. Avoid double-counting adjustments and state the formula and assumptions.",
    ],
    quiz: [
      { question: "What does a margin of error represent in a prevalence calculation?", options: ["Desired precision around the estimate", "The proportion of participants who refuse", "The probability that the hypothesis is true"], answer: 0, explanation: "The margin of error specifies how precise the estimate should be." },
      { question: "Why can cluster sampling require a larger sample?", options: ["Participants in a cluster may have correlated outcomes", "It always increases the response rate", "It removes all measurement error"], answer: 0, explanation: "Within-cluster similarity reduces the effective information contributed by each additional participant." },
      { question: "What is the best response when sample-size assumptions are uncertain?", options: ["Hide the assumptions", "Document plausible assumptions and assess sensitivity", "Select the smallest number available"], answer: 1, explanation: "Transparent assumptions and sensitivity analyses show how planning choices affect the result." },
    ],
  },
  "questionnaire-development": {
    introduction: "A questionnaire turns concepts into responses that can be interpreted. High-quality instruments are clear, appropriate to participants and tested for comprehension, measurement quality and burden before full deployment.",
    keyPoints: ["Define constructs and indicators before writing items.", "Use one idea, a clear recall period and balanced response options.", "Translate and culturally adapt carefully.", "Pilot and cognitively test the instrument."],
    workedExample: { title: "Repair a double-barreled item", prompt: "Weak item: 'Do you exercise regularly and eat a healthy diet?'", explanation: "It asks about two different behaviors and leaves 'regularly' and 'healthy' undefined. Split it into separate items, specify a recall period and define observable response categories." },
    reflection: "Select one draft question and identify ambiguity, burden or cultural assumptions.",
    lessonContent: [
      "Begin with a construct map: define the concept, its dimensions and observable indicators. A validated scale may be preferable to creating a new measure, but confirm permission, language fit, population validity and scoring instructions before use.",
      "Write short questions in familiar language. Avoid double negatives, leading assumptions, jargon and two questions joined together. Specify who, what period and unit; for example, ask about the number of days in the past seven days rather than 'often'.",
      "Response options should be mutually exclusive and collectively adequate for the intended measure. Include 'not applicable' or 'don't know' only when meaningful. Ordering can influence responses, so use consistent scales and consider whether sensitive items should appear after rapport is established.",
      "Translation is not word substitution: use qualified translators, reconciliation and cognitive interviews with people similar to the intended participants. A pilot tests flow, skips, timing, missingness and technical behavior. Revise documented problems before launching full collection.",
    ],
    quiz: [
      { question: "What is wrong with asking about exercise and diet in one item?", options: ["It is double-barreled and the two answers may differ", "It is too short", "It uses a recall period"], answer: 0, explanation: "A participant may exercise but not eat as described, leaving no accurate single response." },
      { question: "What does cognitive interviewing help assess?", options: ["How participants understand and answer questions", "Whether the final analysis is statistically significant", "Whether a journal will accept the paper"], answer: 0, explanation: "Cognitive interviews reveal interpretation, recall and response-process problems." },
      { question: "When should a pilot usually be conducted?", options: ["After the whole study is complete", "Before full rollout, to identify instrument and workflow issues", "Only when no ethics review is required"], answer: 1, explanation: "A pilot can reveal problems while there is still time to revise procedures." },
    ],
  },
  "data-collection-and-management": {
    introduction: "Data quality depends on the entire collection system: people, instruments, procedures, technology and governance. A data-management plan makes records usable, traceable and appropriately protected from collection through archiving or deletion.",
    keyPoints: ["Standardize and train field procedures.", "Use a data dictionary and validation checks.", "Maintain an audit trail for corrections.", "Protect access, transfer, retention and deletion."],
    workedExample: { title: "Investigate a duplicate record", prompt: "Two enumerators submit forms for the same household.", explanation: "Use a stable non-identifying study ID and review timestamps, source notes and field procedures. Determine whether this is a true duplicate or two eligible visits; document the decision rather than silently deleting a record." },
    reflection: "What controls would detect errors while preserving a trustworthy audit trail?",
    lessonContent: [
      "Standard operating procedures define who does each task, in what order and how exceptions are handled. Train collectors on consent, neutral interviewing, referral procedures, device use and safeguarding. Supervision should support quality without encouraging fabrication or coercion.",
      "A data dictionary names each variable, meaning, type, unit, allowable values, missing-value codes and source. Validation rules catch impossible values and inconsistent skips, but must distinguish impossible values from unusual yet plausible observations that deserve review.",
      "Use stable study identifiers, versioned forms and a documented naming convention. Track edits with date, reason and responsible role. Backups should be tested for restoration; separate identifying information from analysis data and restrict access according to role.",
      "Collect only data needed for approved purposes. Encrypt devices and transfers where available, use secure storage, define retention and deletion schedules, and plan responses to loss or unauthorized access. Offline collection needs a controlled synchronization process and device-level safeguards.",
    ],
    quiz: [
      { question: "What should a data dictionary include?", options: ["Variable meaning, type, units and allowable values", "Only participant names", "The study's final conclusions"], answer: 0, explanation: "A data dictionary makes variables interpretable and supports consistent collection and analysis." },
      { question: "How should a correction to a research record be handled?", options: ["Overwrite it without a trace", "Document the change, reason and responsible person", "Delete the entire dataset"], answer: 1, explanation: "An audit trail preserves transparency and enables later review." },
      { question: "What is data minimization?", options: ["Collect only data needed for defined and approved purposes", "Collect all possible data in case they become useful", "Remove all quality checks"], answer: 0, explanation: "Minimization reduces privacy risk and unnecessary data burden." },
    ],
  },
  epidemiology: {
    introduction: "Epidemiology studies the distribution and determinants of health in populations. Measures of occurrence and association help describe patterns, but causal conclusions also require attention to design, bias, confounding and context.",
    keyPoints: ["Prevalence measures existing cases; incidence concerns new cases over time.", "Choose measures based on design and question.", "Assess confounding, selection and information bias.", "Interpret association with uncertainty and causal caution."],
    workedExample: { title: "Interpret a risk ratio", prompt: "Among 100 exposed people, 20 develop an outcome; among 100 unexposed, 10 do.", explanation: "Risk among exposed = 20/100 = 0.20. Risk among unexposed = 10/100 = 0.10. The risk ratio is 2.0. This association does not establish causality without examining chance, bias, confounding and temporality." },
    reflection: "Name a plausible confounder in a health association and explain how it relates to exposure and outcome.",
    lessonContent: [
      "Prevalence is the proportion of a population with a condition at a point or period. Incidence proportion is the fraction initially at risk that develops the outcome during a specified period; incidence rate uses person-time. State the denominator and time window explicitly.",
      "A risk ratio compares cumulative risks, while an odds ratio compares odds. A rate ratio compares incidence rates. These measures are not interchangeable; in case-control studies the odds ratio is commonly estimated, and it approximates a risk ratio only under suitable conditions such as a rare outcome.",
      "Confounding occurs when a third factor is associated with both exposure and outcome and is not on the causal pathway. Selection bias arises from how people enter or remain in the study; information bias comes from systematic measurement error. Consider these threats during design, collection and analysis.",
      "A causal interpretation asks whether the exposure precedes the outcome, whether alternative explanations are plausible and whether the evidence is consistent with the proposed mechanism. Use a causal diagram to identify assumptions, and avoid adjusting for variables without considering their causal role.",
    ],
    quiz: [
      { question: "Which measure includes person-time in its denominator?", options: ["Prevalence", "Incidence rate", "Risk difference"], answer: 1, explanation: "Incidence rates use accumulated person-time at risk." },
      { question: "What is confounding?", options: ["A variable related to exposure and outcome that distorts their association", "Random variation in a sample", "A method for recruiting participants"], answer: 0, explanation: "A confounder can create, exaggerate or mask an exposure-outcome association." },
      { question: "A risk ratio of 2.0 by itself proves that exposure caused disease.", options: ["True", "False", "Only if the sample is large"], answer: 1, explanation: "Causal inference also requires assessment of temporality, bias, confounding and other evidence." },
    ],
  },
  biostatistics: {
    introduction: "Biostatistics provides tools to describe data, quantify uncertainty and evaluate models. Statistical output must be interpreted alongside design, measurement quality and clinical or public-health importance.",
    keyPoints: ["Summarize distributions with suitable measures.", "Interpret estimates and confidence intervals, not only p-values.", "Select tests based on outcome, design and assumptions.", "Check model fit, missing data and practical importance."],
    workedExample: { title: "Read a confidence interval", prompt: "An intervention is associated with a mean blood-pressure difference of −4 mmHg (95% CI −7 to −1).", explanation: "The estimated average difference is a 4 mmHg reduction. The interval describes a range of values compatible with the data and model under repeated-sampling assumptions; it does not mean 95% of participants changed by that amount." },
    reflection: "What would you report alongside a p-value so readers can judge the result?",
    lessonContent: [
      "Inspect data before choosing summaries. Mean and standard deviation work well for roughly symmetric continuous data; median and interquartile range are often better for skewed data. Frequencies and proportions summarize categorical variables. Show denominators and missingness.",
      "A confidence interval communicates estimate precision under the model and sampling process. A p-value measures how incompatible the observed data are with a specified null model; it is not the probability that the null is true or that a result is due to chance.",
      "Choose tests according to study design, outcome scale, distribution, independence and estimand. Regression can adjust for measured covariates, but model choice and variable coding should be justified. Inspect residuals, influential observations, functional form and collinearity.",
      "Report effect estimates with uncertainty and units, not only a significance label. Discuss whether the magnitude matters to patients or services. Plan missing-data handling, multiplicity and subgroup analyses, and distinguish pre-specified analyses from exploratory findings.",
    ],
    quiz: [
      { question: "Which summary is usually more appropriate for strongly skewed continuous data?", options: ["Median and interquartile range", "Mean only", "Mode and maximum only"], answer: 0, explanation: "Median and IQR are less influenced by extreme values than the mean and standard deviation." },
      { question: "What does a p-value not tell you?", options: ["How unusual data are under a specified null model", "The probability that the null hypothesis is true", "Whether data conflict with a null model"], answer: 1, explanation: "A p-value is conditional on the null model; it is not the posterior probability that the null is true." },
      { question: "Why report an effect estimate with a confidence interval?", options: ["To communicate magnitude and uncertainty", "To prove the study has no bias", "To replace a description of methods"], answer: 0, explanation: "Readers need the estimated effect and its precision to assess meaning." },
    ],
  },
  "qualitative-data-analysis": {
    introduction: "Qualitative analysis interprets meaning and process in text, observation or other non-numeric material. A credible analysis shows how raw material became codes and themes, while acknowledging the researcher's role in interpretation.",
    keyPoints: ["Familiarize yourself with the dataset before coding.", "Use codes to capture relevant meaning, not just keywords.", "Build themes that explain patterned meaning.", "Document reflexivity, contradictory cases and analytic decisions."],
    workedExample: { title: "From codes to an analytic theme", prompt: "Participants describe transport costs, lost wages and fear of being recognized at a clinic.", explanation: "Possible codes include travel expense, opportunity cost and anticipated stigma. A theme such as 'the hidden costs of seeking care' can connect these ideas, but should be supported by diverse excerpts and checked against cases that do not fit." },
    reflection: "Which assumptions might shape how you interpret a participant's account?",
    lessonContent: [
      "Prepare transcripts consistently, remove identifiers and record relevant context such as interview setting and language. Read across the whole dataset before settling on categories. Memo early impressions, questions and assumptions so they can be revisited rather than treated as facts.",
      "Coding labels segments that matter to the research question. Codes may be semantic (explicit meaning) or latent (underlying meaning), inductive or theory-informed. A codebook can define names and examples for team consistency, while reflexive approaches treat coding as interpretive rather than purely mechanical.",
      "Themes are patterns of shared meaning organized around a central idea, not simply repeated topics. Review whether each theme has a coherent story, sufficient evidence and distinction from other themes. Use quotations to illustrate analysis, not replace it.",
      "Reflexivity asks how researcher position, relationships and assumptions shape the study. Keep analytic memos and an audit trail; seek disconfirming or deviant cases and discuss disagreements thoughtfully. Quality is supported by transparency and coherence, not by claiming that interpretation is entirely objective.",
    ],
    quiz: [
      { question: "What is a qualitative theme?", options: ["A meaningful pattern organized around a central idea", "Any frequently used word", "A participant demographic"], answer: 0, explanation: "A theme interprets a pattern of shared meaning relevant to the research question." },
      { question: "Why examine a case that does not fit a candidate theme?", options: ["To test and refine the interpretation", "To remove inconvenient data", "To increase the sample size"], answer: 0, explanation: "Contradictory cases can reveal limits or require a more nuanced account." },
      { question: "What does reflexivity involve?", options: ["Considering how the researcher influences the research process", "Removing all interpretation from analysis", "Replacing participant accounts with statistics"], answer: 0, explanation: "Reflexivity makes the researcher's role and assumptions visible." },
    ],
  },
  "research-ethics": {
    introduction: "Research ethics protects participants, communities and researchers while enabling socially valuable inquiry. Ethical practice is continuous: it includes independent review, fair recruitment, valid consent, proportionate safeguards and responsible handling of data.",
    keyPoints: ["Respect autonomy and obtain voluntary informed consent.", "Minimize risk and maximize reasonable benefit.", "Recruit fairly and avoid exploiting vulnerable groups.", "Protect confidentiality and follow local review requirements."],
    workedExample: { title: "Accessible consent", prompt: "An approved community study includes adults who cannot read the consent form.", explanation: "Use an approved oral explanation in a language the person understands, check comprehension with teach-back, and document consent with an appropriate witness or procedure approved by the ethics committee. Participation must remain voluntary." },
    reflection: "What risks, power differences or privacy concerns need safeguards in your study?",
    lessonContent: [
      "Respect for persons includes meaningful choice, adequate information and freedom to withdraw without penalty. Consent is a process, not merely a signature. Explain purpose, procedures, foreseeable risks, benefits, alternatives, confidentiality limits and contacts in an understandable form.",
      "For children or people with limited decision-making capacity, follow local laws and ethics-board requirements for permission, assent and safeguards. Community or institutional permission does not replace individual consent when required. Incentives should compensate fairly without becoming undue influence.",
      "Beneficence requires minimizing avoidable harm and assessing whether risks are reasonable in relation to potential value. Justice concerns fair distribution of research burdens and benefits. Recruitment should not exclude groups without a scientific reason or place disproportionate burdens on people with less power.",
      "Protect privacy through data minimization, access controls, secure storage and clear retention rules. Confidentiality can have limits, which should be explained honestly. Obtain ethics approval before recruitment or changes requiring review, and follow Ethiopian institutional and national requirements applicable to the study.",
    ],
    quiz: [
      { question: "What is informed consent?", options: ["An ongoing voluntary decision based on understandable information", "A signature that removes all study risk", "Permission given only by a community leader"], answer: 0, explanation: "Consent is a process that supports a person's informed and voluntary choice." },
      { question: "Does community permission replace individual consent?", options: ["Always", "No, not when individual consent is required", "Only for surveys"], answer: 1, explanation: "Community authorization and individual consent serve different purposes." },
      { question: "Which principle emphasizes fair distribution of burdens and benefits?", options: ["Justice", "Precision", "Blinding"], answer: 0, explanation: "Justice addresses fairness in who bears research burdens and who may benefit." },
    ],
  },
  "critical-appraisal": {
    introduction: "Critical appraisal is a structured way to judge whether research is trustworthy, meaningful and applicable. It asks how a study was planned and conducted before drawing conclusions from its results.",
    keyPoints: ["Check whether the question and design match.", "Assess selection, measurement, confounding and missing-data risks.", "Interpret effect size, precision and clinical relevance.", "Use certainty frameworks across bodies of evidence."],
    workedExample: { title: "Appraise loss to follow-up", prompt: "A trial reports benefit, but 40% of participants are missing at final follow-up.", explanation: "Ask whether loss differed by group or prognosis, why participants left, and how missing outcomes were handled. A large loss may compromise the comparison even if the reported p-value is small." },
    reflection: "Which source of bias is most plausible in a study you recently read?",
    lessonContent: [
      "Start with a focused appraisal question and identify the study design. Use a matching checklist as a guide, not a score that substitutes for judgment. First ask whether the methods can answer the stated question and whether the population resembles the one of interest.",
      "Examine recruitment, allocation, blinding where feasible, measurement validity, follow-up, missing data and selective reporting. In observational studies, assess confounding and whether analysis addressed it credibly. Consider the likely direction and magnitude of each bias.",
      "Interpret the estimate and its confidence interval, not just whether a threshold was crossed. Compare the effect with a meaningful clinical or public-health difference. Consider absolute as well as relative measures and weigh benefits against harms, burden and cost.",
      "GRADE evaluates certainty across outcomes and bodies of evidence, considering risk of bias, inconsistency, indirectness, imprecision and publication bias. A recommendation also depends on values, resources, equity and feasibility; certainty alone does not dictate policy.",
    ],
    quiz: [
      { question: "What should be considered when 40% of trial participants are lost?", options: ["Whether loss differs by group or outcome risk", "Only the study title", "Whether the p-value is below 0.05"], answer: 0, explanation: "Differential or outcome-related attrition can bias the estimated treatment effect." },
      { question: "A narrow confidence interval guarantees an unbiased result.", options: ["True", "False", "Only in a randomized trial"], answer: 1, explanation: "Precision does not protect against systematic bias." },
      { question: "Which is a GRADE domain for lowering certainty?", options: ["Risk of bias", "Font size", "Number of authors"], answer: 0, explanation: "GRADE evaluates factors such as risk of bias, inconsistency, indirectness, imprecision and publication bias." },
    ],
  },
  "academic-writing": {
    introduction: "Academic writing makes research reasoning visible and reproducible. Clear structure, accurate citations and appropriately cautious language help readers understand what was done, what was found and how confidently it can be interpreted.",
    keyPoints: ["Use IMRaD to organize many empirical reports.", "Make methods reproducible and results factual.", "Support claims with appropriate sources.", "Paraphrase honestly and cite ideas, data and quotations."],
    workedExample: { title: "Make the methods reproducible", prompt: "Weak sentence: 'We analyzed the data statistically.'", explanation: "A more useful report names the outcome, method and adjustment: 'We estimated anemia prevalence with 95% confidence intervals and fitted a logistic regression adjusted for age and facility.' Include software and handling decisions where relevant." },
    reflection: "What information would another researcher need to reproduce a method you have written?",
    lessonContent: [
      "A scientific paragraph usually begins with a claim, develops it with evidence and explains its relevance. Keep one main idea per paragraph, use transitions to show logic and remove unsupported assertions. Prefer precise language over inflated or promotional wording.",
      "IMRaD means Introduction, Methods, Results and Discussion. The introduction establishes the problem and objective; methods explain the plan; results present findings; discussion interprets them in context. Adapt the structure to the article type and journal requirements.",
      "Write methods in enough detail to reproduce recruitment, measurement and analysis. Present results in a logical order aligned with objectives, with denominators, units and uncertainty. Do not interpret or overstate results in the results section; reserve explanation and implications for the discussion.",
      "Cite the original source for claims, data and methods. Paraphrasing requires genuinely restating an idea and citing it; changing a few words is not sufficient. Use a reference manager carefully, verify metadata and follow the journal's citation and authorship policies.",
    ],
    quiz: [
      { question: "Which IMRaD section primarily explains how the study was conducted?", options: ["Introduction", "Methods", "Discussion"], answer: 1, explanation: "The Methods section describes design, participants, measurements and analysis." },
      { question: "What makes a methods description reproducible?", options: ["It specifies procedures and analysis decisions sufficiently", "It says only that data were analyzed", "It omits inconvenient details"], answer: 0, explanation: "Readers need enough detail to understand and potentially repeat the methods." },
      { question: "When must an idea be cited even if paraphrased?", options: ["When it comes from another source", "Only when copied word-for-word", "Never if written in different words"], answer: 0, explanation: "Paraphrasing changes wording, not ownership of the underlying idea." },
    ],
  },
  "scientific-publication": {
    introduction: "Publication communicates evidence to an audience and creates a permanent scholarly record. Ethical submission involves selecting an appropriate journal, documenting contributions, following reporting requirements and responding to editorial review transparently.",
    keyPoints: ["Match journal scope, audience and article type.", "Verify journal legitimacy, fees and editorial policies.", "Agree on authorship and contributions early.", "Disclose conflicts and follow publication ethics."],
    workedExample: { title: "Evaluate a journal invitation", prompt: "An unfamiliar journal promises guaranteed publication within a few days for a large fee.", explanation: "Check its scope, editorial board, peer-review process, indexing claims, fee transparency and publisher practices. Do not rely on a single badge or unsolicited invitation; seek institutional guidance if uncertain." },
    reflection: "What evidence would you gather before submitting to an unfamiliar journal?",
    lessonContent: [
      "Identify journals that publish the topic, design and article type and reach the intended readers. Review recent articles, author instructions and publication timelines. Consider open-access options and fees before submission, and confirm any funder or institutional requirements.",
      "Evaluate journal quality using transparent policies, identifiable editors, credible peer review, clear fees and verifiable indexing. Warning signs include guaranteed acceptance, misleading metrics, hidden charges and copied website content. No single checklist can replace careful verification.",
      "Agree on authorship based on substantial contributions and accountability, not seniority alone. Document each contributor's role, resolve order transparently and acknowledge non-author contributions. Disclose funding, conflicts of interest, registrations, protocol deviations and data availability accurately.",
      "Prepare a complete submission package: manuscript, cover letter, required checklists, figures, tables, approvals and declarations. Respond to reviewer comments point by point, remain professional and show exactly where revisions were made. Never submit the same manuscript to multiple journals simultaneously unless explicit policies allow it.",
    ],
    quiz: [
      { question: "What is a strong reason to choose a journal?", options: ["Its scope and readership fit the study", "It guarantees acceptance", "It has the shortest title"], answer: 0, explanation: "Scope and readership determine whether the article is appropriate and useful to the journal's audience." },
      { question: "What should authors do about conflicts of interest?", options: ["Disclose them according to journal policy", "Mention them only if a reviewer asks", "Remove them from the record"], answer: 0, explanation: "Transparent disclosure lets readers assess potential influences." },
      { question: "May the same manuscript normally be submitted to two journals simultaneously?", options: ["Yes, without disclosure", "No, follow standard exclusive-submission policies", "Only if both journals are open access"], answer: 1, explanation: "Simultaneous submission is generally prohibited and wastes editorial and reviewer effort." },
    ],
  },
  "reporting-guidelines": {
    introduction: "Reporting guidelines identify the information readers need to assess a study and use its findings. They complement good methods: a checklist can improve completeness but cannot make a flawed design valid.",
    keyPoints: ["Select a guideline that matches the study design.", "Use the checklist while planning and writing.", "Explain where each item is reported.", "Report limitations and deviations transparently."],
    workedExample: { title: "Choose the appropriate checklist", prompt: "A manuscript reports a prospective observational cohort.", explanation: "STROBE is designed for observational studies, including cohort designs. It prompts authors to report setting, participants, variables, bias, study size, missing data and analytical methods." },
    reflection: "Which reporting item would help a reader judge the biggest risk of bias in your study?",
    lessonContent: [
      "Reporting guidelines are minimum information recommendations tailored to study types. Find the current version through the EQUATOR Network and follow the journal's requested format. Use the checklist early enough to identify missing design details, not only at submission.",
      "CONSORT supports transparent reporting of randomized trials, including allocation, participant flow, outcomes and harms. Extensions cover particular trial designs and interventions. A flow diagram helps readers see how many participants were assigned, followed and analyzed.",
      "STROBE guides observational cohort, case-control and cross-sectional reports. It emphasizes setting, participant selection, variables, bias, study size, statistical methods and limitations. It does not prescribe how to design a study or prove that it is unbiased.",
      "PRISMA supports reporting systematic reviews and meta-analyses, including eligibility, search, selection, synthesis and certainty. Use the appropriate extension when applicable. Complete the checklist honestly and identify page or section locations; do not mark items complete if information is absent.",
    ],
    quiz: [
      { question: "Which guideline is designed for observational studies?", options: ["CONSORT", "STROBE", "PRISMA"], answer: 1, explanation: "STROBE addresses cohort, case-control and cross-sectional observational studies." },
      { question: "What does a reporting checklist do?", options: ["Promotes complete reporting", "Guarantees low risk of bias", "Replaces ethics review"], answer: 0, explanation: "Guidelines improve transparency and completeness but do not validate the underlying methods." },
      { question: "Which guideline is associated with systematic reviews?", options: ["PRISMA", "CONSORT", "CARE"], answer: 0, explanation: "PRISMA is a reporting guideline for systematic reviews and meta-analyses." },
    ],
  },
  "systematic-reviews": {
    introduction: "A systematic review answers a focused question using explicit methods to find, select, appraise and synthesize relevant studies. Meta-analysis is a statistical option when studies are sufficiently compatible; it is not required for every review.",
    keyPoints: ["Write and register a protocol before screening where possible.", "Predefine eligibility, outcomes and synthesis methods.", "Assess risk of bias and missing evidence.", "Interpret heterogeneity and certainty, not just the pooled estimate."],
    workedExample: { title: "Read a forest plot cautiously", prompt: "Studies show effects in different directions and have wide confidence intervals.", explanation: "A pooled estimate may obscure real differences in populations, interventions or methods. Examine study-level estimates, heterogeneity, risk of bias and the prediction range before deciding whether pooling is meaningful." },
    reflection: "What differences among studies could make a pooled average misleading?",
    lessonContent: [
      "A review protocol specifies the question, eligibility, sources, screening, extraction, risk-of-bias assessment and synthesis before results are known. Registration improves transparency and reveals changes; explain amendments and their timing rather than silently changing the plan.",
      "Search comprehensively, deduplicate records and screen against predefined criteria, ideally with independent reviewers and a resolution process. Record full-text exclusion reasons and show study flow. Extract study characteristics and outcomes using piloted forms.",
      "Assess risk of bias with tools appropriate to study design and outcome. Quantitative synthesis requires compatible questions, measures and methods; choose fixed- or random-effects approaches based on the estimand and assumptions, not merely a heterogeneity test.",
      "A forest plot displays study estimates and uncertainty; a pooled diamond is not automatically a definitive answer. Explore heterogeneity, small-study effects and publication bias cautiously. Use certainty frameworks such as GRADE to communicate confidence and implications for decisions.",
    ],
    quiz: [
      { question: "When is meta-analysis appropriate?", options: ["Whenever a review includes more than one study", "When studies are sufficiently compatible and pooling answers the question", "Only when every study has the same sample size"], answer: 1, explanation: "Statistical pooling requires meaningful compatibility and justified methods." },
      { question: "Why register or document a protocol?", options: ["To make planned methods transparent and identify changes", "To guarantee the review has no bias", "To avoid searching databases"], answer: 0, explanation: "A protocol makes planned decisions visible and helps readers assess selective changes." },
      { question: "What should high heterogeneity prompt?", options: ["Automatic deletion of outlying studies", "Investigation of clinical and methodological differences", "Ignoring study-level findings"], answer: 1, explanation: "Heterogeneity may reflect meaningful differences that need investigation and cautious synthesis." },
    ],
  },
  "proposal-and-thesis": {
    introduction: "A proposal or thesis brings the research pathway into one coherent, feasible plan. Its credibility depends on alignment: the rationale leads to a question, the question to objectives, and each objective to appropriate methods, analysis and ethical safeguards.",
    keyPoints: ["Build a concise rationale from the problem and evidence gap.", "Align objectives, variables, methods and analysis.", "Plan ethics, resources, risks and timelines realistically.", "Prepare for review, revision and dissemination."],
    workedExample: { title: "Build an alignment chain", prompt: "Estimate contraceptive uptake among first-time mothers in selected facilities.", explanation: "Define eligible participants and the setting; operationalize current use and recall period; choose a sampling plan; describe consent and privacy; then estimate prevalence with appropriate uncertainty. Every method should support an objective." },
    reflection: "Which link in your own proposal—rationale, question, methods, analysis or ethics—needs the most revision?",
    lessonContent: [
      "The background should move from the health problem to what is known, what remains uncertain and why answering the question matters. Support claims with current evidence and local context. Avoid a literature dump; synthesize sources into a specific, defensible gap.",
      "Methods should specify design, setting, population, eligibility, sample size, sampling, variables, instruments, procedures and analysis. Explain how each choice answers an objective. Include quality assurance and a plan for missing data, bias and protocol deviations.",
      "Ethics sections describe review, consent, risks, benefits, privacy, vulnerable groups, compensation and referral plans. A budget and timeline should reflect field realities, staff training, translation, transport, data management and dissemination—not just ideal conditions.",
      "A thesis plan needs milestones for approvals, piloting, collection, analysis, writing and feedback. Define supervisor and team roles, version-control documents and keep decisions documented. Plan how results will be shared with participants, communities, institutions and academic audiences.",
      "Prepare for proposal defense by explaining why the question matters, why the methods fit and what limitations remain. Respond to critique by distinguishing essential changes from preferences, updating the protocol consistently and obtaining review approval for changes when required.",
    ],
    quiz: [
      { question: "What does a well-aligned proposal connect?", options: ["The question, objectives, methods and analysis", "Only the title and budget", "The results and journal selection before data collection"], answer: 0, explanation: "Alignment ensures every method contributes to answering a stated objective." },
      { question: "What should a realistic timeline include?", options: ["Approvals, piloting, collection, analysis and writing", "Only the data-collection dates", "A fixed publication date regardless of review"], answer: 0, explanation: "Research includes preparation, ethics review, analysis, revision and dissemination." },
      { question: "When should a protocol change be documented?", options: ["Only after publication", "When it occurs, with rationale and required review", "Never, to keep the original version clean"], answer: 1, explanation: "Transparent versioning and ethics review preserve an accurate record of the study." },
    ],
  },
};

export function getAcademyLecture(slug: string): AcademyLecture | undefined {
  return lectures[slug];
}
