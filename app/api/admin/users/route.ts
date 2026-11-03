import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";
import type { UserRole } from "@/generated/prisma/client";

export async function GET(req: Request) {
  try {
    const auth = await requireRole(["ADMIN"], req);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");
    const q = searchParams.get("q")?.trim() || "";
    const isVerifiedParam = searchParams.get("isVerified");
    const faydaVerifiedParam = searchParams.get("faydaVerified");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (roleParam && ["PARTICIPANT", "RESEARCHER", "ADMIN"].includes(roleParam.toUpperCase())) {
      where.role = roleParam.toUpperCase() as UserRole;
    }

    if (isVerifiedParam !== null && isVerifiedParam !== undefined && isVerifiedParam !== "") {
      where.isVerified = isVerifiedParam === "true";
    }

    if (faydaVerifiedParam !== null && faydaVerifiedParam !== undefined && faydaVerifiedParam !== "") {
      where.faydaVerified = faydaVerifiedParam === "true";
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { institution: { contains: q, mode: "insensitive" } },
        { fieldOfStudy: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          institution: true,
          fieldOfStudy: true,
          yearOfStudy: true,
          avatarUrl: true,
          isVerified: true,
          faydaVerified: true,
          faydaVerifiedAt: true,
          createdAt: true,
          wallet: {
            select: {
              balance: true,
            },
          },
          _count: {
            select: {
              studies: true,
              participantLinks: true,
              withdrawals: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map((u) => ({
      ...u,
      _count: {
        ...u._count,
        responses: (u._count as any).participantLinks ?? 0,
      },
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
