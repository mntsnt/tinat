import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canEditTasks && !auth.canMakeDecisions) {
      return NextResponse.json(
        { error: "You do not have permission to update research notes." },
        { status: 403 }
      );
    }

    const note = await prisma.projectNote.findUnique({
      where: { id: noteId },
    });

    if (!note || note.projectId !== id) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, category, isPinned } = body;

    const updateData: any = {};
    if (title && typeof title === "string") updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    if (category) updateData.category = category.trim();
    if (typeof isPinned === "boolean") updateData.isPinned = isPinned;

    const updated = await prisma.projectNote.update({
      where: { id: noteId },
      data: updateData,
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, note: updated });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canManageProject && !auth.canMakeDecisions) {
      return NextResponse.json(
        { error: "You do not have permission to delete research notes." },
        { status: 403 }
      );
    }

    const note = await prisma.projectNote.findUnique({
      where: { id: noteId },
    });

    if (!note || note.projectId !== id) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    await prisma.projectNote.delete({
      where: { id: noteId },
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "DELETED_NOTE",
      description: `Deleted research note "${note.title}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
