import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    }

    const search = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) || "";
    const where = {
      role: "ADMIN" as const,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { institution: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: 100,
        orderBy: [{ name: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          institution: true,
          fieldOfStudy: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ members, total, currentAdminId: session.userId });
  } catch (error) {
    console.error("Failed to load admin chat directory:", error);
    return NextResponse.json({ error: "Could not load the admin directory." }, { status: 500 });
  }
}
