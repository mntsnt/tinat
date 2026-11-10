import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/getRedirectUri";
import { sendCollectorApplicationSubmittedEmail } from "@/lib/emailService";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in to apply as a data collector." }, { status: 401 });
    }

    const { id: studyId } = await params;
    const body = await req.json().catch(() => ({}));
    const { notes } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const study = await prisma.study.findUnique({
      where: { id: studyId },
      include: {
        researcher: { select: { id: true, name: true, email: true } },
      },
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    if (study.status !== "ACTIVE") {
      return NextResponse.json({ error: "You can only apply to active studies." }, { status: 400 });
    }

    if (study.researcherId === user.id) {
      return NextResponse.json({ error: "You cannot apply to your own study." }, { status: 400 });
    }

    // Check if already an assigned collector
    const existingAssignment = await prisma.studyDataCollector.findUnique({
      where: {
        studyId_userId: {
          studyId,
          userId: user.id,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json({ error: "You are already an authorized collector for this study." }, { status: 400 });
    }

    // Check existing application
    const existingApplication = await prisma.collectorApplication.findUnique({
      where: {
        studyId_applicantId: {
          studyId,
          applicantId: user.id,
        },
      },
    });

    if (existingApplication && existingApplication.status === "PENDING") {
      return NextResponse.json({ error: "You already have a pending application for this study." }, { status: 400 });
    }

    // Create or update application
    const application = await prisma.collectorApplication.upsert({
      where: {
        studyId_applicantId: {
          studyId,
          applicantId: user.id,
        },
      },
      create: {
        studyId,
        applicantId: user.id,
        status: "PENDING",
        notes: typeof notes === "string" ? notes.trim() : null,
      },
      update: {
        status: "PENDING",
        notes: typeof notes === "string" ? notes.trim() : null,
        updatedAt: new Date(),
      },
    });

    // In-platform notification to the study researcher
    await prisma.notification.create({
      data: {
        userId: study.researcherId,
        title: "New Field Collector Application",
        message: `${user.name} applied to be a field data collector for "${study.title}".`,
        linkUrl: `/researcher/studies/${study.id}?view=collectors`,
      },
    });

    // Email notification to the researcher
    try {
      const baseUrl = getBaseUrl(req);
      const reviewLink = `${baseUrl}/researcher/studies/${study.id}?view=collectors`;
      await sendCollectorApplicationSubmittedEmail({
        to: study.researcher.email,
        researcherName: study.researcher.name,
        applicantName: user.name,
        applicantEmail: user.email,
        studyTitle: study.title,
        notes: application.notes,
        reviewLink,
      });
    } catch (emailErr) {
      console.error("[Collector Application] Email notification error:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully! The researcher has been notified.",
      application,
    });
  } catch (error) {
    console.error("Apply collector error:", error);
    return NextResponse.json({ error: "Failed to submit collector application." }, { status: 500 });
  }
}
