import { NextResponse } from "next/server";
import { requireRole, verifyAdminReauth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { FEATURES } from "@/lib/config/features";
import { jsonError } from "@/lib/validation";
import { canStudyBecomeActive, requiresFourEyesApproval } from "@/lib/ethics/service";

const allowedStatuses = ["ACTIVE", "PAUSED", "COMPLETED"] as const;
type AllowedStatus = (typeof allowedStatuses)[number];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));
    const status = body?.status as string;

    if (!allowedStatuses.includes(status as AllowedStatus)) {
      return jsonError("Invalid study status.", 400);
    }

    // Require admin re-authentication when approving a study to ACTIVE
    if (status === "ACTIVE") {
      const reauth = await verifyAdminReauth(user, request, body);
      if (!reauth.ok) return reauth.response;
    }

    const study = await prisma.study.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!study) {
      return NextResponse.json(
        { error: "Study not found." },
        { status: 404 }
      );
    }

    if (study.status === "COMPLETED") {
      return NextResponse.json(
        { error: "A completed study cannot be changed." },
        { status: 400 }
      );
    }

    if (study.status === "DRAFT" && status !== "ACTIVE" && status !== "COMPLETED") {
      return NextResponse.json(
        { error: "A draft study can only be activated or completed." },
        { status: 400 }
      );
    }

    if (status === "ACTIVE") {
      const isFunded = study.fundingType === "FUNDED" || (study.rewardCredits > 0 && study.fundingType !== "FREE");

      if (isFunded) {
        const creditPerResponse = study.creditPerResponse || study.rewardCredits;
        const creditBudget = study.creditBudget || study.budgetCredits;
        const creditsSpent = study.creditsSpent || study.creditsPaid;

        if (creditBudget <= 0 || creditPerResponse <= 0) {
          return NextResponse.json(
            { error: "Cannot activate a funded study with zero budget or zero reward." },
            { status: 400 }
          );
        }

        if (creditPerResponse > FEATURES.MAX_CREDITS_PER_RESPONSE) {
          return NextResponse.json(
            { error: `Credit per response exceeds maximum limit of ${FEATURES.MAX_CREDITS_PER_RESPONSE} TC.` },
            { status: 400 }
          );
        }

        if (creditBudget > FEATURES.MAX_CREDIT_BUDGET_PER_STUDY) {
          return NextResponse.json(
            { error: `Credit budget exceeds maximum limit of ${FEATURES.MAX_CREDIT_BUDGET_PER_STUDY} TC.` },
            { status: 400 }
          );
        }

        const remaining = creditBudget - creditsSpent;
        if (remaining < creditPerResponse) {
          return NextResponse.json(
            { error: "Cannot activate a study without sufficient remaining budget." },
            { status: 400 }
          );
        }
      }

      if (study._count.questions === 0) {
        return NextResponse.json(
          { error: "Cannot activate a study with no questions." },
          { status: 400 }
        );
      }

      // Mandatory Ethics Approval Gate
      const ethicsGate = await canStudyBecomeActive(id);
      if (!ethicsGate.canActivate) {
        return NextResponse.json(
          { error: ethicsGate.error },
          { status: 400 }
        );
      }

      // Governance: Four-Eyes Approval Gate for Sensitive Studies or Budget > 1000 TC
      if (requiresFourEyesApproval(study)) {
        if (!study.firstApprovedByAdminId) {
          const updated = await prisma.study.update({
            where: { id },
            data: { firstApprovedByAdminId: user.id },
          });

          await logActivity({
            userId: user.id,
            action: "FOUR_EYES_FIRST_APPROVAL",
            description: `First admin approval recorded by ${user.id} for restricted study ${id}. Awaiting second independent review.`,
            resourceId: id,
            resourceType: "Study",
          });

          return NextResponse.json({
            message: "First administrative approval recorded. Four-eyes governance policy requires a second independent admin review before activation.",
            study: updated,
            pendingSecondApproval: true,
          });
        }

        if (study.firstApprovedByAdminId === user.id) {
          return NextResponse.json(
            { error: "Four-eyes governance rule: A different administrator must conduct the second review to activate this sensitive or high-budget study." },
            { status: 400 }
          );
        }
      }
    }

    const extraData: any = {};
    if (status === "ACTIVE" && study.firstApprovedByAdminId && study.firstApprovedByAdminId !== user.id) {
      extraData.secondApprovedByAdminId = user.id;
    }

    const updatedStudy = await prisma.study.update({
      where: { id },
      data: {
        status: status as AllowedStatus,
        requiresReapproval: false, // Admin approval clears reapproval flag
        ...extraData,
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE_STUDY_STATUS",
      description: `Study ${id} status changed to ${status} by admin`,
      resourceId: id,
      resourceType: "Study",
    });

    return NextResponse.json({
      message: "Study status updated successfully.",
      study: updatedStudy,
    });
  } catch (error) {
    console.error("Admin study status update error:", error);

    return NextResponse.json(
      { error: "Failed to update study status." },
      { status: 500 }
    );
  }
}
