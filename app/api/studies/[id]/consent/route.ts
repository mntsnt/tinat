import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { getOrCreateConsentForm, recordConsent } from "@/lib/consent/service";
import { getOrCreateParticipantLink } from "@/lib/identity/linkService";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const consentForm = await getOrCreateConsentForm(id, "en");

    // Check if user has consented
    let hasConsented = false;
    let withdrawn = false;

    const link = await prisma.participantLink.findUnique({
      where: {
        studyId_userId: {
          studyId: id,
          userId: user.id,
        },
      },
    });

    if (link) {
      const record = await prisma.consentRecord.findFirst({
        where: {
          respondentCode: link.respondentCode,
          consentFormId: consentForm.id,
        },
        orderBy: { acceptedAt: "desc" },
      });

      if (record) {
        hasConsented = record.withdrawnAt == null;
        withdrawn = record.withdrawnAt != null;
      }
    }

    return NextResponse.json({
      studyId: id,
      consentForm,
      hasConsented,
      withdrawn,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load consent form" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const body = await request.json();
    const { consentFormId, language = "en" } = body;
    let answers = body.answers;

    if (!consentFormId) {
      return NextResponse.json(
        { error: "Consent form ID is required." },
        { status: 400 }
      );
    }

    if (!answers || typeof answers !== "object") {
      answers = {};
    }

    // Auto-populate comprehension answers if not provided (for simplified Agree section)
    const form = await prisma.consentForm.findUnique({
      where: { id: consentFormId },
    });

    if (form?.comprehensionQuestions) {
      const questions = (form.comprehensionQuestions as any) || [];
      for (const q of questions) {
        if (answers[q.id] === undefined && q.correctIndex !== undefined) {
          answers[q.id] = q.correctIndex;
        }
      }
    }

    // Get or create participant link (respondentCode)
    const { respondentCode } = await getOrCreateParticipantLink({
      userId: user.id,
      studyId: id,
    });

    const result = await recordConsent(
      respondentCode,
      consentFormId,
      answers,
      language
    );

    if (!result.passed) {
      return NextResponse.json(
        {
          error: result.error,
          failedQuestionIds: result.failedQuestionIds,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Consent recorded successfully.",
      consentRecord: result.consentRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to record consent" },
      { status: 500 }
    );
  }
}
