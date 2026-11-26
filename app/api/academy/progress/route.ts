import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAcademyAccess } from "@/lib/academy/access";

export async function GET() {
  try {
    const { session, user } = await getAcademyAccess();
    if (!session?.userId) {
      return NextResponse.json({ error: "Sign in to access the Academy" }, { status: 401 });
    }
    if (user?.role !== "RESEARCHER" || !user.isVerified) {
      return NextResponse.json({ error: "Researcher access required" }, { status: 403 });
    }

    const records = await prisma.academyProgress.findMany({
      where: { userId: session.userId },
      select: {
        moduleSlug: true,
        lessonSlug: true,
        completed: true,
        completedAt: true,
        lastReadAt: true,
      },
    });

    return NextResponse.json({
      authenticated: true,
      progress: records,
    });
  } catch (err: any) {
    console.error("Error fetching academy progress:", err);
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
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
    const { items } = body as {
      items: Array<{
        moduleSlug: string;
        lessonSlug: string;
        completed: boolean;
        completedAt?: string;
      }>;
    };

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload: items array required" }, { status: 400 });
    }

    const updates = items.map((item) =>
      prisma.academyProgress.upsert({
        where: {
          userId_moduleSlug_lessonSlug: {
            userId: session.userId,
            moduleSlug: item.moduleSlug,
            lessonSlug: item.lessonSlug,
          },
        },
        update: {
          completed: item.completed,
          completedAt: item.completed ? (item.completedAt ? new Date(item.completedAt) : new Date()) : null,
          lastReadAt: new Date(),
        },
        create: {
          userId: session.userId,
          moduleSlug: item.moduleSlug,
          lessonSlug: item.lessonSlug,
          completed: item.completed,
          completedAt: item.completed ? (item.completedAt ? new Date(item.completedAt) : new Date()) : null,
        },
      })
    );

    await Promise.all(updates);

    return NextResponse.json({
      authenticated: true,
      syncedCount: items.length,
      success: true,
    });
  } catch (err: any) {
    console.error("Error batch syncing academy progress:", err);
    return NextResponse.json({ error: "Failed to sync progress" }, { status: 500 });
  }
}
