import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { status } = body; // PAUSED or COMPLETED

    const session = await prisma.collectionSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.collectorId !== user.id) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    const updatedSession = await prisma.collectionSession.update({
      where: { id: sessionId },
      data: {
        status: status as any,
        endTime: status === "COMPLETED" ? new Date() : undefined
      }
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
