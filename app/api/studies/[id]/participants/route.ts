import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studyId } = await params;
    const auth = await requireStudyOwnerOrAdmin(studyId, req);
    if (!auth.ok) return auth.response;

    const participants = await prisma.studyParticipant.findMany({
      where: { studyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatarUrl: true,
            institution: true,
            fieldOfStudy: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json({ participants });
  } catch (error) {
    console.error("GET study participants error:", error);
    return jsonError("Internal error", 500);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studyId } = await params;
    const auth = await requireStudyOwnerOrAdmin(studyId, req);
    if (!auth.ok) return auth.response;
    const study = auth.study;

    const body = await req.json().catch(() => ({}));
    const rawIdentifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
    if (!rawIdentifier) {
      return jsonError("Please provide an email or username.", 400);
    }

    const cleanIdentifier = rawIdentifier.replace(/^@/, "");

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: "insensitive" } },
          { username: { equals: cleanIdentifier, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
      },
    });

    if (!targetUser) {
      return jsonError("User not found with this email or username.", 404);
    }

    const existing = await prisma.studyParticipant.findUnique({
      where: {
        studyId_userId: {
          studyId,
          userId: targetUser.id,
        },
      },
    });

    if (existing) {
      return jsonError(`${targetUser.name || "User"} is already assigned to this study.`, 400);
    }

    const assignment = await prisma.studyParticipant.create({
      data: {
        studyId,
        userId: targetUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify user of direct assignment to private study
    try {
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          title: "Private Study Invitation",
          message: `You have been assigned to private study: "${study.title}". You can now access and participate in it.`,
          linkUrl: `/participant/studies/${studyId}`,
        },
      });
    } catch {
      // Non-blocking notification
    }

    return NextResponse.json({
      success: true,
      participant: assignment,
      message: `Assigned ${targetUser.name || targetUser.email} successfully.`,
    });
  } catch (error) {
    console.error("POST study participant error:", error);
    return jsonError("Internal error", 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studyId } = await params;
    const auth = await requireStudyOwnerOrAdmin(studyId, req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return jsonError("userId parameter is required.", 400);
    }

    await prisma.studyParticipant.deleteMany({
      where: {
        studyId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Participant removed successfully.",
    });
  } catch (error) {
    console.error("DELETE study participant error:", error);
    return jsonError("Internal error", 500);
  }
}
