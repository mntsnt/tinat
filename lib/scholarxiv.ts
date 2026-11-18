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

export const SCHOLARXIV_CATEGORIES = [
  { code: "", label: "All Disciplines" },
  { code: "cs.AI", label: "Artificial Intelligence (cs.AI)" },
  { code: "cs.LG", label: "Machine Learning (cs.LG)" },
  { code: "cs.CL", label: "Computation & Language / NLP (cs.CL)" },
  { code: "cs.CV", label: "Computer Vision & Medical Imaging (cs.CV)" },
  { code: "q-bio.QM", label: "Quantitative Biology & Medicine (q-bio)" },
  { code: "stat.ML", label: "Statistical Learning & Data (stat.ML)" },
  { code: "stat.AP", label: "Applied Statistics & Public Health (stat.AP)" },
  { code: "econ.EM", label: "Econometrics & Survey Data (econ.EM)" },
  { code: "econ.GN", label: "General Economics & Policy (econ.GN)" },
  { code: "physics.soc-ph", label: "Social Physics & Demography" },
] as const;

export function generateBibtex(paper: ScholarXivPaper): string {
  const firstAuthorLastName = (paper.authors[0] || "Author")
    .split(" ")
    .pop()
    ?.replace(/[^a-zA-Z]/g, "")
    .toLowerCase() || "paper";
  const year = paper.publishedAt
    ? new Date(paper.publishedAt).getFullYear()
    : new Date().getFullYear();
  const citeKey = `${firstAuthorLastName}${year}${paper.arxivId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const authorsBib = paper.authors.join(" and ");

  return `@article{${citeKey},
  title = {${paper.title}},
  author = {${authorsBib || "Unknown"}},
  year = {${year}},
  eprint = {${paper.arxivId}},
  archivePrefix = {arXiv},
  primaryClass = {${paper.primaryCategory || "cs.AI"}},
  url = {${paper.paperUrl}}${paper.doi ? `,\n  doi = {${paper.doi}}` : ""}
}`;
}

export function generateApaCitation(paper: ScholarXivPaper): string {
  const year = paper.publishedAt
    ? new Date(paper.publishedAt).getFullYear()
    : "n.d.";
  const authorText =
    paper.authors.length > 0
      ? paper.authors.length <= 2
        ? paper.authors.join(" & ")
        : `${paper.authors[0]} et al.`
      : "Unknown Author";

  return `${authorText} (${year}). ${paper.title}. arXiv preprint arXiv:${paper.arxivId}. ${paper.doi ? `https://doi.org/${paper.doi}` : paper.paperUrl}`;
}

export function generateMlaCitation(paper: ScholarXivPaper): string {
  const authorText =
    paper.authors.length > 0
      ? paper.authors.length === 1
        ? paper.authors[0]
        : `${paper.authors[0]}, et al.`
      : "Anonymous";
  const year = paper.publishedAt
    ? new Date(paper.publishedAt).getFullYear()
    : "";

  return `${authorText}. "${paper.title}." arXiv preprint arXiv:${paper.arxivId}${year ? ` (${year})` : ""}. Web.`;
}

export function generateChicagoCitation(paper: ScholarXivPaper): string {
  const authorText =
    paper.authors.length > 0
      ? paper.authors.length <= 3
        ? paper.authors.join(", ")
        : `${paper.authors[0]} et al.`
      : "Anonymous";
  const year = paper.publishedAt
    ? new Date(paper.publishedAt).getFullYear()
    : "n.d.";

  return `${authorText}. "${paper.title}." arXiv preprint arXiv:${paper.arxivId} (${year}). ${paper.paperUrl}.`;
}

export function generateStudyRationaleSnippet(paper: ScholarXivPaper): string {
  const authorText = paper.authors.length > 0 ? `${paper.authors[0]} et al.` : "Recent research";
  const year = paper.publishedAt ? new Date(paper.publishedAt).getFullYear() : "recent studies";
  return `Prior research by ${authorText} (${year}) on "${paper.title}" (arXiv:${paper.arxivId}) provides foundational methodology and empirical grounding for this study's investigation and cohort metrics.`;
}

export interface FetchScholarXivParams {
  query?: string;
  category?: string;
  title?: string;
  page?: number;
  limit?: number;
  sortBy?: "relevance" | "submittedDate";
  sortOrder?: "descending" | "ascending";
  apiKey: string;
}

export interface ScholarXivSearchResult {
  papers: ScholarXivPaper[];
  pagination: {
    page: number;
    hasMore: boolean;
    nextPage: number | null;
  };
}

export async function fetchScholarXivPapers({
  query,
  category,
  title,
  page = 0,
  limit = 10,
  sortBy = "relevance",
  sortOrder = "descending",
  apiKey,
}: FetchScholarXivParams): Promise<ScholarXivSearchResult> {
  const searchFilterString: Record<string, string> = {};
  if (query?.trim()) searchFilterString.all = query.trim();
  if (category?.trim()) searchFilterString.cat = category.trim();
  if (title?.trim()) searchFilterString.ti = title.trim();

  // If nothing is passed, default to a broad search
  if (Object.keys(searchFilterString).length === 0) {
    searchFilterString.all = "health medicine";
  }

  const upstream = await fetch("https://scholarxiv.com/api/v1/papers/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      searchFilterString,
      page,
      limit,
      sortBy,
      sortOrder,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  const payload: unknown = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const upstreamMessage =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error.slice(0, 500)
        : "ScholarXIV could not complete the search.";
    if (upstream.status === 401) {
      throw new Error("ScholarXIV rejected the configured API key. Check the server environment variable.");
    }
    throw new Error(upstreamMessage);
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("data" in payload) ||
    !Array.isArray(payload.data) ||
    !("pagination" in payload) ||
    typeof payload.pagination !== "object" ||
    payload.pagination === null
  ) {
    throw new Error("ScholarXIV returned an unexpected response format.");
  }

  const pagination = payload.pagination as {
    page?: unknown;
    hasMore?: unknown;
    nextPage?: unknown;
  };

  const pageNum = typeof pagination.page === "number" ? pagination.page : page;
  const hasMore = typeof pagination.hasMore === "boolean" ? pagination.hasMore : false;
  const nextPage = typeof pagination.nextPage === "number" ? pagination.nextPage : null;

  const papers = payload.data
    .map(normalizeScholarXivPaper)
    .filter((paper): paper is ScholarXivPaper => paper !== null);

  return {
    papers,
    pagination: {
      page: pageNum,
      hasMore,
      nextPage,
    },
  };
}
