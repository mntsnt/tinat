import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"].includes(status)) {
      where.status = status;
    }

    const reports = await prisma.moderationReport.findMany({
      where,
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        study: {
          select: { id: true, title: true, status: true, researcherId: true },
        },
      },
    });

    const openCount = await prisma.moderationReport.count({ where: { status: "OPEN" } });
    const overdueCount = await prisma.moderationReport.count({
      where: {
        status: { in: ["OPEN", "INVESTIGATING"] },
        deadline: { lt: new Date() },
      },
    });

    return NextResponse.json({
      reports,
      openCount,
      overdueCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch moderation reports" },
      { status: 500 }
    );
  }
}
