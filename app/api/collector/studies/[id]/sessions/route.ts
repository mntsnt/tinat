import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const { id: studyId } = await params;

    const assignment = await prisma.studyDataCollector.findUnique({
      where: { studyId_userId: { studyId, userId: auth.user.id } },
    });

    if (!assignment && auth.user.role !== "ADMIN") {
      return jsonError("Not authorized: you are not assigned to collect data for this study", 403);
    }

    // Check if there is an active session
    const activeSession = await prisma.collectionSession.findFirst({
      where: { studyId, collectorId: auth.user.id, status: "ACTIVE" },
    });

    if (activeSession) {
      return NextResponse.json({ session: activeSession });
    }

    const session = await prisma.collectionSession.create({
      data: {
        studyId,
        collectorId: auth.user.id,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("POST collector study sessions error:", error);
    return jsonError("Internal Error", 500);
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const { id: studyId } = await params;

    // Verify collector is assigned to this study or is admin
    const assignment = await prisma.studyDataCollector.findUnique({
      where: { studyId_userId: { studyId, userId: auth.user.id } },
    });

    if (!assignment && auth.user.role !== "ADMIN") {
      return jsonError("Not authorized: you are not assigned to collect data for this study", 403);
    }

    const sessions = await prisma.collectionSession.findMany({
      where: { studyId, collectorId: auth.user.id },
      orderBy: { startTime: "desc" },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET collector study sessions error:", error);
    return jsonError("Internal Error", 500);
  }
}
