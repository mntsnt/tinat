import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const auth = await requireRole(["ADMIN"], req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status")?.toUpperCase();
    const where: any = {};

    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam;
    } else if (!statusParam) {
      where.status = "PENDING";
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            institution: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error("Fetch withdrawals error:", error);
    return jsonError("Internal server error.", 500);
  }
}
