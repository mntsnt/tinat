import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;
    const currentUser = auth.user;

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

    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        institution: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json({
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        institution: member.institution || "Health Administrator",
        avatarUrl: member.avatarUrl,
        isOnline: true,
        unreadCount: 0,
      })),
      currentUserId: currentUser.id,
    });
  } catch (error) {
    console.error("Failed to load admin chat members:", error);
    return jsonError("Unable to load team members right now.", 500);
  }
}
