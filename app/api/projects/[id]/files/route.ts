import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";
import { ProjectFileFolder } from "@/generated/prisma/enums";

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
    const folder = searchParams.get("folder");

    const where: any = { projectId: id };
    if (folder && Object.values(ProjectFileFolder).includes(folder as ProjectFileFolder)) {
      where.folder = folder;
    }

    const files = await prisma.projectFile.findMany({
      where,
      include: {
        uploader: { select: { id: true, name: true, email: true } },
        versions: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
          orderBy: { version: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Mask sensitive health data download URL if member lacks health data clearance
    const sanitizedFiles = files.map((file) => {
      const isRestricted = file.isSensitiveHealthData && !auth.canAccessHealthData;
      return {
        ...file,
        fileUrl: isRestricted ? null : file.fileUrl,
        isRestrictedForUser: isRestricted,
        versions: file.versions.map((v) => ({
          ...v,
          fileUrl: isRestricted ? null : v.fileUrl,
        })),
      };
    });

    return NextResponse.json({ files: sanitizedFiles, canAccessHealthData: auth.canAccessHealthData });
  } catch (error) {
    console.error("Error fetching files:", error);
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

    if (!auth.canUploadFiles) {
      return NextResponse.json(
        { error: "You do not have permission to upload files to this project." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      fileUrl,
      fileType,
      fileSize,
      folder,
      isSensitiveHealthData,
      notes,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "File name is required." }, { status: 400 });
    }

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json({ error: "File URL is required." }, { status: 400 });
    }

    const assignedFolder =
      folder && Object.values(ProjectFileFolder).includes(folder)
        ? folder
        : ProjectFileFolder.PROTOCOL;

    const isSensitive = Boolean(isSensitiveHealthData);

    // Create file
    const file = await prisma.projectFile.create({
      data: {
        projectId: id,
        uploaderId: auth.userId,
        name: name.trim(),
        fileUrl: fileUrl.trim(),
        fileType: fileType?.trim() || "document",
        fileSize: Number(fileSize) || 0,
        folder: assignedFolder,
        version: 1,
        isSensitiveHealthData: isSensitive,
        notes: notes?.trim() || null,
        versions: {
          create: {
            uploaderId: auth.userId,
            version: 1,
            fileUrl: fileUrl.trim(),
            fileSize: Number(fileSize) || 0,
            changeSummary: "Initial version uploaded",
          },
        },
      },
      include: {
        uploader: { select: { id: true, name: true } },
        versions: true,
      },
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "UPLOADED_FILE",
      description: `Uploaded ${isSensitive ? "🔒 [Sensitive Health Data]" : ""} "${file.name}" to folder ${file.folder}`,
      metadata: { fileId: file.id, version: 1, isSensitive },
    });

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error("Error creating file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
