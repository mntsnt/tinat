import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";

export interface EthicsChecklist {
  committeeRecognized: boolean;
  coversOnlineDataCollection: boolean;
  incentiveDescribedCorrectly: boolean;
  consentMatches: boolean;
}

export const ETHICS_DISCLAIMER_COPY =
  "Tinat ethics verification is an administrative review gate to confirm platform protocol compliance and technical safeguards. It does NOT replace independent Institutional Review Board (IRB) or national ethics committee approval.";

/**
 * Validates whether a study satisfies the mandatory Ethics Approval Gate to become ACTIVE.
 */
export async function canStudyBecomeActive(studyId: string): Promise<{
  canActivate: boolean;
  error?: string;
  study?: any;
}> {
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: {
      ethicsApproval: true,
    },
  });

  if (!study) {
    return { canActivate: false, error: "Study not found." };
  }

  // Admin exemption path: must be explicitly flagged with written reason
  if (study.ethicsExempt) {
    if (!study.ethicsExemptionReason) {
      return {
        canActivate: false,
        error: "Exempt study is missing a logged exemption reason.",
      };
    }
    return { canActivate: true, study };
  }

  // Standard path: Requires verified, unexpired ethics approval
  const approval = study.ethicsApproval;
  if (!approval) {
    return {
      canActivate: false,
      error:
        "Study cannot become ACTIVE without submitted and verified Institutional Ethics Approval.",
      study,
    };
  }

  if (approval.status !== "VERIFIED") {
    return {
      canActivate: false,
      error: `Ethics approval is currently in ${approval.status} status. It must be VERIFIED before activation.`,
      study,
    };
  }

  if (new Date(approval.expiryDate).getTime() <= Date.now()) {
    return {
      canActivate: false,
      error: `Ethics approval expired on ${new Date(approval.expiryDate).toISOString().slice(0, 10)}. Please renew and submit an updated approval.`,
      study,
    };
  }

  return { canActivate: true, study };
}

/**
 * Scans active studies and pauses any whose ethics approval has expired.
 */
export async function pauseExpiredActiveStudies(): Promise<number> {
  const now = new Date();
  const expiredStudies = await prisma.study.findMany({
    where: {
      status: "ACTIVE",
      ethicsExempt: false,
      ethicsApproval: {
        expiryDate: {
          lte: now,
        },
      },
    },
    include: {
      ethicsApproval: true,
    },
  });

  let pausedCount = 0;
  for (const study of expiredStudies) {
    await prisma.$transaction(async (tx) => {
      await tx.study.update({
        where: { id: study.id },
        data: { status: "PAUSED" },
      });

      if (study.ethicsApproval) {
        await tx.ethicsApproval.update({
          where: { id: study.ethicsApproval.id },
          data: { status: "EXPIRED" },
        });
      }
    });

    await logActivity({
      userId: study.researcherId,
      action: "STUDY_AUTO_PAUSED_EXPIRED_ETHICS",
      description: `Study ${study.id} automatically paused due to expired ethics approval on ${study.ethicsApproval?.expiryDate?.toISOString().slice(0, 10)}`,
      resourceId: study.id,
      resourceType: "Study",
    });

    pausedCount++;
  }

  return pausedCount;
}

/**
 * Checks whether a study requires 4-eyes approval (sensitive topics or budget > 1000 TC).
 */
export function requiresFourEyesApproval(study: {
  containsSensitiveTopics?: boolean | null;
  creditBudget?: number | null;
  budgetCredits?: number | null;
}): boolean {
  if (study.containsSensitiveTopics) return true;
  const budget = study.creditBudget ?? study.budgetCredits ?? 0;
  if (budget > 1000) return true;
  return false;
}
