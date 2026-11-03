import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { jsonError } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;

    const members = await prisma.ethicsBoardMember.findMany({
      orderBy: { appointedAt: "asc" },
    });

    const decisions = await prisma.ethicsBoardDecision.findMany({
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({
      members,
      decisions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch ethics board data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const body = await request.json();
    const { type } = body;

    if (type === "MEMBER") {
      const { name, title, institution, role } = body;
      if (!name?.trim() || !institution?.trim() || !role?.trim()) {
        return jsonError("Member name, institution, and role are required.", 400);
      }

      const member = await prisma.ethicsBoardMember.create({
        data: {
          name: name.trim(),
          title: title ? title.trim() : "Advisory Board Member",
          institution: institution.trim(),
          role: role.trim(),
        },
      });

      await logActivity({
        userId: admin.id,
        action: "ETHICS_BOARD_MEMBER_APPOINTED",
        description: `Appointed ${member.name} (${member.institution}) to Ethics Advisory Board`,
        resourceId: member.id,
        resourceType: "EthicsBoardMember",
      });

      return NextResponse.json({ success: true, member });
    }

    if (type === "DECISION") {
      const { title, meetingDate, summary, resolution } = body;
      if (!title?.trim() || !summary?.trim() || !resolution?.trim()) {
        return jsonError("Decision title, summary, and resolution are required.", 400);
      }

      const parsedMeetingDate = meetingDate ? new Date(meetingDate) : new Date();

      const decision = await prisma.ethicsBoardDecision.create({
        data: {
          title: title.trim(),
          meetingDate: parsedMeetingDate,
          summary: summary.trim(),
          resolution: resolution.trim(),
        },
      });

      await logActivity({
        userId: admin.id,
        action: "ETHICS_BOARD_DECISION_PUBLISHED",
        description: `Published Ethics Board decision: ${decision.title}`,
        resourceId: decision.id,
        resourceType: "EthicsBoardDecision",
      });

      return NextResponse.json({ success: true, decision });
    }

    return jsonError("Invalid request type. Must be MEMBER or DECISION.", 400);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save ethics board record" },
      { status: 500 }
    );
  }
}
