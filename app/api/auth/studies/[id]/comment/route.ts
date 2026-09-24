import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, isVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before posting comments." },
        { status: 403 }
      );
    }

    const study = await prisma.study.findUnique({
      where: { id },
      select: { id: true, status: true, researcherId: true },
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    if (study.status !== "ACTIVE" && study.researcherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Comments are only allowed on active studies." },
        { status: 403 }
      );
    }

    const { text, parentId } = await request.json();
    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ error: "Comment text is required." }, { status: 400 });
    }

    if (text.trim().length > 1000) {
      return NextResponse.json({ error: "Comment is too long (maximum 1000 characters)." }, { status: 400 });
    }

    if (parentId && typeof parentId === "string") {
      const parentComment = await prisma.studyComment.findUnique({
        where: { id: parentId },
        select: { id: true, studyId: true },
      });
      if (!parentComment || parentComment.studyId !== id) {
        return NextResponse.json({ error: "Parent comment not found in this study." }, { status: 404 });
      }
    }

    const comment = await prisma.studyComment.create({
      data: {
        userId: user.id,
        studyId: id,
        parentId: parentId || null,
        text: text.trim(),
      },
      include: {
        user: { select: { name: true, avatarUrl: true, role: true } }
      }
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
