import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authorizeProjectAccess,
  canUpdateProjectFile,
  logProjectActivity,
} from "@/lib/projects/auth";
import { ProjectFileFolder } from "@/generated/prisma/enums";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id, req);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canUploadFiles) {
      return NextResponse.json(
        { error: "You do not have permission to update project files." },
        { status: 403 }
      );
    }

    const file = await prisma.projectFile.findUnique({
      where: { id: fileId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });

    if (!file || file.projectId !== id) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      folder,
      notes,
      isSensitiveHealthData,
      newVersionUrl,
      newVersionSize,
      changeSummary,
    } = body;

    if (
      isSensitiveHealthData !== undefined &&
      typeof isSensitiveHealthData !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Sensitive health data status must be a boolean." },
        { status: 400 }
      );
    }

    if (!canUpdateProjectFile(auth, file.isSensitiveHealthData, isSensitiveHealthData)) {
      return NextResponse.json(
        { error: "You do not have permission to update this file or its sensitivity status." },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (folder && Object.values(ProjectFileFolder).includes(folder)) updateData.folder = folder;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (typeof isSensitiveHealthData === "boolean") {
      updateData.isSensitiveHealthData = isSensitiveHealthData;
    }

    // Version increment if new file uploaded
    if (newVersionUrl) {
      const nextVersion = file.version + 1;
      updateData.version = nextVersion;
      updateData.fileUrl = newVersionUrl;
      if (newVersionSize) updateData.fileSize = Number(newVersionSize);

      await prisma.projectFileVersion.create({
        data: {
          fileId,
          uploaderId: auth.userId,
          version: nextVersion,
          fileUrl: newVersionUrl,
          fileSize: Number(newVersionSize) || file.fileSize,
          changeSummary: changeSummary?.trim() || `Uploaded version ${nextVersion}`,
        },
      });

      await logProjectActivity({
        projectId: id,
        userId: auth.userId,
        action: "FILE_VERSION_UPDATED",
        description: `Uploaded v${nextVersion} of "${file.name}": ${changeSummary || "Version update"}`,
        metadata: { fileId, newVersion: nextVersion },
      });
    }

    const updated = await prisma.projectFile.update({
      where: { id: fileId },
      data: updateData,
      include: {
        versions: { orderBy: { version: "desc" } },
        uploader: { select: { id: true, name: true } },
      },
    });

    const isRestricted =
      updated.isSensitiveHealthData && !auth.canAccessHealthData;
    return NextResponse.json({
      success: true,
      file: {
        ...updated,
        fileUrl: isRestricted ? null : updated.fileUrl,
        versions: updated.versions.map((version) => ({
          ...version,
          fileUrl: isRestricted ? null : version.fileUrl,
        })),
      },
    });
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id, req);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    const file = await prisma.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.projectId !== id) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const isUploader = file.uploaderId === auth.userId;
    if (!auth.canManageProject && !isUploader) {
      return NextResponse.json(
        { error: "Only project managers or the file uploader can delete research files." },
        { status: 403 }
      );
    }

    await prisma.projectFile.delete({
      where: { id: fileId },
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "DELETED_FILE",
      description: `Deleted file "${file.name}" (v${file.version}) from folder ${file.folder}`,
      metadata: { fileId, fileName: file.name, folder: file.folder },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
