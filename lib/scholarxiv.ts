export interface ScholarXivPaper {
  arxivId: string;
  title: string;
  abstract: string;
  authors: string[];
  publishedAt: string | null;
  primaryCategory: string | null;
  categories: string[];
  doi: string | null;
  paperUrl: string;
  pdfUrl: string;
}

const ARXIV_ID_PATTERN =
  /^(?:\d{4}\.\d{4,5}|[a-z][a-z0-9.-]+\/\d{7})(?:v\d+)?$/i;

export function getArxivPaperLinks(arxivId: string): Pick<ScholarXivPaper, "paperUrl" | "pdfUrl"> {
  if (!ARXIV_ID_PATTERN.test(arxivId)) {
    throw new Error("Invalid arXiv identifier.");
  }
  const safeId = encodeURIComponent(arxivId).replace(/%2F/gi, "/");
  return {
    paperUrl: `https://arxiv.org/abs/${safeId}`,
    pdfUrl: `https://arxiv.org/pdf/${safeId}`,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function normalizeScholarXivPaper(value: unknown): ScholarXivPaper | null {
  if (!isRecord(value)) return null;

  const arxivId =
    typeof value.extractedID === "string"
      ? value.extractedID.trim()
      : typeof value.arxivId === "string"
        ? value.arxivId.trim()
        : "";
  const title =
    typeof value.title === "string" ? value.title.trim().slice(0, 1000) : "";
  const abstractValue =
    typeof value.summary === "string"
      ? value.summary
      : typeof value.abstract === "string"
        ? value.abstract
        : "";

  if (!ARXIV_ID_PATTERN.test(arxivId) || !title || !abstractValue.trim()) {
    return null;
  }

  const publishedValue =
    typeof value.published === "string"
      ? value.published
      : typeof value.publishedAt === "string"
        ? value.publishedAt
        : null;
  const publishedAt =
    publishedValue && !Number.isNaN(Date.parse(publishedValue))
      ? new Date(publishedValue).toISOString()
      : null;
  const primaryCategory =
    typeof value.primaryCategory === "string"
      ? value.primaryCategory.trim().slice(0, 100) || null
      : null;
  const doi =
    typeof value.doi === "string" ? value.doi.trim().slice(0, 300) || null : null;
  const links = getArxivPaperLinks(arxivId);

  return {
    arxivId,
    title,
    abstract: abstractValue.trim().slice(0, 20000),
    authors: stringArray(value.authors, 100, 300),
    publishedAt,
    primaryCategory,
    categories: stringArray(
      Array.isArray(value.category) ? value.category : value.categories,
      50,
      100
    ),
    doi,
    ...links,
  };
}
