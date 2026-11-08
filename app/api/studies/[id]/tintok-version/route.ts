import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTintokVersion,
  evaluateQuestionForTintok,
  containsSensitiveKeyword,
  TintokValidationError,
} from "@/lib/tintok/createVersion";
import { FEATURES } from "@/lib/config/features";
import { StudyFormat, StudyLinkType, StudyStatus } from "@/generated/prisma/client";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const parent = await prisma.study.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: { orderBy: { order: "asc" } },
            rows: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
        childStudies: {
          where: { linkType: StudyLinkType.TINTOK_VERSION },
          select: { id: true, title: true, status: true },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    // Check Researcher Governance & Role
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, codeOfConductAcceptedAt: true, dpaAcceptedAt: true },
    });

    // Must be study owner or admin
    if (parent.researcherId !== session.userId && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const hasAcceptedCodeOfConduct = Boolean(user?.codeOfConductAcceptedAt);
    const hasAcceptedDpa = Boolean(user?.dpaAcceptedAt);

    // Evaluate reasons why creation might be blocked
    let canCreate = true;
    let blockingReason: string | null = null;

    if (!FEATURES.TINTOK_ENABLED) {
      canCreate = false;
      blockingReason = "Tintok micro-study creation is temporarily disabled on the platform.";
    } else if (!hasAcceptedCodeOfConduct || !hasAcceptedDpa) {
      canCreate = false;
      blockingReason = "You must accept the Researcher Code of Conduct and Data Processing Agreement (DPA) in Settings before creating a Tintok study.";
    } else if (parent.format !== StudyFormat.STANDARD) {
      canCreate = false;
      blockingReason = "Only standard survey studies can be used to generate a Tintok version.";
    } else if (parent.involvesMinors) {
      canCreate = false;
      blockingReason = "Studies involving minors cannot be converted to Tintok card format. Card studies are strictly for adults (18+).";
    } else if (parent.containsSensitiveTopics) {
      canCreate = false;
      blockingReason = "Studies containing sensitive topics are not permitted in Tintok card format.";
    } else {
      const titleSensitive = containsSensitiveKeyword(parent.title);
      const descSensitive = containsSensitiveKeyword(parent.description);
      const objSensitive = containsSensitiveKeyword(parent.objective);
      const matched = titleSensitive || descSensitive || objSensitive;
      if (matched) {
        canCreate = false;
        blockingReason = `Parent study touches sensitive health topic ("${matched}") which requires full clinical standard protocol.`;
      }
    }

    // Check existing active Tintok versions
    const activeTintok = parent.childStudies.find((c) => c.status !== StudyStatus.COMPLETED);
    if (activeTintok) {
      canCreate = false;
      blockingReason = `This study already has an active Tintok version: "${activeTintok.title}".`;
    }

    // Evaluate all questions
    const evaluations = parent.questions.map((q) => evaluateQuestionForTintok(q));
    const eligibleQuestions = evaluations.filter((e) => e.eligible);
    const skippedQuestions = evaluations.filter((e) => !e.eligible);

    if (canCreate && eligibleQuestions.length === 0) {
      canCreate = false;
      blockingReason = "None of the questions in this study are compatible with the mobile card format.";
    }

    const proposedCount = Math.min(FEATURES.DEFAULT_PRESELECTED_TINTOK_CARDS, eligibleQuestions.length);
    const proposedQuestionIds = eligibleQuestions.slice(0, proposedCount).map((e) => e.questionId);

    return NextResponse.json({
      canCreate,
      blockingReason,
      parentStudy: {
        id: parent.id,
        title: parent.title,
        status: parent.status,
        format: parent.format,
        fundingType: parent.fundingType,
        rewardCredits: parent.rewardCredits,
        estimatedMinutes: parent.estimatedMinutes,
        involvesMinors: parent.involvesMinors,
        containsSensitiveTopics: parent.containsSensitiveTopics,
      },
      hasAcceptedCodeOfConduct,
      hasAcceptedDpa,
      existingTintokStudyId: activeTintok ? activeTintok.id : null,
      maxCards: FEATURES.MAX_TINTOK_CARDS,
      eligibleQuestions,
      skippedQuestions,
      proposedQuestionIds,
      defaultTeaserLink: parent.status === StudyStatus.ACTIVE,
    });
  } catch (error: any) {
    console.error("GET tintok-version error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const body = await req.json().catch(() => ({}));

    const report = await createTintokVersion(id, session.userId, {
      selectedQuestionIds: body.selectedQuestionIds,
      teaserLinkEnabled: body.teaserLinkEnabled,
      fundingType: body.fundingType,
      rewardCredits: body.rewardCredits,
      creditBudget: body.creditBudget,
    });

    return NextResponse.json({
      success: true,
      studyId: report.tintokStudyId,
      report,
    });
  } catch (error: any) {
    if (error instanceof TintokValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error("POST tintok-version error:", error);
    return NextResponse.json({ error: error.message || "Failed to create Tintok version" }, { status: 500 });
  }
}
