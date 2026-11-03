import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";
import type { StudyStatus } from "@/generated/prisma/client";

export async function GET(req: Request) {
  try {
    const auth = await requireRole(["ADMIN"], req);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (statusParam && ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"].includes(statusParam.toUpperCase())) {
      where.status = statusParam.toUpperCase() as StudyStatus;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { researcher: { name: { contains: q, mode: "insensitive" } } },
        { researcher: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [studies, total] = await Promise.all([
      prisma.study.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          researcher: {
            select: {
              id: true,
              name: true,
              email: true,
              institution: true,
            },
          },
          _count: {
            select: {
              questions: true,
              responses: true,
            },
          },
        },
      }),
      prisma.study.count({ where }),
    ]);

    return NextResponse.json({
      studies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin studies fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch studies" }, { status: 500 });
  }
}
