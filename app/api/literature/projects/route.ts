import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const projects = await prisma.researchProject.findMany({
      where: {
        OR: [
          { projectLeadId: session.userId },
          { members: { some: { userId: session.userId } } },
        ],
      },
      select: {
        id: true,
        title: true,
        currentPhase: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET /api/literature/projects error:", error);
    return NextResponse.json(
      { error: "Failed to load user projects." },
      { status: 500 }
    );
  }
}
