import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { jsonError } from "@/lib/validation";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    const study = await prisma.study.findUnique({
      where: { id },
      include: {
        ethicsApproval: {
          include: {
            verifiedByAdmin: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        researcher: {
          select: { id: true, name: true, email: true, institution: true },
        },
      },
    });

    if (!study) {
      return jsonError("Study not found", 404);
    }

    return NextResponse.json({
      studyId: study.id,
      title: study.title,
      format: study.format,
      ethicsApproval: study.ethicsApproval,
      ethicsExempt: study.ethicsExempt,
      ethicsExemptionReason: study.ethicsExemptionReason,
      researcher: study.researcher,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch ethics review details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { id } = await context.params;
    const body = await request.json();

    const {
      status,
      adminNotes,
      checklist,
      exempt = false,
      exemptionReason,
    } = body;

    const study = await prisma.study.findUnique({
      where: { id },
      include: { ethicsApproval: true },
    });

    if (!study) {
      return jsonError("Study not found", 404);
    }

    // Handle Admin Exemption
    if (exempt) {
      if (typeof exemptionReason !== "string" || !exemptionReason.trim()) {
        return jsonError(
          "A written, logged exemption reason is strictly required when granting an ethics exemption.",
          400
        );
      }

      const updatedStudy = await prisma.study.update({
        where: { id },
        data: {
          ethicsExempt: true,
          ethicsExemptionReason: exemptionReason.trim(),
          ethicsExemptedByAdminId: user.id,
          ethicsExemptedAt: new Date(),
        },
      });

      await logActivity({
        userId: user.id,
        action: "ETHICS_EXEMPTION_GRANTED",
        description: `Admin ${user.id} granted ethics exemption for study ${id}: ${exemptionReason.trim()}`,
        resourceId: id,
        resourceType: "Study",
      });

      return NextResponse.json({
        message: "Study marked as ethics exempt with logged administrative reason.",
        study: updatedStudy,
      });
    }

    // Handle Ethics Approval Decision (VERIFIED or REJECTED)
    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return jsonError("Status must be either VERIFIED or REJECTED.", 400);
    }

    if (typeof adminNotes !== "string" || !adminNotes.trim()) {
      return jsonError("Review notes explaining the decision are required.", 400);
    }

    if (!study.ethicsApproval) {
      return jsonError(
        "No ethics approval has been submitted for this study to review.",
        400
      );
    }

    if (status === "VERIFIED") {
      if (study.format === "TINTOK") {
        const coversCard = Boolean(checklist?.coversCardFormatSurvey ?? checklist?.coversOnlineDataCollection);
        const nonSensitive = Boolean(checklist?.nonSensitiveAdultOnly);
        const appropriateConsent = Boolean(checklist?.appropriateConsent ?? checklist?.consentMatches);
        const creditsCompliant = Boolean(checklist?.creditsDescribedNonCash ?? checklist?.incentiveDescribedCorrectly);

        if (!coversCard || !nonSensitive || !appropriateConsent || !creditsCompliant) {
          return jsonError(
            "All 4 Tintok review checklist items must be confirmed before verifying ethics approval: (1) approval covers a short card-format online survey, (2) content is non-sensitive and adult-only, (3) consent text is appropriate, and (4) credits are described as non-cash.",
            400
          );
        }
      } else {
        // Standard study checklist
        if (
          !checklist ||
          !checklist.committeeRecognized ||
          !checklist.coversOnlineDataCollection ||
          !checklist.incentiveDescribedCorrectly ||
          !checklist.consentMatches
        ) {
          return jsonError(
            "All 4 review checklist items must be confirmed before verifying ethics approval: (1) committee recognized, (2) covers online data collection, (3) incentive described as non-cash credits (or none), and (4) consent text matches.",
            400
          );
        }
      }
    }

    const updatedApproval = await prisma.ethicsApproval.update({
      where: { studyId: id },
      data: {
        status,
        adminNotes: adminNotes.trim(),
        checklist: checklist || null,
        verifiedByAdminId: user.id,
        verifiedAt: new Date(),
      },
    });

    await logActivity({
      userId: user.id,
      action: status === "VERIFIED" ? "ETHICS_APPROVAL_VERIFIED" : "ETHICS_APPROVAL_REJECTED",
      description: `Ethics approval for study ${id} marked ${status} by admin ${user.id}`,
      resourceId: id,
      resourceType: "Study",
    });

    return NextResponse.json({
      message: `Ethics approval successfully marked as ${status}.`,
      ethicsApproval: updatedApproval,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process ethics review decision" },
      { status: 500 }
    );
  }
}
