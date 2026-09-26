import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const study = await prisma.study.findUnique({
      where: { id, researcherId: user.id }
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found or unauthorized" }, { status: 404 });
    }

    const collectors = await prisma.studyDataCollector.findMany({
      where: { studyId: id },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json({ collectors });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const study = await prisma.study.findUnique({
      where: { id, researcherId: user.id }
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found or unauthorized" }, { status: 404 });
    }

    const { collectorEmail } = await req.json();

    const collectorUser = await prisma.user.findUnique({
      where: { email: collectorEmail }
    });

    if (!collectorUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify if user is a verified data collector
    const verification = await prisma.verification.findUnique({
      where: {
        userId_verificationType: {
          userId: collectorUser.id,
          verificationType: "DATA_COLLECTOR"
        }
      }
    });

    if (!verification || verification.status !== "VERIFIED") {
      return NextResponse.json({ error: "User is not a verified data collector" }, { status: 400 });
    }

    const invitation = await prisma.collectorInvitation.create({
      data: {
        studyId: id,
        inviterId: user.id,
        inviteeId: collectorUser.id,
        status: "PENDING",
      }
    });

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
