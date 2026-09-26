import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; outputId: string }> }
) {
  try {
    const { id: projectId, outputId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth || !auth.canEditTasks) {
      return NextResponse.json(
        { error: error || "Permission denied" },
        { status: auth ? 403 : (status || 401) }
      );
    }

    const existing = await prisma.projectOutput.findUnique({
      where: { id: outputId },
    });

    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      title,
      type,
      status: outputStatus,
      targetJournal,
      linkUrl,
      fileUrl,
      submissionDeadline,
      publicationDate,
      contributors,
      manuscriptSections,
    } = body;

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (type !== undefined) data.type = type;
    if (outputStatus !== undefined) data.status = outputStatus;
    if (targetJournal !== undefined) data.targetJournal = targetJournal ? targetJournal.trim() : null;
    if (linkUrl !== undefined) data.linkUrl = linkUrl ? linkUrl.trim() : null;
    if (fileUrl !== undefined) data.fileUrl = fileUrl ? fileUrl.trim() : null;
    if (submissionDeadline !== undefined) {
      data.submissionDeadline = submissionDeadline ? new Date(submissionDeadline) : null;
    }
    if (publicationDate !== undefined) {
      data.publicationDate = publicationDate ? new Date(publicationDate) : null;
    }
    if (contributors !== undefined && Array.isArray(contributors)) {
      data.contributors = contributors;
    }
    if (manuscriptSections !== undefined) {
      data.manuscriptSections = manuscriptSections;
    }

    const updated = await prisma.projectOutput.update({
      where: { id: outputId },
      data,
    });

    await logProjectActivity({
      projectId,
      userId: auth.userId,
      action: "UPDATED_OUTPUT",
      description: `Updated research output "${updated.title}" (${updated.status})`,
      metadata: { outputId, status: updated.status },
    });

    return NextResponse.json({ output: updated });
  } catch (error: any) {
    console.error("PATCH output error:", error);
    return NextResponse.json(
      { error: "Failed to update output", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; outputId: string }> }
) {
  try {
    const { id: projectId, outputId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth || !auth.canManageProject) {
      return NextResponse.json(
        { error: error || "Permission denied" },
        { status: auth ? 403 : (status || 401) }
      );
    }

    const existing = await prisma.projectOutput.findUnique({
      where: { id: outputId },
    });

    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }

    await prisma.projectOutput.delete({
      where: { id: outputId },
    });

    await logProjectActivity({
      projectId,
      userId: auth.userId,
      action: "DELETED_OUTPUT",
      description: `Deleted research output "${existing.title}"`,
      metadata: { outputId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE output error:", error);
    return NextResponse.json(
      { error: "Failed to delete output", details: error.message },
      { status: 500 }
    );
  }
}
