import { NextResponse } from "next/server";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { FEATURES } from "@/lib/config/features";
import { canStudyBecomeActive } from "@/lib/ethics/service";

const allowedStatuses = ["ACTIVE", "PAUSED", "COMPLETED"] as const;
type AllowedStatus = (typeof allowedStatuses)[number];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireStudyOwnerOrAdmin(id, request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const body = await request.json();
    const status = body?.status as string;
    const switchToFree = Boolean(body?.switchToFree);
    const newCreditPerResponse = body?.creditPerResponse !== undefined ? Number(body.creditPerResponse) : undefined;
    const newCreditBudget = body?.creditBudget !== undefined ? Number(body.creditBudget) : undefined;

    if (status && !allowedStatuses.includes(status as AllowedStatus)) {
      return NextResponse.json(
        { error: "Invalid study status." },
        { status: 400 }
      );
    }

    const study = auth.study;
if (study.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "A completed study cannot be changed.",
        },
        { status: 400 }
      );
    }

    const updateData: any = {};

    // Handle switching to FREE mode (e.g. when budget is exhausted)
    if (switchToFree || body?.fundingType === "FREE") {
      updateData.fundingType = "FREE";
      updateData.studyType = "FREE";
      updateData.creditPerResponse = 0;
      updateData.creditBudget = 0;
      updateData.rewardCredits = 0;
      updateData.budgetCredits = 0;
      updateData.requiresReapproval = false;
    }

    // Handle updating credit settings on an existing study
    if (newCreditPerResponse !== undefined || newCreditBudget !== undefined) {
      const creditPerResp = newCreditPerResponse !== undefined ? newCreditPerResponse : study.creditPerResponse;
      const creditBudg = newCreditBudget !== undefined ? newCreditBudget : study.creditBudget;

      if (creditPerResp > FEATURES.MAX_CREDITS_PER_RESPONSE) {
        return NextResponse.json(
          { error: `Credit per response exceeds maximum limit of ${FEATURES.MAX_CREDITS_PER_RESPONSE} TC.` },
          { status: 400 }
        );
      }

      if (creditBudg > FEATURES.MAX_CREDIT_BUDGET_PER_STUDY) {
        return NextResponse.json(
          { error: `Credit budget exceeds maximum limit of ${FEATURES.MAX_CREDIT_BUDGET_PER_STUDY} TC.` },
          { status: 400 }
        );
      }

      if (creditBudg < creditPerResp) {
        return NextResponse.json(
          { error: "Credit budget must be greater than or equal to credit per response." },
          { status: 400 }
        );
      }

      updateData.creditPerResponse = creditPerResp;
      updateData.rewardCredits = creditPerResp;
      updateData.creditBudget = creditBudg;
      updateData.budgetCredits = creditBudg;

      // Business Rule: Changing credit settings on an approved/active study triggers re-approval
      if (study.status === "ACTIVE") {
        updateData.requiresReapproval = true;
        updateData.status = "PAUSED";
      }
    }

    const targetStatus = (status as AllowedStatus) || (updateData.status as AllowedStatus) || study.status;

    if (targetStatus === "ACTIVE") {
      if (!user.faydaVerified) {
        return NextResponse.json(
          {
            error:
              "You must complete identity verification with your Ethiopian Fayda National ID before publishing or activating a research study. Please verify in Settings.",
          },
          { status: 403 }
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

      // Check if re-approval is required
      if (study.requiresReapproval && !switchToFree && user.role !== "ADMIN") {
        return NextResponse.json(
          {
            error: "This study's credit settings require admin re-approval before it can be activated.",
          },
          { status: 400 }
        );
      }

      const isFunded = (updateData.fundingType ?? study.fundingType) === "FUNDED" ||
                       ((updateData.rewardCredits ?? study.rewardCredits) > 0 && (updateData.fundingType ?? study.fundingType) !== "FREE");

      if (isFunded) {
        const creditPerResponse = updateData.creditPerResponse ?? study.creditPerResponse ?? study.rewardCredits;
        const creditBudget = updateData.creditBudget ?? study.creditBudget ?? study.budgetCredits;
        const creditsSpent = study.creditsSpent || study.creditsPaid;

        const remaining = creditBudget - creditsSpent;
        if (remaining < creditPerResponse) {
          return NextResponse.json(
            {
              error: "This research study has exhausted its credit budget. You can switch to voluntary participation (Free) to continue collecting responses.",
            },
            { status: 400 }
          );
        }
      }

      updateData.status = "ACTIVE";
    } else if (status) {
      updateData.status = status as AllowedStatus;
    }

    const updatedStudy = await prisma.study.update({
      where: {
        id,
      },
      data: updateData,
    });

    await logActivity({
      userId: user.id,
      action: "STUDY_STATUS_CHANGED",
      description: `Study status updated: ${JSON.stringify(updateData)}`,
      resourceId: updatedStudy.id,
      resourceType: "Study",
    });

    return NextResponse.json({
      message: "Study status updated successfully.",
      study: updatedStudy,
    });
  } catch (error) {
    console.error("Study status update error:", error);

    return NextResponse.json(
      {
        error: "Failed to update study status.",
      },
      { status: 500 }
    );
  }
}
