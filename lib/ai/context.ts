import { StudyDatasetSummary } from "./data-analysis";

/**
 * Formats deterministic study statistics into a structured, token-efficient
 * context block for Gemini.
 */
export function formatStudyContext(summary: StudyDatasetSummary): string {
  const parts: string[] = [];

  // Study Metadata
  parts.push(`=== STUDY METADATA ===`);
  parts.push(`Title: "${summary.title}"`);
  if (summary.category) parts.push(`Research Category: ${summary.category}`);
  parts.push(`Study Type: ${summary.studyType}`);
  if (summary.objective) parts.push(`Research Objective: "${summary.objective}"`);
  if (summary.targetPopulation) parts.push(`Target Population: "${summary.targetPopulation}"`);
  parts.push(`Total Participants (Completed Responses): ${summary.totalResponses}`);
  if (summary.fieldCollectedResponses > 0) {
    parts.push(`- Self-Collected (App): ${summary.selfCollectedResponses}`);
    parts.push(`- Field-Collected (By Verified Data Collectors): ${summary.fieldCollectedResponses}`);
  }
  if (summary.participantTarget > 0) {
    parts.push(`Participant Target: ${summary.participantTarget}`);
    if (summary.completionRate !== null) {
      parts.push(`Cohort Completion Rate: ${summary.completionRate}%`);
    }
  }

  // Data Quality Flags
  if (summary.dataQualityIssues.length > 0) {
    parts.push(`\n=== DATA QUALITY & MISSING VALUES ===`);
    summary.dataQualityIssues.forEach((issue) => parts.push(`- ${issue}`));
  }

  // Question-by-Question Verified Results
  parts.push(`\n=== QUESTION-BY-QUESTION VERIFIED RESULTS (${summary.questions.length} questions) ===`);

  summary.questions.forEach((q) => {
    const qHeader = `[Q${q.order}] (${q.type}) "${q.text}" -> ${q.totalAnswers} answered, ${q.missingCount} missing (${q.responseRate}% response rate)`;
    parts.push(qHeader);

    // Categorical
    if (q.categorical && q.categorical.frequencies.length > 0) {
      const freqList = q.categorical.frequencies
        .map((f) => `    * "${f.choice}": ${f.count} (${f.percentage}%)`)
        .join("\n");
      parts.push(freqList);
    }

    // Numerical
    if (q.numerical) {
      const num = q.numerical;
      parts.push(
        `    * Statistics (n=${num.n}): Mean = ${num.mean}, Median = ${num.median}, StdDev = ${num.stdDev}, Min = ${num.min}, Max = ${num.max}`
      );
    }

    // Text Samples
    if (q.textSample && q.textSample.sampleExcerpts.length > 0) {
      parts.push(`    * Anonymized Text Responses (${q.textSample.totalTexts} total, avg length: ${q.textSample.avgLengthChars} chars):`);
      q.textSample.sampleExcerpts.forEach((ex) => parts.push(`      - ${ex}`));
    }
  });

  // Cross-Tabulations
  if (summary.crossTabs && summary.crossTabs.length > 0) {
    parts.push(`\n=== CROSS-TABULATIONS & SUBGROUPS ===`);
    summary.crossTabs.forEach((ct) => {
      parts.push(`Cross-tabulation: "${ct.demographicQuestion}" VS "${ct.targetQuestion}":`);
      ct.groups.forEach((g) => {
        const distStr = Object.entries(g.distribution)
          .map(([k, v]) => `${k}: ${v} (${g.count > 0 ? Math.round((v / g.count) * 100) : 0}%)`)
          .join(", ");
        parts.push(`  * ${g.groupName} (n=${g.count}): ${distStr}`);
      });
    });
  }

  return parts.join("\n");
}

/**
 * Dynamically generates 4-6 smart suggestion prompts tailored to the study's specific questions.
 */
export function generateSuggestedQuestions(summary: StudyDatasetSummary): string[] {
  const suggestions: string[] = [
    "What are the main findings of this study?",
    "Summarize participant demographics and cohort representation.",
  ];

  // Look for categorical or symptom questions
  const healthOrOutcomeQuestion = summary.questions.find(
    (q) =>
      q.order > 1 &&
      (q.type === "SINGLE_CHOICE" || q.type === "YES_NO" || q.type === "LINEAR_SCALE" || q.type === "NUMBER")
  );

  if (healthOrOutcomeQuestion) {
    suggestions.push(`What does the data show regarding "${healthOrOutcomeQuestion.text.slice(0, 45)}..."?`);
  }

  if (summary.crossTabs.length > 0) {
    suggestions.push(`Compare findings across the different participant groups.`);
  } else {
    suggestions.push(`What patterns or co-occurrences are evident in the responses?`);
  }

  if (summary.dataQualityIssues.length > 0) {
    suggestions.push(`What data quality issues or missing values should I address?`);
  } else {
    suggestions.push(`What are the key methodological limitations of this survey?`);
  }

  suggestions.push("Draft academic discussion points for publication.");

  return suggestions;
}
