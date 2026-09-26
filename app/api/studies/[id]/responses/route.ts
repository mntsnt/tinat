import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { collectionMethod, answers } = await req.json();

    if (collectionMethod === "FIELD_COLLECTED") {
      // Verify data collector authorization
      const assignment = await prisma.studyDataCollector.findUnique({
        where: { studyId_userId: { studyId: id, userId: user.id } }
      });

      if (!assignment) {
        return NextResponse.json({ error: "Not assigned to this study as a data collector." }, { status: 403 });
      }

      // Find an anonymous participant placeholder or create one per response?
      // "Do NOT automatically collect participant identity. A field-collected participant should remain anonymous."
      // Let's create an anonymous participant for each field response to satisfy the schema requirement.
      const anonParticipant = await prisma.user.create({
        data: {
          name: "Anonymous Participant",
          email: `anon-${Date.now()}-${Math.random().toString(36).substring(7)}@tinat.app`,
          passwordHash: "NONE",
          role: "PARTICIPANT"
        }
      });

      const response = await prisma.response.create({
        data: {
          studyId: id,
          participantId: anonParticipant.id,
          collectionMethod: "FIELD_COLLECTED",
          collectorId: user.id,
          answers: {
            create: answers
          }
        }
      });

      return NextResponse.json({ success: true, response });
    }

    return NextResponse.json({ error: "Invalid collection method" }, { status: 400 });
  } catch (error) {
    console.error("Submit field response error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
