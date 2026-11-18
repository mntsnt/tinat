"use client";

import { useEffect, useState } from "react";
import {
  BookmarkCheck,
  ExternalLink,
  LoaderCircle,
  Search,
  Trash2,
} from "lucide-react";
import type { ScholarXivPaper } from "@/lib/scholarxiv";

interface SavedReference extends ScholarXivPaper {
  id: string;
  savedAt: string;
  addedBy?: { id: string; name: string | null } | null;
}

interface ProjectLiteratureTabProps {
  projectId: string;
  canEdit: boolean;
}

function PaperDetails({ paper }: { paper: ScholarXivPaper }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {paper.publishedAt && (
          <span>{new Date(paper.publishedAt).toLocaleDateString()}</span>
        )}
        {paper.primaryCategory && (
          <span className="rounded-full bg-muted px-2 py-0.5">
            {paper.primaryCategory}
          </span>
        )}
        <span>arXiv:{paper.arxivId}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {paper.authors.length ? paper.authors.join(", ") : "Authors not listed"}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
        {paper.abstract}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <a
          href={paper.paperUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          View paper <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <a
          href={paper.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          PDF <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {paper.doi && (
          <a
            href={`https://doi.org/${encodeURIComponent(paper.doi)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            DOI <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </>
  );
}

export function ProjectLiteratureTab({
  projectId,
  canEdit,
}: ProjectLiteratureTabProps) {
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<ScholarXivPaper[]>([]);
  const [references, setReferences] = useState<SavedReference[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingReferences, setIsLoadingReferences] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/projects/${projectId}/literature`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load saved references.");
        if (active) setReferences(data.references);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load saved references.");
        }
      })
      .finally(() => {
        if (active) setIsLoadingReferences(false);
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  async function searchPapers(page: number) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Enter a title, topic, author, or arXiv category to search.");
      return;
    }

    setError(null);
    setIsSearching(true);
    try {
      const params = new URLSearchParams({ q: trimmedQuery, page: String(page) });
      const response = await fetch(`/api/projects/${projectId}/literature?${params}`);
      const data = await response.json();
      if (!response.ok) {
        const retryAfter = response.headers.get("retry-after");
        const message = data.error || "ScholarXIV search failed.";
        throw new Error(
          response.status === 429 && retryAfter
            ? `${message} Try again in ${retryAfter} seconds.`
            : message
        );
      }

      setPapers(data.papers);
      setCurrentPage(data.pagination.page);
      setNextPage(data.pagination.nextPage);
      setHasSearched(true);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "ScholarXIV search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  async function savePaper(paper: ScholarXivPaper) {
    setError(null);
    setSavingId(paper.arxivId);
    try {
      const response = await fetch(`/api/projects/${projectId}/literature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this reference.");
      setReferences((current) => [
        data.reference,
        ...current.filter((item) => item.arxivId !== data.reference.arxivId),
      ]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this reference.");
    } finally {
      setSavingId(null);
    }
  }

  async function removeReference(reference: SavedReference) {
    setError(null);
    setDeletingId(reference.id);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/literature/${encodeURIComponent(reference.id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not remove this reference.");
      setReferences((current) => current.filter((item) => item.id !== reference.id));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove this reference.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white">Literature discovery</h3>
        <p className="mt-1 text-sm text-slate-500">
          Search ScholarXIV papers and keep useful arXiv references with this project.
        </p>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void searchPapers(0);
        }}
      >
        <label className="sr-only" htmlFor="project-literature-query">
          Search papers
        </label>
        <input
          id="project-literature-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={300}
          placeholder="Search a topic, paper title, author, or category"
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSearching ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search papers
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {papers.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 dark:text-white">Search results</h4>
          {papers.map((paper) => {
            const isSaved = references.some((reference) => reference.arxivId === paper.arxivId);
            return (
              <article
                key={paper.arxivId}
                className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h5 className="font-semibold leading-6 text-slate-900 dark:text-white">
                    {paper.title}
                  </h5>
                  {canEdit && (
                    <button
                      type="button"
                      disabled={isSaved || savingId === paper.arxivId}
                      onClick={() => void savePaper(paper)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingId === paper.arxivId ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <BookmarkCheck className="h-4 w-4" />
                      )}
                      {isSaved ? "Saved" : "Save reference"}
                    </button>
                  )}
                </div>
                <PaperDetails paper={paper} />
              </article>
            );
          })}
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={isSearching || currentPage === 0}
              onClick={() => void searchPapers(Math.max(0, currentPage - 1))}
              className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">Page {currentPage + 1}</span>
            <button
              type="button"
              disabled={isSearching || nextPage === null}
              onClick={() => nextPage !== null && void searchPapers(nextPage)}
              className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {references.length > 0 && (
        <div className="space-y-3 border-t border-border pt-5">
          <h4 className="font-medium text-slate-900 dark:text-white">
            Saved references <span className="text-sm text-muted-foreground">({references.length})</span>
          </h4>
          {references.map((reference) => (
            <article
              key={reference.id}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h5 className="font-semibold leading-6 text-slate-900 dark:text-white">
                  {reference.title}
                </h5>
                {canEdit && (
                  <button
                    type="button"
                    disabled={deletingId === reference.id}
                    onClick={() => void removeReference(reference)}
                    aria-label={`Remove ${reference.title} from bibliography`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
                  >
                    {deletingId === reference.id ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Remove
                  </button>
                )}
              </div>
              <PaperDetails paper={reference} />
              <p className="mt-3 text-xs text-muted-foreground">
                Saved {new Date(reference.savedAt).toLocaleDateString()}
                {reference.addedBy?.name ? ` by ${reference.addedBy.name}` : ""}
              </p>
            </article>
          ))}
        </div>
      )}

      {isLoadingReferences && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Loading saved references...
        </p>
      )}

      {!isLoadingReferences && references.length === 0 && papers.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          {hasSearched
            ? "No papers matched your search."
            : canEdit
              ? "Search for papers, then save relevant references to this project."
              : "No references have been saved to this project yet."}
        </div>
      )}
    </section>
  );
}
