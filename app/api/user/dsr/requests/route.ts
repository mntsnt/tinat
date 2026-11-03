import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const requests = await prisma.dataSubjectRequest.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("Fetch DSR requests error:", error);
    return jsonError("Failed to fetch data subject requests", 500);
  }
}
