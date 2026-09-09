import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { text } = await request.json();
    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    const comment = await prisma.studyComment.create({
      data: {
        userId: session.userId,
        studyId: id,
        text: text.trim(),
      },
      include: {
        user: { select: { name: true, avatarUrl: true } }
      }
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
