import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";
import {
  fetchScholarXivPapers,
  getArxivPaperLinks,
  normalizeScholarXivPaper,
} from "@/lib/scholarxiv";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "RESEARCHER") {
      return NextResponse.json(
        { error: "Access denied. Only researchers can access ScholarXIV literature." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isSaved = searchParams.get("saved") === "true";

    // If requested saved references library
    if (isSaved) {
      const references = await prisma.projectLiteratureReference.findMany({
        where: { addedById: user.id },
        include: {
          project: {
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { savedAt: "desc" },
      });

      return NextResponse.json({
        references: references.map((ref) => ({
          ...ref,
          ...getArxivPaperLinks(ref.arxivId),
        })),
      });
    }

    const query = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("cat")?.trim() || "";
    const title = searchParams.get("ti")?.trim() || "";
    const sortBy = (searchParams.get("sortBy") || "relevance") as "relevance" | "submittedDate";
    const sortOrder = (searchParams.get("sortOrder") || "descending") as "descending" | "ascending";
    const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10) || 0);
    const limit = Math.min(25, Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10));

    if (query.length > 300) {
      return NextResponse.json({ error: "Search queries must be 300 characters or fewer." }, { status: 400 });
    }

    const apiKey = process.env.SCHOLARXIV_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ScholarXIV literature discovery is not configured on this server." },
        { status: 503 }
      );
    }

    const rateLimit = checkRateLimit(request, "SCHOLARXIV", `scholarxiv:${user.id}`);
    if (!rateLimit.allowed) return rateLimit.response;

    const result = await fetchScholarXivPapers({
      query,
      category,
      title,
      page,
      limit,
      sortBy,
      sortOrder,
      apiKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/literature error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search ScholarXIV papers." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== "RESEARCHER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Access denied. Only researchers can save literature references." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { projectId, paper: rawPaper } = body;
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "A valid target projectId is required." }, { status: 400 });
    }

    const paper = normalizeScholarXivPaper(rawPaper);
    if (!paper) {
      return NextResponse.json({ error: "A valid ScholarXIV paper is required." }, { status: 400 });
    }

    const { auth, error: authError, status: authStatus } = await authorizeProjectAccess(projectId, request);
    if (!auth) {
      return NextResponse.json({ error: authError || "Project access denied" }, { status: authStatus || 403 });
    }

    const reference = await prisma.projectLiteratureReference.upsert({
      where: {
        projectId_arxivId: { projectId, arxivId: paper.arxivId },
      },
      create: {
        projectId,
        addedById: user.id,
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
      include: {
        project: { select: { id: true, title: true } },
        addedBy: { select: { id: true, name: true } },
      },
    });

    await logProjectActivity({
      projectId,
      userId: user.id,
      action: "SAVED_LITERATURE_REFERENCE",
      description: `Saved literature reference "${reference.title}" from ScholarXIV`,
      metadata: { referenceId: reference.id, arxivId: reference.arxivId },
    });

    return NextResponse.json(
      { reference: { ...reference, ...getArxivPaperLinks(reference.arxivId) } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/literature error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save literature reference." },
      { status: 500 }
    );
  }
}
