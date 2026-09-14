/**
 * Medical & Health Research Prompt Templates for Tinat
 * 
 * Enforces strict scientific integrity, clinical safety guardrails,
 * and academic research formatting.
 */

export const MEDICAL_RESEARCH_SYSTEM_PROMPT = `
You are the Tinat AI Research Assistant, an expert medical and epidemiological research analyst supporting health researchers on the Tinat Research Platform.

Your role is to help researchers interpret, summarize, and understand empirical survey data collected from their health and medical studies.

CRITICAL MEDICAL RESEARCH SAFETY AND ETHICS RULES:
1. RESEARCH ANALYSIS ONLY - NO MEDICAL DIAGNOSIS OR CLINICAL ADVICE:
   - You are analyzing study datasets, not providing medical diagnosis, clinical management, or treatment plans for individual participants.
   - If participant responses include symptoms or health complaints, phrase findings strictly as survey reports:
     * CORRECT: "Among participants, 42.1% (n = 85) reported experiencing sleep disturbance."
     * INCORRECT: "85 participants have clinical insomnia."
   - Avoid unsupported clinical leaps or definitive diagnoses.

2. NEVER HALLUCINATE OR INVENT NUMBERS:
   - Every single statistic, percentage, participant count (n), mean, or numerical value you mention MUST originate directly from the verified study summary provided to you in the prompt.
   - If a specific cross-tabulation, correlation, or variable was not collected or is missing, explicitly state:
     "The available dataset is insufficient to determine this."
   - Never invent p-values, confidence intervals, or sample sizes.

3. CAUTIOUS RESEARCH LANGUAGE - CORRELATION VS. CAUSATION:
   - Most platform studies are cross-sectional or survey-based. Always distinguish between observed associations and causation:
     * Use phrasing: "The data show an observed difference...", "An association was observed...", "These results suggest...", "Further longitudinal investigation may be warranted..."
     * Never declare causation (e.g., avoid "Variable X causes Variable Y").
   - If formal inferential statistical testing (e.g., chi-square, t-test, ANOVA) is not presented, state that observed differences reflect sample trends rather than statistically confirmed significance.

4. METHODOLOGICAL AWARENESS:
   - Consider potential biases: self-report bias, selection bias, non-response bias, recall bias, and confounding variables.
   - Note sample limitations (e.g., small sample sizes, convenience sampling, missing answers).

5. FORMATTING:
   - Format responses clearly using markdown headings, bullet points, and high-readability sections:
     ### Key Findings
     ### Supporting Data
     ### Interpretation & Methodological Context
     ### Limitations & Considerations
     ### Suggested Follow-up Analysis
   - Conclude every analysis with the standard notice:
     *AI-generated research draft — verify with a statistician or research supervisor before publication.*
`;

export type AnalysisAction =
  | "summarize_findings"
  | "analyze_demographics"
  | "identify_patterns"
  | "compare_groups"
  | "analyze_missing_data"
  | "identify_limitations"
  | "generate_abstract"
  | "generate_discussion";

export const ACTION_PROMPTS: Record<AnalysisAction, (contextText: string) => string> = {
  summarize_findings: (contextText) => `
Please provide an Executive Research Summary of the findings from this study dataset:

${contextText}

Structure your response into:
1. **Executive Summary** (Overview of sample size, primary study objective, and core outcome)
2. **Key Findings** (Top 3-5 empirical observations with exact calculated counts and percentages)
3. **Supporting Data Table** (Concise summary of central variables)
4. **Epidemiological & Public Health Interpretation** (What the observed data suggest in research context)
5. **Limitations & Contextual Caution** (Sample size, survey design, self-reporting)
`,

  analyze_demographics: (contextText) => `
Please conduct a Participant Demographics and Sample Representativeness Analysis:

${contextText}

Structure your response into:
1. **Cohort Composition** (Breakdown of demographic variables present in the study)
2. **Sample Representativeness** (How well the cohort aligns with the intended target population)
3. **Subgroup Distribution** (Balance across groups, potential over- or under-represented segments)
4. **Methodological Recommendations** (Suggestions for post-stratification or targeted recruitment if applicable)
`,

  identify_patterns: (contextText) => `
Please analyze the dataset for empirical patterns, trends, and notable response clusters:

${contextText}

Structure your response into:
1. **Primary Response Trends** (Dominant responses and prevailing patterns)
2. **Observed Co-Occurrences** (Responses that tend to track together based on calculated distributions)
3. **Notable Variances & Outliers** (Questions with high dispersion or unexpected response spread)
4. **Epidemiological Insights** (Potential hypotheses suggested by the observed distribution)
`,

  compare_groups: (contextText) => `
Please provide a Group Comparison Analysis based on the available subgroup cross-tabulations:

${contextText}

Structure your response into:
1. **Subgroup Comparison Summary** (Observed differences between defined participant groups)
2. **Comparative Data** (Exact group frequencies and percentage comparisons)
3. **Interpretation Caution** (Clarify that differences represent observed sample variation; do not claim statistical significance without formal hypothesis testing)
4. **Confounding Considerations** (Potential factors that could account for observed variations)
`,

  analyze_missing_data: (contextText) => `
Please evaluate Data Quality, Response Completeness, and Missing Value Patterns:

${contextText}

Structure your response into:
1. **Data Completeness Overview** (Overall response rate, drop-off rates, and completion efficiency)
2. **Questions with Non-Response** (Identify any questions with elevated missing values)
3. **Potential Non-Response & Attrition Bias** (Could missing answers be systematic or related to question sensitivity/length?)
4. **Data Hygiene Recommendations** (Suggestions for managing incomplete responses in formal reporting)
`,

  identify_limitations: (contextText) => `
Please identify Methodological Limitations and Potential Biases for this study:

${contextText}

Structure your response into:
1. **Study Design Constraints** (Cross-sectional survey limitations, inability to evaluate temporality)
2. **Sampling & Selection Factors** (Target cohort, convenience sampling, recruitment reach)
3. **Measurement & Information Biases** (Self-report instruments, recall accuracy, social desirability)
4. **Suggested Robustness Checks** (Recommended analytical steps to test stability of findings)
`,

  generate_abstract: (contextText) => `
Please generate a formal Academic Abstract Draft based strictly on the verified data:

${contextText}

Format as a structured scientific abstract:
- **Background**: Brief clinical/public health context based on study objective.
- **Objectives**: Primary research question.
- **Methods**: Study type, target cohort, sample size (n), questionnaire format.
- **Results**: Primary descriptive findings with exact percentages and frequencies.
- **Conclusion**: Cautious research conclusion reflecting only verified results.
- **Keywords**: 4-6 relevant MeSH or health research terms.

*Mark clearly as an AI-generated draft.*
`,

  generate_discussion: (contextText) => `
Please draft Academic Discussion Points and Implications for this study:

${contextText}

Structure your response into:
1. **Principal Findings Contextualized** (Discussing results in broader health research literature context)
2. **Implications for Healthcare & Public Health Practice** (Practical relevance if findings are replicated)
3. **Future Research Directions** (Questions that remain unanswered, longitudinal or intervention studies needed)
4. **Final Takeaway** (Concise closing reflection grounded in the data)
`,
};

export function buildChatUserPrompt(userQuestion: string, contextText: string): string {
  return `
STUDY DATASET CONTEXT:
${contextText}

RESEARCHER'S QUESTION:
"${userQuestion}"

Please answer the researcher's question based strictly on the verified study dataset provided above. If the question asks for information not contained in the data, explain clearly what the data can and cannot answer.
`;
}
