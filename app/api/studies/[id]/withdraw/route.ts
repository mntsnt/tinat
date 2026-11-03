import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { withdrawConsent } from "@/lib/consent/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const body = await request.json().catch(() => ({}));
    const reason = body?.reason as string | undefined;

    const link = await prisma.participantLink.findUnique({
      where: {
        studyId_userId: {
          studyId: id,
          userId: user.id,
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "No active participation record found for this study." },
        { status: 404 }
      );
    }

    const result = await withdrawConsent(link.respondentCode, id, reason);

    return NextResponse.json({
      message: "Participation withdrawn. All partial responses have been purged.",
      purgedResponses: result.purgedResponses,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
