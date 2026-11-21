"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  ExternalLink,
  FileText,
  BookmarkCheck,
  Bookmark,
  Sparkles,
  Quote,
  Copy,
  Check,
  Plus,
  LoaderCircle,
  Filter,
  ArrowUpDown,
  Share2,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  X,
  Compass,
  ListChecks,
  Globe,
  ArrowRight,
  CheckCheck,
  Layers,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArtifactRenderer } from "@/app/ai/components/ArtifactRenderer";
import {
  type ScholarXivPaper,
  SCHOLARXIV_CATEGORIES,
  generateBibtex,
  generateApaCitation,
  generateMlaCitation,
  generateChicagoCitation,
  generateStudyRationaleSnippet,
} from "@/lib/scholarxiv";

interface SavedReferenceItem extends ScholarXivPaper {
  id: string;
  savedAt: string;
  project?: {
    id: string;
    title: string;
    status: string;
  };
}

interface UserProject {
  id: string;
  title: string;
  currentPhase?: string;
  status: string;
}

const QUICK_TOPICS = [
  "Public health surveillance",
  "Health economics Ethiopia",
  "Clinical survey methodology",
  "Epidemiological data collection",
  "Mobile health low resource",
  "Machine learning clinical diagnosis",
  "Vaccine hesitancy survey",
  "Socioeconomic demographic indicators",
];

const markdownComponents = {
  h1: ({ children, ...props }: any) => (
    <h2 className="text-base font-bold text-foreground mt-4 mb-2 pb-1.5 border-b border-border flex items-center gap-2" {...props}>
      {children}
    </h2>
  ),
  h2: ({ children, ...props }: any) => (
    <h3 className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-4 mb-2 flex items-center gap-1.5" {...props}>
      {children}
    </h3>
  ),
  h3: ({ children, ...props }: any) => (
    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mt-3 mb-1" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-xs text-foreground/90 leading-relaxed mb-3 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="space-y-1.5 text-xs text-foreground/90 mb-3 pl-4 list-disc marker:text-purple-500" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="space-y-1.5 text-xs text-foreground/90 mb-3 pl-4 list-decimal marker:text-purple-500 font-medium" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-relaxed font-normal" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-purple-500 bg-purple-500/5 px-3.5 py-2.5 rounded-r-xl italic text-xs text-foreground/90 my-3" {...props}>
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }: any) => (
    <code className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-[11px] text-purple-700 dark:text-purple-300 border border-border" {...props}>
      {children}
    </code>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-border">
      <table className="min-w-full divide-y divide-border text-xs" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: any) => (
    <th className="bg-muted/80 px-3 py-2 text-left text-[11px] font-semibold text-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-3 py-2 border-t border-border/50 text-foreground/90 text-xs" {...props}>
      {children}
    </td>
  ),
  hr: () => <hr className="my-3 border-border" />,
};

export default function ResearcherLiteraturePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"search" | "saved">("search");

  // Search state
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<"relevance" | "submittedDate">("relevance");
  const [sortOrder, setSortOrder] = useState<"descending" | "ascending">("descending");
  const [currentPage, setCurrentPage] = useState(0);

  // Results state
  const [papers, setPapers] = useState<ScholarXivPaper[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<{
    page: number;
    hasMore: boolean;
    nextPage: number | null;
  }>({ page: 0, hasMore: false, nextPage: null });
  const [error, setError] = useState<string | null>(null);

  // Saved references state
  const [savedReferences, setSavedReferences] = useState<SavedReferenceItem[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // User projects for saving
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [savingPaperId, setSavingPaperId] = useState<string | null>(null);
  const [saveSuccessArxivId, setSaveSuccessArxivId] = useState<string | null>(null);

  // Expanded abstracts
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  // Citation modal state
  const [citeModalPaper, setCiteModalPaper] = useState<ScholarXivPaper | null>(null);
  const [citeFormat, setCiteFormat] = useState<"apa" | "bibtex" | "mla" | "chicago" | "rationale">("apa");
  const [copiedFormat, setCopiedFormat] = useState(false);

  // AI Insights modal state
  const [insightsPaper, setInsightsPaper] = useState<ScholarXivPaper | null>(null);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [activeInsightsTab, setActiveInsightsTab] = useState<"overview" | "questions" | "rationale" | "field">("overview");
  const [copiedInsightsKey, setCopiedInsightsKey] = useState<string | null>(null);

  // Load user projects
  useEffect(() => {
    fetch("/api/literature/projects")
      .then((res) => (res.ok ? res.json() : { projects: [] }))
      .then((data) => setUserProjects(data.projects || []))
      .catch(() => {});
  }, []);

  // Load initial saved literature or default search
  useEffect(() => {
    loadSavedReferences();
    // Run an initial search for health/survey research
    void executeSearch(0, "health survey data", "");
  }, []);

  async function loadSavedReferences() {
    setIsLoadingSaved(true);
    try {
      const res = await fetch("/api/literature?saved=true");
      const data = await res.json();
      if (res.ok && Array.isArray(data.references)) {
        setSavedReferences(data.references);
      }
    } catch {
      // silently fallback
    } finally {
      setIsLoadingSaved(false);
    }
  }

  async function executeSearch(pageToFetch = 0, overrideQuery?: string, overrideCategory?: string) {
    const q = overrideQuery !== undefined ? overrideQuery : query;
    const cat = overrideCategory !== undefined ? overrideCategory : category;

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageToFetch),
        sortBy,
        sortOrder,
      });
      if (q.trim()) params.set("q", q.trim());
      if (cat.trim()) params.set("cat", cat.trim());

      const res = await fetch(`/api/literature?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to search ScholarXIV papers.");
      }

      setPapers(data.papers || []);
      setPagination(data.pagination || { page: pageToFetch, hasMore: false, nextPage: null });
      setCurrentPage(pageToFetch);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveToProject(paper: ScholarXivPaper, projectId: string) {
    if (!projectId) return;
    setSavingPaperId(paper.arxivId);
    setError(null);
    try {
      const res = await fetch("/api/literature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, paper }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save literature reference.");

      setSaveSuccessArxivId(paper.arxivId);
      setTimeout(() => setSaveSuccessArxivId(null), 3500);
      void loadSavedReferences();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save to project.");
    } finally {
      setSavingPaperId(null);
    }
  }

  async function openInsights(paper: ScholarXivPaper) {
    setInsightsPaper(paper);
    setInsightsData(null);
    setActiveInsightsTab("overview");
    setCopiedInsightsKey(null);
    setIsLoadingInsights(true);
    try {
      const res = await fetch("/api/literature/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper }),
      });
      const data = await res.json();
      if (res.ok) {
        setInsightsData(data.insights);
      }
    } catch {
      // handled in UI
    } finally {
      setIsLoadingInsights(false);
    }
  }

  function copyInsightItem(key: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedInsightsKey(key);
    setTimeout(() => {
      setCopiedInsightsKey((cur) => (cur === key ? null : cur));
    }, 2000);
  }

  function copyAllQuestions(questionList: any[]) {
    if (!questionList || !questionList.length) return;
    const text = questionList
      .map((q, idx) => {
        let qText = `${idx + 1}. ${q.text} [Format: ${q.type}]`;
        if (q.options?.length) {
          qText += `\nOptions:\n` + q.options.map((opt: string) => `  - ${opt}`).join("\n");
        }
        if (q.scaleMin && q.scaleMax) {
          qText += `\nScale: ${q.scaleMin} (${q.scaleMinLabel || "Min"}) to ${q.scaleMax} (${q.scaleMaxLabel || "Max"})`;
        }
        return qText;
      })
      .join("\n\n");
    copyInsightItem("all-questions", text);
  }

  function toggleAbstract(arxivId: string) {
    setExpandedAbstracts((prev) => ({ ...prev, [arxivId]: !prev[arxivId] }));
  }

  function copyCitationText(text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedFormat(true);
    setTimeout(() => setCopiedFormat(false), 2000);
  }

  function getActiveCitationText(paper: ScholarXivPaper) {
    switch (citeFormat) {
      case "bibtex":
        return generateBibtex(paper);
      case "apa":
        return generateApaCitation(paper);
      case "mla":
        return generateMlaCitation(paper);
      case "chicago":
        return generateChicagoCitation(paper);
      case "rationale":
        return generateStudyRationaleSnippet(paper);
    }
  }

  function handleStartStudyWithPaper(paper: ScholarXivPaper) {
    const params = new URLSearchParams({
      literatureTitle: paper.title,
      literatureArxiv: paper.arxivId,
      literatureAuthors: paper.authors.join(", "),
      literatureAbstract: paper.abstract.slice(0, 1000),
    });
    router.push(`/researcher/studies/new?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Literature
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Search open-access research papers, copy formatted citations, and save references to your projects.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/researcher/studies/new"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Study</span>
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <Compass className="h-4 w-4 text-muted-foreground" />
            <span>Projects</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "search"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Search & Preprints</span>
          {papers.length > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {papers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("saved");
            void loadSavedReferences();
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "saved"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookmarkCheck className="h-4 w-4" />
          <span>My Saved Literature</span>
          <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {savedReferences.length}
          </span>
        </button>
      </div>

      {activeTab === "search" ? (
        <div className="space-y-5">
          {/* Search Box Card */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void executeSearch(0);
              }}
              className="space-y-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by topic, paper title, author, keyword, or hypothesis..."
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="Clear query"
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span>Search ScholarXIV</span>
                </button>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="font-medium">Discipline:</span>
                </div>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    void executeSearch(0, query, e.target.value);
                  }}
                  className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-emerald-600 focus:outline-none"
                >
                  {SCHOLARXIV_CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span className="font-medium">Sort:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const val = e.target.value as "relevance" | "submittedDate";
                    setSortBy(val);
                    void executeSearch(0, query, category);
                  }}
                  className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-emerald-600 focus:outline-none"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="submittedDate">Submission Date</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => {
                    const val = e.target.value as "descending" | "ascending";
                    setSortOrder(val);
                    void executeSearch(0, query, category);
                  }}
                  className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-emerald-600 focus:outline-none"
                >
                  <option value="descending">Newest First</option>
                  <option value="ascending">Oldest First</option>
                </select>
              </div>

              {/* Quick Topic Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                  Topics:
                </span>
                {QUICK_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setQuery(topic);
                      void executeSearch(0, topic, category);
                    }}
                    className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results List */}
          {isLoading ? (
            <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium text-foreground">Searching ScholarXIV & arXiv preprints...</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Fetching open-access research metadata, author citations, and paper abstracts.
              </p>
            </div>
          ) : papers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Showing {papers.length} Results
                </p>
                <p className="text-xs text-muted-foreground">Page {currentPage + 1}</p>
              </div>

              {papers.map((paper) => {
                const isExpanded = expandedAbstracts[paper.arxivId];
                const isSaved = savedReferences.some((ref) => ref.arxivId === paper.arxivId);

                return (
                  <article
                    key={paper.arxivId}
                    className="group rounded-2xl border border-border bg-card p-5 sm:p-6 transition hover:border-emerald-500/30 hover:shadow-xs"
                  >
                    {/* Header meta */}
                    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-300 text-[11px]">
                        arXiv:{paper.arxivId}
                      </span>
                      {paper.primaryCategory && (
                        <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-[11px]">
                          {paper.primaryCategory}
                        </span>
                      )}
                      {paper.publishedAt && (
                        <span>
                          Published {new Date(paper.publishedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      {paper.doi && (
                        <span className="text-muted-foreground/70 truncate max-w-xs">
                          DOI: {paper.doi}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-bold text-foreground leading-snug sm:text-lg mb-2">
                      {paper.title}
                    </h2>

                    {/* Authors */}
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3 font-medium">
                      {paper.authors.length > 0
                        ? paper.authors.join(", ")
                        : "Authors not specified"}
                    </p>

                    {/* Abstract */}
                    <div className="relative mb-4">
                      <p
                        className={`text-xs sm:text-sm text-foreground/80 leading-relaxed ${
                          isExpanded ? "" : "line-clamp-3"
                        }`}
                      >
                        {paper.abstract}
                      </p>
                      {paper.abstract.length > 200 && (
                        <button
                          type="button"
                          onClick={() => toggleAbstract(paper.arxivId)}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                          {isExpanded ? (
                            <>
                              <span>Show less</span>
                              <ChevronUp className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              <span>Read full abstract</span>
                              <ChevronDown className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      {/* Left: External Links */}
                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        <a
                          href={paper.paperUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted transition"
                        >
                          <span>arXiv Page</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition"
                        >
                          <FileText className="h-3 w-3" />
                          <span>PDF Full Text</span>
                        </a>
                      </div>

                      {/* Right: Study & Project Actions */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Cite Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setCiteModalPaper(paper);
                            setCiteFormat("apa");
                            setCopiedFormat(false);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted transition"
                          title="Generate BibTeX, APA, MLA citation"
                        >
                          <Quote className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Cite</span>
                        </button>

                        {/* AI Study Design Insights */}
                        <button
                          type="button"
                          onClick={() => void openInsights(paper)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/5 px-3 py-1.5 font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 transition"
                          title="Generate methodology notes & suggested survey questions"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Study Insights</span>
                        </button>

                        {/* Use in New Study */}
                        <button
                          type="button"
                          onClick={() => handleStartStudyWithPaper(paper)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700 transition"
                          title="Pre-fill study objective and rationale with this paper"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Use in Study</span>
                        </button>

                        {/* Save to Project Dropdown */}
                        {userProjects.length > 0 && (
                          <div className="relative inline-block">
                            <select
                              defaultValue=""
                              disabled={savingPaperId === paper.arxivId}
                              onChange={(e) => {
                                const projectId = e.target.value;
                                if (projectId) {
                                  void handleSaveToProject(paper, projectId);
                                  e.target.value = "";
                                }
                              }}
                              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted focus:border-emerald-600 focus:outline-none"
                            >
                              <option value="" disabled>
                                {isSaved ? "Saved to Project (add another)" : "Save to Project..."}
                              </option>
                              {userProjects.map((p) => (
                                <option key={p.id} value={p.id}>
                                  + {p.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {saveSuccessArxivId === paper.arxivId && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold animate-pulse">
                            <Check className="h-3.5 w-3.5" /> Saved!
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <button
                  type="button"
                  disabled={isLoading || currentPage === 0}
                  onClick={() => void executeSearch(Math.max(0, currentPage - 1))}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition"
                >
                  Previous Page
                </button>
                <span className="text-xs font-medium text-muted-foreground">
                  Page {currentPage + 1}
                </span>
                <button
                  type="button"
                  disabled={isLoading || !pagination.hasMore}
                  onClick={() => {
                    const next = pagination.nextPage !== null ? pagination.nextPage : currentPage + 1;
                    void executeSearch(next);
                  }}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition"
                >
                  Next Page
                </button>
              </div>
            </div>
          ) : hasSearched ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50" />
              <h3 className="text-sm font-semibold text-foreground">No preprints found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No papers matched your search filter. Try broadening your keywords or choosing &quot;All Disciplines&quot;.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        /* Saved References Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Your Saved Project Literature ({savedReferences.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Research preprints and literature saved across your Tinat research projects.
              </p>
            </div>
          </div>

          {isLoadingSaved ? (
            <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
              Loading saved references...
            </div>
          ) : savedReferences.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center">
              <Bookmark className="h-8 w-8 text-muted-foreground/50" />
              <h3 className="text-sm font-semibold text-foreground">No saved references yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Discover preprints using the search tab and click &quot;Save to Project&quot; to keep papers organized with your studies and research teams.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search ScholarXIV</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedReferences.map((ref) => (
                <article
                  key={ref.id}
                  className="rounded-2xl border border-border bg-card p-5 sm:p-6 transition hover:shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-300 text-[11px]">
                        arXiv:{ref.arxivId}
                      </span>
                      {ref.project && (
                        <Link
                          href={`/projects/${ref.project.id}`}
                          className="rounded-md bg-muted px-2.5 py-0.5 font-semibold text-[11px] text-primary hover:underline"
                        >
                          Project: {ref.project.title}
                        </Link>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Saved on {new Date(ref.savedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCiteModalPaper(ref);
                          setCiteFormat("apa");
                          setCopiedFormat(false);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Quote className="h-3 w-3 text-muted-foreground" />
                        <span>Cite</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartStudyWithPaper(ref)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Use in Study</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-1.5">{ref.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 font-medium">
                    {ref.authors.join(", ") || "Authors not listed"}
                  </p>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-4">
                    {ref.abstract}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs border-t border-border pt-3">
                    <a
                      href={ref.paperUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
                    >
                      View on arXiv <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href={ref.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
                    >
                      PDF Full Text <ExternalLink className="h-3 w-3" />
                    </a>
                    {ref.doi && (
                      <a
                        href={`https://doi.org/${encodeURIComponent(ref.doi)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
                      >
                        DOI <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Citation Modal */}
      {citeModalPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Quote className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-foreground">Cite Research Paper</h3>
              </div>
              <button
                type="button"
                onClick={() => setCiteModalPaper(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground line-clamp-2">
                {citeModalPaper.title}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                arXiv:{citeModalPaper.arxivId} &bull; {citeModalPaper.authors.slice(0, 3).join(", ")}
              </p>
            </div>

            {/* Citation Formats */}
            <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
              {(
                [
                  { id: "apa", label: "APA 7th" },
                  { id: "bibtex", label: "BibTeX" },
                  { id: "mla", label: "MLA 9th" },
                  { id: "chicago", label: "Chicago" },
                  { id: "rationale", label: "Study Rationale Snippet" },
                ] as const
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => {
                    setCiteFormat(fmt.id);
                    setCopiedFormat(false);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    citeFormat === fmt.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            {/* Output Box */}
            <div className="relative">
              <pre className="max-h-56 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed select-all">
                {getActiveCitationText(citeModalPaper)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-muted-foreground">
                Ready to paste into Overleaf, Word, or Tinat study description.
              </p>
              <button
                type="button"
                onClick={() => copyCitationText(getActiveCitationText(citeModalPaper))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
              >
                {copiedFormat ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Citation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Study Design Insights Modal */}
      {insightsPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-border bg-muted/20 space-y-3.5 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 text-white shadow-lg shadow-purple-500/20">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-foreground">
                        AI Study Design Insights
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20">
                        ScholarXIV AI
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Methodological suggestions & survey indicators tailored for Ethiopian field research
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://arxiv.org/abs/${insightsPaper.arxivId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
                    title="Open on arXiv"
                  >
                    <span>arXiv:{insightsPaper.arxivId}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setInsightsPaper(null)}
                    className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Paper Reference Banner */}
              <div className="rounded-2xl border border-border/80 bg-background/80 p-3 sm:p-3.5 space-y-1.5">
                <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2">
                  {insightsPaper.title}
                </p>
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                  <span>
                    {insightsPaper.authors.slice(0, 3).join(", ")}
                    {insightsPaper.authors.length > 3 ? " et al." : ""}
                  </span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                    {insightsPaper.primaryCategory}
                  </span>
                  {insightsPaper.publishedAt && (
                    <>
                      <span>&bull;</span>
                      <span>Published {new Date(insightsPaper.publishedAt).getFullYear()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Segmented Navigation Tabs */}
            {!isLoadingInsights && insightsData && (
              <div className="flex items-center gap-1.5 px-5 sm:px-6 pt-3 pb-2 border-b border-border bg-card overflow-x-auto no-scrollbar shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveInsightsTab("overview")}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    activeInsightsTab === "overview"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Methodology & Synthesis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInsightsTab("questions")}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    activeInsightsTab === "questions"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  <span>Survey Questions</span>
                  {insightsData.recommendedQuestions?.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeInsightsTab === "questions"
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {insightsData.recommendedQuestions.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInsightsTab("rationale")}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    activeInsightsTab === "rationale"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Quote className="h-3.5 w-3.5" />
                  <span>Rationale & Citations</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInsightsTab("field")}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    activeInsightsTab === "field"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Field Guidance</span>
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {isLoadingInsights ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/25">
                      <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-1.5 max-w-md">
                    <h4 className="text-base font-bold text-foreground">
                      Synthesizing Study Design Notes...
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Analyzing paper methodology, extracting research variables, and formulating localized recommendations for Ethiopian field collection.
                    </p>
                  </div>

                  {/* Progress steps animation */}
                  <div className="w-full max-w-sm rounded-2xl border border-border bg-muted/20 p-4 space-y-3 text-left">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-foreground font-medium">Extracting arXiv abstract & research variables</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white animate-pulse">
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-foreground font-medium">Formulating survey indicators & Likert scales</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
                        <Globe className="h-3.5 w-3.5" />
                      </span>
                      <span>Adapting for low-resource & Ethiopian offline enumerators</span>
                    </div>
                  </div>
                </div>
              ) : insightsData ? (
                <div>
                  {/* Tab 1: Methodology & Synthesis */}
                  {activeInsightsTab === "overview" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                            <Sparkles className="h-3.5 w-3.5" />
                          </span>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Scientific Synthesis & Study Design Notes
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyInsightItem(
                              "synthesis",
                              insightsData.aiContent ||
                                `${insightsData.studyRationale}\n\nContextual Note:\n${insightsData.contextualNote}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
                        >
                          {copiedInsightsKey === "synthesis" ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-semibold">Copied Synthesis!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Copy Full Synthesis</span>
                            </>
                          )}
                        </button>
                      </div>

                      {insightsData.aiContent ? (
                        <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 shadow-xs text-foreground">
                          <ArtifactRenderer content={insightsData.aiContent} />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                            <h5 className="text-xs font-bold text-foreground flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              Theoretical Framework & Empirical Findings
                            </h5>
                            <p className="text-xs text-foreground/90 leading-relaxed">
                              {insightsData.studyRationale}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2 text-emerald-950 dark:text-emerald-100">
                            <h5 className="text-xs font-bold flex items-center gap-2">
                              <Globe className="h-4 w-4 text-emerald-600" />
                              Field Implementation Notes
                            </h5>
                            <p className="text-xs leading-relaxed">{insightsData.contextualNote}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Survey Questions Preview */}
                  {activeInsightsTab === "questions" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-purple-600" />
                            Recommended Questionnaire Indicators
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Standardized for participant survey clarity & field enumerator ease.
                          </p>
                        </div>
                        {insightsData.recommendedQuestions?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => copyAllQuestions(insightsData.recommendedQuestions)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
                          >
                            {copiedInsightsKey === "all-questions" ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">All Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Copy All Questions</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {insightsData.recommendedQuestions?.length > 0 ? (
                        <div className="space-y-3">
                          {insightsData.recommendedQuestions.map((q: any, i: number) => {
                            const isCopied = copiedInsightsKey === `q-${i}`;
                            return (
                              <div
                                key={i}
                                className="rounded-2xl border border-border bg-card p-4 space-y-3 hover:border-purple-500/30 transition shadow-xs"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-xs">
                                      {i + 1}
                                    </span>
                                    <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                      {q.type === "LINEAR_SCALE"
                                        ? "5-Point Likert Scale"
                                        : q.type === "MULTIPLE_CHOICE"
                                        ? "Multiple Choice"
                                        : "Open Text"}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyInsightItem(
                                        `q-${i}`,
                                        `${q.text}\n${
                                          q.options?.length
                                            ? q.options.map((o: string) => `- ${o}`).join("\n")
                                            : ""
                                        }`
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                        <span className="text-emerald-600 font-semibold text-[11px]">
                                          Copied
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3.5 w-3.5" />
                                        <span className="text-[11px]">Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <p className="text-sm font-semibold text-foreground leading-snug">
                                  {q.text}
                                </p>

                                {/* Visual Preview of Question Controls */}
                                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 pt-2.5">
                                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                                    Question Preview:
                                  </p>

                                  {q.type === "LINEAR_SCALE" ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                                        <span>{q.scaleMinLabel || "1 - Strongly Disagree"}</span>
                                        <span>{q.scaleMaxLabel || "5 - Strongly Agree"}</span>
                                      </div>
                                      <div className="grid grid-cols-5 gap-2">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                          <div
                                            key={val}
                                            className="flex h-9 items-center justify-center rounded-xl border border-border bg-card text-xs font-semibold text-foreground/80"
                                          >
                                            {val}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : q.type === "MULTIPLE_CHOICE" && q.options?.length ? (
                                    <div className="space-y-1.5">
                                      {q.options.map((opt: string, optIdx: number) => (
                                        <div
                                          key={optIdx}
                                          className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground/90"
                                        >
                                          <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                                          <span>{opt}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="rounded-xl border border-dashed border-border bg-card px-3 py-3 text-xs text-muted-foreground italic">
                                      Participant provides descriptive local response here...
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          No specific survey indicators generated for this paper.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Study Rationale & Citations */}
                  {activeInsightsTab === "rationale" && (
                    <div className="space-y-4">
                      {/* Study Rationale */}
                      <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                              <Lightbulb className="h-4 w-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                Background Rationale Paragraph
                              </h4>
                              <p className="text-[11px] text-muted-foreground">
                                Ready to insert into study description, ethical board submission, or methodology section.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyInsightItem("rationale", insightsData.studyRationale)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
                          >
                            {copiedInsightsKey === "rationale" ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">Copied Rationale!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Copy Rationale</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="rounded-xl border-l-4 border-amber-500 bg-amber-500/5 p-4 text-xs leading-relaxed text-foreground italic">
                          "{insightsData.studyRationale}"
                        </div>
                      </div>

                      {/* Formatted Citations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* APA Citation */}
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">APA Citation (7th Ed.)</span>
                            <button
                              type="button"
                              onClick={() =>
                                copyInsightItem(
                                  "apa",
                                  insightsData.apaCitation || generateApaCitation(insightsPaper)
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            >
                              {copiedInsightsKey === "apa" ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold text-[11px]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span className="text-[11px]">Copy APA</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="rounded-xl border border-border bg-muted/30 p-3 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed select-all">
                            {insightsData.apaCitation || generateApaCitation(insightsPaper)}
                          </pre>
                        </div>

                        {/* BibTeX Citation */}
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">BibTeX Citation</span>
                            <button
                              type="button"
                              onClick={() =>
                                copyInsightItem(
                                  "bibtex",
                                  insightsData.bibtexCitation || generateBibtex(insightsPaper)
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            >
                              {copiedInsightsKey === "bibtex" ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold text-[11px]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span className="text-[11px]">Copy BibTeX</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="rounded-xl border border-border bg-muted/30 p-3 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed select-all max-h-36 overflow-y-auto">
                            {insightsData.bibtexCitation || generateBibtex(insightsPaper)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Field Guidance */}
                  {activeInsightsTab === "field" && (
                    <div className="space-y-4">
                      {/* Contextual Note Card */}
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-2 text-emerald-950 dark:text-emerald-100 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600">
                            <Globe className="h-4 w-4" />
                          </span>
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Ethiopian Field Deployment Consideration
                          </h4>
                        </div>
                        <p className="text-xs leading-relaxed font-medium">
                          {insightsData.contextualNote}
                        </p>
                      </div>

                      {/* Structured Field Protocol Checklist */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-xs">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                              1
                            </span>
                            Language Localization
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Ensure scale endpoints and options are translated into Amharic, Afaan Oromoo, or Tigrinya with culturally calibrated terminology.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-xs">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                              2
                            </span>
                            Offline Data Collection
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            For rural kebeles or clinics with intermittent connectivity, instruct enumerators to use Tinat's offline cache mode for instant local sync.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-xs">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                              3
                            </span>
                            Community Consent & Trust
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Pair formal written consent with brief verbal walkthroughs to maintain clarity and participant comfort across diverse literacy levels.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Could not load insights. Please try again.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-border bg-muted/20 shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                <span>Tinat AI Research Synthesis</span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setInsightsPaper(null)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleStartStudyWithPaper(insightsPaper)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white hover:from-emerald-700 hover:to-teal-700 transition shadow-md shadow-emerald-500/15"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Study With This Context</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
