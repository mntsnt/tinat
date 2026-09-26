import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;

    const verifications = await prisma.verification.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(type ? { verificationType: type as any } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        reviewedBy: {
          select: { name: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return NextResponse.json({ verifications });
  } catch (error) {
    console.error("Admin verification fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
