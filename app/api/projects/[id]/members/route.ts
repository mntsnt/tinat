import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";
import { ProjectRole, InvitationStatus } from "@/generated/prisma/enums";
import crypto from "crypto";

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

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            institution: true,
            fieldOfStudy: true,
            role: true,
            bio: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    const tasksCounts = await prisma.projectTask.groupBy({
      by: ["assigneeId", "status"],
      where: { projectId: id },
      _count: { id: true },
    });

    const enrichedMembers = members.map((m) => {
      const assigned = tasksCounts
        .filter((tc) => tc.assigneeId === m.userId)
        .reduce((sum, item) => sum + item._count.id, 0);

      const completed = tasksCounts
        .filter((tc) => tc.assigneeId === m.userId && tc.status === "COMPLETED")
        .reduce((sum, item) => sum + item._count.id, 0);

      return {
        id: m.id,
        role: m.role,
        title: m.title,
        joinedAt: m.joinedAt,
        user: m.user,
        assignedTasksCount: assigned,
        completedTasksCount: completed,
      };
    });

    const pendingInvitations = await prisma.projectInvitation.findMany({
      where: { projectId: id, status: InvitationStatus.PENDING },
      include: {
        inviter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      members: enrichedMembers,
      invitations: pendingInvitations,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
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

    if (!auth.canManageTeam) {
      return NextResponse.json(
        { error: "Only project owners and principal investigators can invite team members." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, role, title, message } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required to invite a collaborator." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true },
    });

    if (existingUser) {
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: id,
            userId: existingUser.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: "This researcher is already a member of this project team." },
          { status: 409 }
        );
      }
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.projectInvitation.findFirst({
      where: {
        projectId: id,
        inviteeEmail: normalizedEmail,
        status: InvitationStatus.PENDING,
      },
    });

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    let invitation;
    if (existingInvite) {
      invitation = await prisma.projectInvitation.update({
        where: { id: existingInvite.id },
        data: {
          role: role || ProjectRole.RESEARCHER,
          token,
          expiresAt,
          message: message?.trim() || existingInvite.message,
        },
      });
    } else {
      invitation = await prisma.projectInvitation.create({
        data: {
          projectId: id,
          inviterId: auth.userId,
          inviteeEmail: normalizedEmail,
          role: role || ProjectRole.RESEARCHER,
          message: message?.trim() || null,
          token,
          expiresAt,
        },
      });
    }

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "INVITED_MEMBER",
      description: `Sent invitation to ${normalizedEmail} as ${invitation.role}`,
    });

    return NextResponse.json({
      success: true,
      invitation,
      inviteLink: `/projects/invite/${token}`,
    });
  } catch (error) {
    console.error("Error inviting member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
