import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; referenceId: string }> }
) {
  try {
    const { id: projectId, referenceId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId, request);
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }
    if (!auth.canEditTasks && !auth.canMakeDecisions) {
      return NextResponse.json({ error: "You do not have permission to remove literature references." }, { status: 403 });
    }

    const reference = await prisma.projectLiteratureReference.findFirst({
      where: { id: referenceId, projectId },
      select: { id: true, title: true, arxivId: true },
    });
    if (!reference) {
      return NextResponse.json({ error: "Literature reference not found." }, { status: 404 });
    }

    await prisma.projectLiteratureReference.delete({ where: { id: reference.id } });
    await logProjectActivity({
      projectId,
      userId: auth.userId,
      action: "REMOVED_LITERATURE_REFERENCE",
      description: `Removed literature reference "${reference.title}"`,
      metadata: { referenceId: reference.id, arxivId: reference.arxivId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id]/literature/[referenceId] failed:", error);
    return NextResponse.json({ error: "Failed to remove literature reference." }, { status: 500 });
  }
}
