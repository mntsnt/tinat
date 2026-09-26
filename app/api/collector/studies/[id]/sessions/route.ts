import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studyId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const assignment = await prisma.studyDataCollector.findUnique({
      where: { studyId_userId: { studyId, userId: user.id } }
    });

    if (!assignment) {
      return NextResponse.json({ error: "Not authorized for this study" }, { status: 403 });
    }

    // Check if there is an active session
    const activeSession = await prisma.collectionSession.findFirst({
      where: { studyId, collectorId: user.id, status: "ACTIVE" }
    });

    if (activeSession) {
      return NextResponse.json({ session: activeSession });
    }

    const session = await prisma.collectionSession.create({
      data: {
        studyId,
        collectorId: user.id,
        status: "ACTIVE"
      }
    });

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studyId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessions = await prisma.collectionSession.findMany({
      where: { studyId, collectorId: user.id },
      orderBy: { startTime: "desc" },
      include: {
        _count: {
          select: { responses: true }
        }
      }
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
