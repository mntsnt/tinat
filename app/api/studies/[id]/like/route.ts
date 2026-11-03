import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studyId } = await params;
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before liking studies." },
        { status: 403 }
      );
    }

    const study = await prisma.study.findUnique({
      where: { id: studyId },
      select: { id: true, status: true, researcherId: true },
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    if (study.status !== "ACTIVE" && study.researcherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Likes are only allowed on active studies." },
        { status: 403 }
      );
    }

    const existingLike = await prisma.studyLike.findUnique({
      where: {
        userId_studyId: {
          userId: user.id,
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
          userId: user.id,
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
