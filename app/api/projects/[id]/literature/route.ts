import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  getArxivPaperLinks,
  normalizeScholarXivPaper,
  type ScholarXivPaper,
} from "@/lib/scholarxiv";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId, request);
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      const references = await prisma.projectLiteratureReference.findMany({
        where: { projectId },
        include: { addedBy: { select: { id: true, name: true } } },
        orderBy: { savedAt: "desc" },
      });
      return NextResponse.json({
        references: references.map((reference) => ({
          ...reference,
          ...getArxivPaperLinks(reference.arxivId),
        })),
      });
    }

    if (query.length > 300) {
      return NextResponse.json({ error: "Search queries must be 300 characters or fewer." }, { status: 400 });
    }

    const apiKey = process.env.SCHOLARXIV_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ScholarXIV search is not configured on this server." },
        { status: 503 }
      );
    }

    const pageValue = searchParams.get("page") ?? "0";
    const page = Number(pageValue);
    if (!Number.isSafeInteger(page) || page < 0) {
      return NextResponse.json({ error: "Page must be a non-negative integer." }, { status: 400 });
    }

    const rateLimit = checkRateLimit(request, "SCHOLARXIV", `scholarxiv:${auth.userId}`);
    if (!rateLimit.allowed) return rateLimit.response;

    let upstream: Response;
    try {
      upstream = await fetch("https://scholarxiv.com/api/v1/papers/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchFilterString: { all: query },
          page,
          limit: 10,
          sortBy: "relevance",
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
    } catch (upstreamError) {
      console.error("ScholarXIV paper search request failed:", upstreamError);
      const timedOut =
        upstreamError instanceof Error && upstreamError.name === "TimeoutError";
      return NextResponse.json(
        { error: timedOut ? "ScholarXIV search timed out. Please try again." : "Could not reach ScholarXIV." },
        { status: timedOut ? 504 : 502 }
      );
    }

    const payload: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const upstreamMessage =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error.slice(0, 500)
          : "ScholarXIV could not complete the search.";
      const retryAfter = upstream.headers.get("retry-after");
      const response = NextResponse.json(
        {
          error:
            upstream.status === 401
              ? "ScholarXIV rejected the configured API key. Check the server environment variable."
              : upstreamMessage,
          ...(upstream.status === 429 && retryAfter ? { retryAfter } : {}),
        },
        { status: upstream.status === 429 ? 429 : 502 }
      );
      if (upstream.status === 429 && retryAfter) {
        response.headers.set("Retry-After", retryAfter);
      }
      return response;
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
      console.error("ScholarXIV returned an unexpected paper search response.");
      return NextResponse.json(
        { error: "ScholarXIV returned an unexpected response. Please try again later." },
        { status: 502 }
      );
    }

    const pagination = payload.pagination as {
      page?: unknown;
      hasMore?: unknown;
      nextPage?: unknown;
    };
    if (
      typeof pagination.page !== "number" ||
      !Number.isSafeInteger(pagination.page) ||
      pagination.page < 0 ||
      typeof pagination.hasMore !== "boolean" ||
      (pagination.nextPage !== null &&
        (typeof pagination.nextPage !== "number" ||
          !Number.isSafeInteger(pagination.nextPage) ||
          pagination.nextPage < 0))
    ) {
      console.error("ScholarXIV returned invalid pagination metadata.");
      return NextResponse.json(
        { error: "ScholarXIV returned invalid pagination data. Please try again later." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      papers: payload.data
        .map(normalizeScholarXivPaper)
        .filter((paper): paper is ScholarXivPaper => paper !== null),
      pagination: {
        page: pagination.page,
        hasMore: pagination.hasMore,
        nextPage: pagination.nextPage,
      },
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/literature failed:", error);
    return NextResponse.json({ error: "Failed to load project literature." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId, request);
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }
    if (!auth.canEditTasks && !auth.canMakeDecisions) {
      return NextResponse.json({ error: "You do not have permission to save literature references." }, { status: 403 });
    }

    const body: unknown = await request.json().catch(() => null);
    const paper =
      typeof body === "object" && body !== null && "paper" in body
        ? normalizeScholarXivPaper(body.paper)
        : null;
    if (!paper) {
      return NextResponse.json({ error: "A valid ScholarXIV paper is required." }, { status: 400 });
    }

    const reference = await prisma.projectLiteratureReference.upsert({
      where: {
        projectId_arxivId: { projectId, arxivId: paper.arxivId },
      },
      create: {
        projectId,
        addedById: auth.userId,
        arxivId: paper.arxivId,
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        publishedAt: paper.publishedAt ? new Date(paper.publishedAt) : null,
        primaryCategory: paper.primaryCategory,
        categories: paper.categories,
        doi: paper.doi,
      },
      update: {
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        publishedAt: paper.publishedAt ? new Date(paper.publishedAt) : null,
        primaryCategory: paper.primaryCategory,
        categories: paper.categories,
        doi: paper.doi,
      },
      include: { addedBy: { select: { id: true, name: true } } },
    });

    await logProjectActivity({
      projectId,
      userId: auth.userId,
      action: "SAVED_LITERATURE_REFERENCE",
      description: `Saved literature reference "${reference.title}"`,
      metadata: { referenceId: reference.id, arxivId: reference.arxivId },
    });

    return NextResponse.json(
      { reference: { ...reference, ...getArxivPaperLinks(reference.arxivId) } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects/[id]/literature failed:", error);
    return NextResponse.json({ error: "Failed to save literature reference." }, { status: 500 });
  }
}
