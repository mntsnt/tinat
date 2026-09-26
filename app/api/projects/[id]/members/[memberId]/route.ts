import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";
import { ProjectRole } from "@/generated/prisma/enums";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canManageTeam) {
      return NextResponse.json(
        { error: "Only project owners and principal investigators can modify team roles." },
        { status: 403 }
      );
    }

    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!member || member.projectId !== id) {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }

    const body = await req.json();
    const { role: newRole, title } = body;

    const updateData: any = {};
    if (newRole && Object.values(ProjectRole).includes(newRole)) {
      updateData.role = newRole;
    }
    if (title !== undefined) {
      updateData.title = title?.trim() || null;
    }

    const updated = await prisma.projectMember.update({
      where: { id: memberId },
      data: updateData,
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "UPDATED_MEMBER_ROLE",
      description: `Updated ${member.user.name}'s role to ${updated.role}`,
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(id);
    if (!auth) {
      return NextResponse.json({ error }, { status: status || 403 });
    }

    if (!auth.canManageTeam) {
      return NextResponse.json(
        { error: "Only project owners and principal investigators can remove team members." },
        { status: 403 }
      );
    }

    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!member || member.projectId !== id) {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }

    // Protect project owner from accidental removal
    const project = await prisma.researchProject.findUnique({
      where: { id },
      select: { projectLeadId: true },
    });

    if (member.userId === project?.projectLeadId) {
      return NextResponse.json(
        { error: "The Project Lead / Owner cannot be removed from the project team." },
        { status: 400 }
      );
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    // Unassign tasks assigned to this removed member
    await prisma.projectTask.updateMany({
      where: { projectId: id, assigneeId: member.userId },
      data: { assigneeId: null },
    });

    await logProjectActivity({
      projectId: id,
      userId: auth.userId,
      action: "REMOVED_MEMBER",
      description: `Removed ${member.user.name} from the research team`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
