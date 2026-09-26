import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess, logProjectActivity } from "@/lib/projects/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }

    const decisions = await prisma.projectDecision.findMany({
      where: { projectId },
      orderBy: { decisionNumber: "desc" },
      include: {
        madeBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ decisions });
  } catch (error: any) {
    console.error("GET /api/projects/[id]/decisions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch decisions", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth || !auth.canMakeDecisions) {
      return NextResponse.json(
        { error: error || "Permission denied. Only Principal Investigators, Owners, and Research Leads can log methodological decisions." },
        { status: auth ? 403 : (status || 401) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { decision, reason, relatedDoc, date, supersedesDecisionId } = body;

    if (!decision?.trim()) {
      return NextResponse.json(
        { error: "Decision statement is required" },
        { status: 400 }
      );
    }

    // Get the next sequential decision number
    const lastDecision = await prisma.projectDecision.findFirst({
      where: { projectId },
      orderBy: { decisionNumber: "desc" },
      select: { decisionNumber: true },
    });

    const nextNumber = (lastDecision?.decisionNumber || 0) + 1;

    // If this supersedes an earlier decision, mark that decision as SUPERSEDED
    const newDecision = await prisma.projectDecision.create({
      data: {
        projectId,
        decisionNumber: nextNumber,
        decision: decision.trim(),
        reason: reason?.trim() || null,
        relatedDoc: relatedDoc?.trim() || null,
        date: date ? new Date(date) : new Date(),
        status: "ACTIVE",
        madeById: auth.userId,
      },
      include: {
        madeBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (supersedesDecisionId) {
      await prisma.projectDecision.update({
        where: { id: supersedesDecisionId },
        data: {
          status: "SUPERSEDED",
          supersededById: newDecision.id,
        },
      });
    }

    await logProjectActivity({
      projectId,
      userId: auth.userId,
      action: "LOGGED_DECISION",
      description: `Logged Methodological Decision #${nextNumber}: ${newDecision.decision}`,
      metadata: { decisionId: newDecision.id, decisionNumber: nextNumber },
    });

    return NextResponse.json({ decision: newDecision }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/decisions error:", error);
    return NextResponse.json(
      { error: "Failed to log decision", details: error.message },
      { status: 500 }
    );
  }
}
