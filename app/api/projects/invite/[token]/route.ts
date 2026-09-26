import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logProjectActivity } from "@/lib/projects/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            studyDesign: true,
            institution: true,
            lead: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const isExpired = new Date() > invitation.expiresAt;

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        inviteeEmail: invitation.inviteeEmail,
        role: invitation.role,
        message: invitation.message,
        status: isExpired && invitation.status === "PENDING" ? "EXPIRED" : invitation.status,
        expiresAt: invitation.expiresAt,
        project: invitation.project,
        inviter: invitation.inviter,
      },
    });
  } catch (error: any) {
    console.error("GET /api/projects/invite/[token] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Authentication required to accept research project invitation" },
        { status: 401 }
      );
    }

    const { token } = await params;

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
      include: { project: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: `This invitation has already been ${invitation.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body; // "ACCEPT" | "DECLINE"

    if (action === "DECLINE") {
      await prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: "DECLINED" },
      });
      return NextResponse.json({ success: true, status: "DECLINED" });
    }

    if (action !== "ACCEPT") {
      return NextResponse.json({ error: "Invalid action. Expected ACCEPT or DECLINE." }, { status: 400 });
    }

    // Add user as project member or update role if already member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: invitation.projectId,
          userId: session.userId,
        },
      },
    });

    if (!existingMember) {
      await prisma.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: session.userId,
          role: invitation.role,
        },
      });
    }

    // Mark invitation accepted
    await prisma.projectInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    await logProjectActivity({
      projectId: invitation.projectId,
      userId: session.userId,
      action: "JOINED_PROJECT",
      description: `Accepted invitation and joined project as ${invitation.role}`,
      metadata: { invitationId: invitation.id, role: invitation.role },
    });

    return NextResponse.json({
      success: true,
      projectId: invitation.projectId,
      message: "Successfully joined project",
    });
  } catch (error: any) {
    console.error("POST /api/projects/invite/[token] error:", error);
    return NextResponse.json(
      { error: "Failed to process invitation", details: error.message },
      { status: 500 }
    );
  }
}
