import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAcademyAccess } from "@/lib/academy/access";

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
    const { moduleSlug, lessonSlug, completed } = body as {
      moduleSlug: string;
      lessonSlug: string;
      completed: boolean;
    };

    if (!moduleSlug || !lessonSlug || typeof completed !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const record = await prisma.academyProgress.upsert({
      where: {
        userId_moduleSlug_lessonSlug: {
          userId: session.userId,
          moduleSlug,
          lessonSlug,
        },
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
        lastReadAt: new Date(),
      },
      create: {
        userId: session.userId,
        moduleSlug,
        lessonSlug,
        completed,
        completedAt: completed ? new Date() : null,
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({
      synced: true,
      completed: record.completed,
      completedAt: record.completedAt,
    });
  } catch (err: any) {
    console.error("Error toggling progress:", err);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
