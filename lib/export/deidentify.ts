/**
 * Export De-identification & Privacy Preservation Engine
 *
 * Requirements (Part 1):
 * 1. Remove direct identifiers: userId, name, email, phone, Fayda data, ipHash, deviceFingerprint.
 * 2. Coded participant identifier: Uses non-guessable respondentCode only.
 * 3. Age banding: Numerical ages banded into brackets (<18, 18-24, 25-34, 35-44, 45-54, 55-64, 65+).
 * 4. Geographic generalization: Detailed addresses/kebeles generalized to broader region/zone.
 * 5. Small-cell suppression: Suppress categories with frequencies < minCellSize (default 5).
 * 6. Free-text flagging: Mark free-text columns with [FREE_TEXT_NEEDS_REVIEW].
 * 7. Codebook generation: Comprehensive metadata documenting applied transformations and dictionary.
 */

export interface DeidentifyOptions {
  minCellSize?: number; // default: 5
  generalizeGeography?: boolean; // default: true
  bandAges?: boolean; // default: true
}

export interface QuestionMeta {
  id: string;
  text: string;
  type: string;
  options?: Array<{ text: string; value: string }>;
  rows?: Array<{ text: string; value: string }>;
}

export interface RawResponseRow {
  id: string;
  respondentCode: string;
  submittedAt: Date | string;
  answers: Record<string, string | number | null | undefined>;
}

export interface DeidentifiedExportResult {
  headers: string[];
  rows: Array<Record<string, string | number>>;
  codebook: {
    studyMetadata: Record<string, string | number>;
    columns: Array<{
      header: string;
      originalQuestionId?: string;
      originalText?: string;
      type: string;
      transformations: string[];
    }>;
    suppressedCellsCount: number;
    disclaimer: string;
  };
}

/**
 * Standard demographic age bander
 */
export function bandAge(age: number): string {
  if (isNaN(age)) return "Unknown";
  if (age < 18) return "<18";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  if (age <= 64) return "55-64";
  return "65+";
}

/**
 * Checks if a question relates to age
 */
function isAgeQuestion(questionText: string): boolean {
  const normalized = questionText.toLowerCase();
  return (
    /\bage\b/i.test(normalized) ||
    /how old/i.test(normalized) ||
    /year of birth/i.test(normalized)
  );
}

/**
 * Checks if a question relates to geographical location
 */
function isGeoQuestion(questionText: string): boolean {
  const normalized = questionText.toLowerCase();
  return (
    /kebele/i.test(normalized) ||
    /woreda/i.test(normalized) ||
    /address/i.test(normalized) ||
    /location/i.test(normalized) ||
    /street/i.test(normalized)
  );
}

/**
 * Generalizes detailed geographic addresses
 */
export function generalizeGeography(value: string): string {
  if (!value) return value;
  // If specific kebele / house / street is provided, generalize
  let generalized = value;
  if (/kebele\s*\d+/i.test(generalized)) {
    generalized = generalized.replace(/kebele\s*\d+/gi, "[Kebele Suppressed]");
  }
  if (/house\s*(no\.?|number)?\s*\d+/i.test(generalized)) {
    generalized = generalized.replace(/house\s*(no\.?|number)?\s*\d+/gi, "[House No. Suppressed]");
  }
  if (/street\s*\d+/i.test(generalized)) {
    generalized = generalized.replace(/street\s*\d+/gi, "[Street Suppressed]");
  }
  return generalized;
}

/**
 * Processes research responses through the de-identification engine.
 */
export function deidentifyDataset(params: {
  study: { id: string; title: string; objective?: string | null };
  questions: QuestionMeta[];
  responses: RawResponseRow[];
  options?: DeidentifyOptions;
}): DeidentifiedExportResult {
  const { study, questions, responses, options = {} } = params;
  const minCellSize = options.minCellSize ?? 5;
  const shouldBandAges = options.bandAges ?? true;
  const shouldGeneralizeGeo = options.generalizeGeography ?? true;

  // 1. Calculate categorical frequencies for small-cell suppression
  const categoryFrequencies: Record<string, Record<string, number>> = {};
  for (const q of questions) {
    if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN", "YES_NO"].includes(q.type)) {
      categoryFrequencies[q.id] = {};
    }
  }

  for (const resp of responses) {
    for (const q of questions) {
      if (categoryFrequencies[q.id]) {
        const val = resp.answers[q.id];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          const strVal = String(val).trim();
          categoryFrequencies[q.id][strVal] = (categoryFrequencies[q.id][strVal] || 0) + 1;
        }
      }
    }
  }

  // 2. Build headers and column transformations
  const headers: string[] = ["Respondent Code", "Submission Timestamp"];
  const columnCodebook: DeidentifiedExportResult["codebook"]["columns"] = [
    {
      header: "Respondent Code",
      type: "STRING",
      transformations: ["Pseudonymization: Cryptographically random identifier separated from user profile"],
    },
    {
      header: "Submission Timestamp",
      type: "DATETIME",
      transformations: ["Standardized ISO timestamp"],
    },
  ];

  const questionHeaderMap: Record<string, string> = {};

  for (const q of questions) {
    let headerName = q.text;
    const transformations: string[] = [];

    // Free text check
    if (q.type === "SHORT_TEXT" || q.type === "LONG_TEXT") {
      headerName = `${q.text} [FREE_TEXT_NEEDS_REVIEW]`;
      transformations.push("Flagged for manual review: Unstructured text may contain participant PII");
    }

    if (shouldBandAges && isAgeQuestion(q.text)) {
      transformations.push("Age banding applied: Numerical ages converted into 10-year demographic brackets");
    }

    if (shouldGeneralizeGeo && isGeoQuestion(q.text)) {
      transformations.push("Geographic generalization applied: Kebele, house, and street details suppressed");
    }

    if (categoryFrequencies[q.id]) {
      transformations.push(`Small-cell suppression applied: Categories with frequency < ${minCellSize} suppressed`);
    }

    questionHeaderMap[q.id] = headerName;
    headers.push(headerName);
    columnCodebook.push({
      header: headerName,
      originalQuestionId: q.id,
      originalText: q.text,
      type: q.type,
      transformations: transformations.length > 0 ? transformations : ["None (Standard format)"],
    });
  }

  // 3. Process rows with de-identification transformations
  let suppressedCellsCount = 0;

  const transformedRows: Array<Record<string, string | number>> = responses.map((resp) => {
    const row: Record<string, string | number> = {
      "Respondent Code": resp.respondentCode,
      "Submission Timestamp": typeof resp.submittedAt === "string" ? resp.submittedAt : resp.submittedAt.toISOString(),
    };

    for (const q of questions) {
      const headerName = questionHeaderMap[q.id];
      const rawVal = resp.answers[q.id];

      if (rawVal === undefined || rawVal === null || rawVal === "") {
        row[headerName] = "";
        continue;
      }

      let processedVal: string | number = rawVal;

      // Age banding
      if (shouldBandAges && isAgeQuestion(q.text)) {
        const numAge = Number(rawVal);
        if (!isNaN(numAge)) {
          processedVal = bandAge(numAge);
        }
      }

      // Geo generalization
      if (shouldGeneralizeGeo && isGeoQuestion(q.text)) {
        processedVal = generalizeGeography(String(processedVal));
      }

      // Small-cell suppression
      if (categoryFrequencies[q.id]) {
        const strVal = String(rawVal).trim();
        const freq = categoryFrequencies[q.id][strVal] || 0;
        if (freq > 0 && freq < minCellSize) {
          processedVal = "<5 (Suppressed for Privacy)";
          suppressedCellsCount++;
        }
      }

      row[headerName] = processedVal;
    }

    return row;
  });

  return {
    headers,
    rows: transformedRows,
    codebook: {
      studyMetadata: {
        "Study ID": study.id,
        "Study Title": study.title,
        "Objective": study.objective || "Research Study",
        "Total Responses": responses.length,
        "Export Generated At": new Date().toISOString(),
        "Small-Cell Threshold": minCellSize,
      },
      columns: columnCodebook,
      suppressedCellsCount,
      disclaimer:
        "CONFIDENTIAL RESEARCH DATA: This dataset has been de-identified in accordance with the Ethiopian Personal Data Protection Proclamation 1321/2024. Direct identifiers have been removed, identities coded via secure random respondent codes, and rare categorical values suppressed. Columns marked [FREE_TEXT_NEEDS_REVIEW] contain unstructured text and must be manually inspected for incidental identifiers prior to external sharing.",
    },
  };
}
