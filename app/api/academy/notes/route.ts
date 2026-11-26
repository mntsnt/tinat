import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAcademyAccess } from "@/lib/academy/access";

export async function GET(req: NextRequest) {
  try {
    const { session, user } = await getAcademyAccess();
    if (!session?.userId) {
      return NextResponse.json({ error: "Sign in to access the Academy" }, { status: 401 });
    }
    if (user?.role !== "RESEARCHER" || !user.isVerified) {
      return NextResponse.json({ error: "Researcher access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const lessonSlug = searchParams.get("lessonSlug");

    if (!lessonSlug) {
      return NextResponse.json({ error: "lessonSlug parameter required" }, { status: 400 });
    }

    const note = await prisma.academyNote.findFirst({
      where: {
        userId: session.userId,
        lessonSlug,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      authenticated: true,
      note: note ? { content: note.content, updatedAt: note.updatedAt } : null,
    });
  } catch (err: any) {
    console.error("Error fetching note:", err);
    return NextResponse.json({ error: "Failed to load note" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, user } = await getAcademyAccess();
    if (!session?.userId) {
      return NextResponse.json({ error: "Sign in to access the Academy" }, { status: 401 });
    }
    if (user?.role !== "RESEARCHER" || !user.isVerified) {
      return NextResponse.json({ error: "Researcher access required" }, { status: 403 });
    }

    const body = await req.json();
    const { lessonSlug, content } = body as {
      lessonSlug: string;
      content: string;
    };

    if (!lessonSlug || typeof content !== "string") {
      return NextResponse.json({ error: "Missing lessonSlug or content" }, { status: 400 });
    }

    const existing = await prisma.academyNote.findFirst({
      where: {
        userId: session.userId,
        lessonSlug,
      },
    });

    let noteRecord;
    if (existing) {
      noteRecord = await prisma.academyNote.update({
        where: { id: existing.id },
        data: { content, updatedAt: new Date() },
      });
    } else {
      noteRecord = await prisma.academyNote.create({
        data: {
          userId: session.userId,
          lessonSlug,
          content,
        },
      });
    }

    return NextResponse.json({
      synced: true,
      note: {
        id: noteRecord.id,
        content: noteRecord.content,
        updatedAt: noteRecord.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error saving note:", err);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}
