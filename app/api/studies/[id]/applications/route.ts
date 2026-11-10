import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: studyId } = await params;

    const study = await prisma.study.findUnique({
      where: { id: studyId },
      select: { researcherId: true },
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    const isOwnerOrAdmin = study.researcherId === session.userId;

    if (isOwnerOrAdmin) {
      // Researcher viewing all applications for this study
      const applications = await prisma.collectorApplication.findMany({
        where: { studyId },
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              phone: true,
              institution: true,
              fieldOfStudy: true,
              isVerified: true,
              faydaVerified: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ applications });
    }

    // Participant viewing their own application status for this study
    const userApplication = await prisma.collectorApplication.findUnique({
      where: {
        studyId_applicantId: {
          studyId,
          applicantId: session.userId,
        },
      },
    });

    const isAssigned = await prisma.studyDataCollector.findUnique({
      where: {
        studyId_userId: {
          studyId,
          userId: session.userId,
        },
      },
    });

    return NextResponse.json({
      applied: Boolean(userApplication),
      status: userApplication?.status ?? null,
      isAssigned: Boolean(isAssigned),
    });
  } catch (error) {
    console.error("GET applications error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
