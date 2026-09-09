import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studyId } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingLike = await prisma.studyLike.findUnique({
      where: {
        userId_studyId: {
          userId: session.userId,
          studyId,
        }
      }
    });

    if (existingLike) {
      await prisma.studyLike.delete({ where: { id: existingLike.id } });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.studyLike.create({
        data: {
          userId: session.userId,
          studyId,
        }
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
