import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invitations = await prisma.collectorInvitation.findMany({
      where: { inviteeId: user.id, status: "PENDING" },
      include: {
        study: { select: { id: true, title: true } },
        inviter: { select: { name: true } }
      }
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { invitationId, status } = await req.json();

    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const invitation = await prisma.collectorInvitation.findUnique({
      where: { id: invitationId, inviteeId: user.id }
    });

    if (!invitation || invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation not found or not pending" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.collectorInvitation.update({
        where: { id: invitationId },
        data: { status }
      });

      if (status === "ACCEPTED") {
        await tx.studyDataCollector.create({
          data: {
            studyId: invitation.studyId,
            userId: user.id
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
