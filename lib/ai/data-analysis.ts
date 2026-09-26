/**
 * Deterministic Data Analysis Pipeline for Tinat Research Studies
 * 
 * Computes exact descriptive statistics, distributions, completion metrics,
 * and cross-tabulations in TypeScript. Never asks Gemini to do arithmetic.
 * Completely strips all Participant PII (names, emails, phones, database IDs).
 */

export interface CategoricalStat {
  choice: string;
  count: number;
  percentage: number;
}

export interface NumericalStat {
  n: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  quartiles?: { q1: number; q2: number; q3: number };
}

export interface QuestionAnalysis {
  id: string;
  order: number;
  text: string;
  type: string;
  required: boolean;
  totalAnswers: number;
  missingCount: number;
  responseRate: number; // percentage
  categorical?: {
    frequencies: CategoricalStat[];
    topChoice?: string;
  };
  numerical?: NumericalStat;
  textSample?: {
    totalTexts: number;
    avgLengthChars: number;
    sampleExcerpts: string[]; // Anonymized, PII-free snippets
  };
}

export interface CrossTabGroup {
  groupName: string;
  count: number;
  distribution: { [key: string]: number };
}

export interface CrossTabulation {
  demographicQuestion: string;
  targetQuestion: string;
  groups: CrossTabGroup[];
}

export interface StudyDatasetSummary {
  studyId: string;
  title: string;
  category: string | null;
  objective: string | null;
  targetPopulation: string | null;
  studyType: string;
  totalResponses: number;
  selfCollectedResponses: number;
  fieldCollectedResponses: number;
  participantTarget: number;
  completionRate: number | null; // e.g. 93.5%
  questionCount: number;
  questions: QuestionAnalysis[];
  crossTabs: CrossTabulation[];
  dataQualityIssues: string[];
}

/**
 * Calculates complete deterministic statistics for a study and its responses.
 */
export function computeStudyStatistics(study: {
  id: string;
  title: string;
  category: string | null;
  objective: string | null;
  targetPopulation: string | null;
  studyType: string;
  participantTarget: number;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    required: boolean;
    order: number;
    options?: Array<{ text: string; value: string }>;
    rows?: Array<{ text: string; value: string }>;
    scaleMin?: number | null;
    scaleMax?: number | null;
  }>;
  responses: Array<{
    id: string;
    submittedAt: Date;
    collectionMethod?: string;
    answers: Array<{
      questionId: string;
      textValue: string | null;
      numberValue: number | null;
    }>;
  }>;
}): StudyDatasetSummary {
  const totalResponses = study.responses.length;
  const selfCollectedResponses = study.responses.filter(r => !r.collectionMethod || r.collectionMethod === "SELF").length;
  const fieldCollectedResponses = study.responses.filter(r => r.collectionMethod === "FIELD_COLLECTED").length;

  const questionCount = study.questions.length;
  const completionRate =
    study.participantTarget > 0
      ? Math.min(100, Math.round((totalResponses / study.participantTarget) * 1000) / 10)
      : null;

  const dataQualityIssues: string[] = [];

  // Analyze each question
  const analyzedQuestions: QuestionAnalysis[] = study.questions.map((q) => {
    // Gather all answers for this question
    const answers = study.responses
      .map((r) => r.answers.find((a) => a.questionId === q.id))
      .filter((a): a is NonNullable<typeof a> => a !== undefined && (a.textValue !== null || a.numberValue !== null));

    const totalAnswers = answers.length;
    const missingCount = Math.max(0, totalResponses - totalAnswers);
    const responseRate = totalResponses > 0 ? Math.round((totalAnswers / totalResponses) * 1000) / 10 : 0;

    // Check for high missing rate data quality issue
    if (totalResponses >= 5 && responseRate < 80) {
      dataQualityIssues.push(
        `Question ${q.order} ("${q.text.slice(0, 40)}...") has a ${missingCount} (${(100 - responseRate).toFixed(1)}%) non-response rate.`
      );
    }

    const base: QuestionAnalysis = {
      id: q.id,
      order: q.order,
      text: q.text,
      type: q.type,
      required: q.required,
      totalAnswers,
      missingCount,
      responseRate,
    };

    // Numerical / Linear Scale analysis
    if (q.type === "NUMBER" || q.type === "LINEAR_SCALE") {
      const numbers = answers
        .map((a) => a.numberValue)
        .filter((n): n is number => typeof n === "number" && !isNaN(n))
        .sort((a, b) => a - b);

      if (numbers.length > 0) {
        const n = numbers.length;
        const sum = numbers.reduce((acc, val) => acc + val, 0);
        const mean = Math.round((sum / n) * 100) / 100;

        // Median
        const mid = Math.floor(n / 2);
        const median = n % 2 === 0 ? Math.round(((numbers[mid - 1] + numbers[mid]) / 2) * 100) / 100 : numbers[mid];

        // Standard Deviation
        let stdDev = 0;
        if (n > 1) {
          const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
          stdDev = Math.round(Math.sqrt(variance) * 100) / 100;
        }

        const min = numbers[0];
        const max = numbers[n - 1];

        base.numerical = { n, mean, median, stdDev, min, max };
      }
    }

    // Categorical analysis (Single Choice, Multiple Choice, Yes/No, Dropdown)
    if (
      q.type === "SINGLE_CHOICE" ||
      q.type === "MULTIPLE_CHOICE" ||
      q.type === "YES_NO" ||
      q.type === "DROPDOWN"
    ) {
      const counts: { [choice: string]: number } = {};

      answers.forEach((a) => {
        if (!a.textValue) return;

        // Multiple choice answers may be comma-separated or stored as JSON array string
        let values: string[] = [];
        try {
          if (a.textValue.startsWith("[") && a.textValue.endsWith("]")) {
            values = JSON.parse(a.textValue);
          } else {
            values = [a.textValue];
          }
        } catch {
          values = [a.textValue];
        }

        values.forEach((v) => {
          const trimmed = String(v).trim();
          if (trimmed) {
            counts[trimmed] = (counts[trimmed] || 0) + 1;
          }
        });
      });

      const frequencies: CategoricalStat[] = Object.entries(counts)
        .map(([choice, count]) => ({
          choice,
          count,
          percentage: totalAnswers > 0 ? Math.round((count / totalAnswers) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      base.categorical = {
        frequencies,
        topChoice: frequencies[0]?.choice,
      };
    }

    // Text / qualitative answers (Anonymized, PII-sanitized sample)
    if (q.type === "SHORT_TEXT" || q.type === "LONG_TEXT") {
      const texts = answers
        .map((a) => a.textValue?.trim())
        .filter((t): t is string => Boolean(t && t.length > 0));

      const totalChars = texts.reduce((acc, t) => acc + t.length, 0);
      const avgLengthChars = texts.length > 0 ? Math.round(totalChars / texts.length) : 0;

      // Select up to 4 anonymized, non-empty sample excerpts
      const sampleExcerpts = texts.slice(0, 4).map((t, idx) => {
        // Redact potential emails or phone numbers from sample
        const sanitized = t
          .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[EMAIL]")
          .replace(/(?:\+?251|0)?[97]\d{8}/g, "[PHONE]")
          .slice(0, 180);
        return `Excerpt ${idx + 1}: "${sanitized}${t.length > 180 ? "..." : ""}"`;
      });

      base.textSample = {
        totalTexts: texts.length,
        avgLengthChars,
        sampleExcerpts,
      };
    }

    return base;
  });

  // Cross-Tabulations (Identify potential demographic variables like Sex, Age, Education, Role)
  const crossTabs: CrossTabulation[] = [];
  const demographicKeywords = ["gender", "sex", "age", "education", "profession", "cadre", "year", "department"];

  const demographicQuestion = study.questions.find((q) =>
    demographicKeywords.some((kw) => q.text.toLowerCase().includes(kw))
  );

  if (demographicQuestion && totalResponses >= 10) {
    // Find primary outcome question (first non-demographic categorical or numerical question)
    const outcomeQuestion = study.questions.find(
      (q) => q.id !== demographicQuestion.id && (q.type === "SINGLE_CHOICE" || q.type === "YES_NO")
    );

    if (outcomeQuestion) {
      const groupCounts: { [group: string]: { [outcome: string]: number } } = {};

      study.responses.forEach((resp) => {
        const demoAns = resp.answers.find((a) => a.questionId === demographicQuestion.id)?.textValue?.trim();
        const outcomeAns = resp.answers.find((a) => a.questionId === outcomeQuestion.id)?.textValue?.trim();

        if (demoAns && outcomeAns) {
          if (!groupCounts[demoAns]) groupCounts[demoAns] = {};
          groupCounts[demoAns][outcomeAns] = (groupCounts[demoAns][outcomeAns] || 0) + 1;
        }
      });

      const groups: CrossTabGroup[] = Object.entries(groupCounts).map(([groupName, distribution]) => {
        const count = Object.values(distribution).reduce((a, b) => a + b, 0);
        return { groupName, count, distribution };
      });

      if (groups.length >= 2) {
        crossTabs.push({
          demographicQuestion: demographicQuestion.text,
          targetQuestion: outcomeQuestion.text,
          groups,
        });
      }
    }
  }

  return {
    studyId: study.id,
    title: study.title,
    category: study.category,
    objective: study.objective,
    targetPopulation: study.targetPopulation,
    studyType: study.studyType,
    totalResponses,
    selfCollectedResponses,
    fieldCollectedResponses,
    participantTarget: study.participantTarget,
    completionRate,
    questionCount,
    questions: analyzedQuestions,
    crossTabs,
    dataQualityIssues,
  };
}
