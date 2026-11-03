import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const auth = await requireRole(["ADMIN"], req);
    if (!auth.ok) return auth.response;
    const user = auth.user;

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
