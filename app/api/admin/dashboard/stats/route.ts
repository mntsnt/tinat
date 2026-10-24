import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [
      dbHealth,
      totalUsers,
      participantCount,
      researcherCount,
      adminCount,
      totalStudies,
      activeStudies,
      draftStudies,
      completedStudies,
      pausedStudies,
      totalResponses,
      responsesToday,
      pendingVerifications,
      pendingWithdrawals,
      failedPayments,
      recentLogs,
    ] = await Promise.all([
      (async () => {
        const startedAt = process.hrtime.bigint();
        try {
          await prisma.$queryRaw`SELECT 1`;
          return {
            status: "online",
            latencyMs: Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000),
          };
        } catch (error) {
          console.error("Database health check failed:", error);
          return { status: "offline", latencyMs: null };
        }
      })(),
      prisma.user.count(),
      prisma.user.count({ where: { role: "PARTICIPANT" } }),
      prisma.user.count({ where: { role: "RESEARCHER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.study.count(),
      prisma.study.count({ where: { status: "ACTIVE" } }),
      prisma.study.count({ where: { status: "DRAFT" } }),
      prisma.study.count({ where: { status: "COMPLETED" } }),
      prisma.study.count({ where: { status: "PAUSED" } }),
      prisma.response.count(),
      prisma.response.count({ where: { submittedAt: { gte: startOfToday } } }),
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.withdrawal.count({ where: { status: "PENDING" } }),
      prisma.studyPayment.count({ where: { status: "FAILED" } }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      database: dbHealth,
      users: {
        total: totalUsers,
        participants: participantCount,
        researchers: researcherCount,
        admins: adminCount,
      },
      studies: {
        total: totalStudies,
        active: activeStudies,
        draft: draftStudies,
        completed: completedStudies,
        paused: pausedStudies,
      },
      responses: {
        total: totalResponses,
        today: responsesToday,
      },
      pending: {
        verifications: pendingVerifications,
        withdrawals: pendingWithdrawals,
        failedPayments: failedPayments,
      },
      recentLogs,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
