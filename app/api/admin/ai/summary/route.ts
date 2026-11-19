import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformIntelligenceSummary } from "@/lib/ai/admin-platform-intelligence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const summary = await getPlatformIntelligenceSummary();
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Admin AI summary error:", error);
    return NextResponse.json({ error: "Failed to load platform summary" }, { status: 500 });
  }
}
