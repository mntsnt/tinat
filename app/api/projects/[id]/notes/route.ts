import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = { projectId: id };
    if (category) where.category = category;

    const notes = await prisma.projectNote.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canEditTasks && !auth.canMakeDecisions) {
      return NextResponse.json(
        { error: "You do not have permission to create research notes." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, category, isPinned } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Note title is required." }, { status: 400 });
    }

    const note = await prisma.projectNote.create({
      data: {
        projectId: id,
        authorId: auth.userId,
        title: title.trim(),
        content: content?.trim() || "",
        category: category?.trim() || "General",
        isPinned: Boolean(isPinned),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "CREATED_NOTE",
      description: `Created research note "${note.title}" in ${note.category}`,
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
