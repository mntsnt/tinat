import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { Prisma } from "@/generated/prisma/client";
import { FEATURES } from "@/lib/config/features";

/**
 * Link Service (Identity Separation Module)
 *
 * Requirements (Part 1):
 * 1. ParticipantLink (userId, studyId, respondentCode) is reachable ONLY through this server module.
 * 2. Used strictly by reward and fraud logic.
 * 3. No export, researcher route or admin list may join to it, except an explicit admin fraud-investigation
 *    route that requires a reason and writes an ActivityLog entry.
 * 4. respondentCode is non-guessable, cryptographically random, and not derived from userId.
 */

/**
 * Generates a cryptographically random, non-guessable respondent code.
 * Format: "resp_" + 32 hex characters (128 bits of entropy).
 */
export function generateRespondentCode(): string {
  const randomEntropy = crypto.randomBytes(16).toString("hex");
  return `resp_${randomEntropy}`;
}

/**
 * Atomically retrieves an existing respondent code for a user in a study, or creates a new one.
 */
export async function getOrCreateParticipantLink(params: {
  userId: string;
  studyId: string;
  tx?: Prisma.TransactionClient;
}): Promise<{ respondentCode: string; isNew: boolean }> {
  const { userId, studyId, tx } = params;
  const db = tx ?? prisma;

  const existing = await db.participantLink.findUnique({
    where: {
      studyId_userId: {
        studyId,
        userId,
      },
    },
  });

  if (existing) {
    return {
      respondentCode: existing.respondentCode,
      isNew: false,
    };
  }

  // Generate random non-guessable code
  const respondentCode = generateRespondentCode();

  const newLink = await db.participantLink.create({
    data: {
      userId,
      studyId,
      respondentCode,
    },
  });

  return {
    respondentCode: newLink.respondentCode,
    isNew: true,
  };
}

/**
 * Checks if a user has already participated in a study.
 * Used for duplicate prevention and rating eligibility without querying research answers.
 */
export async function hasUserParticipated(params: {
  userId: string;
  studyId: string;
  tx?: Prisma.TransactionClient;
}): Promise<boolean> {
  const { userId, studyId, tx } = params;
  const db = tx ?? prisma;

  const link = await db.participantLink.findUnique({
    where: {
      studyId_userId: {
        studyId,
        userId,
      },
    },
    select: { respondentCode: true },
  });

  if (!link) return false;

  const response = await db.response.findFirst({
    where: {
      studyId,
      respondentCode: link.respondentCode,
    },
    select: { id: true },
  });

  return Boolean(response);
}

/**
 * Retrieves the respondentCode for a user in a study if it exists.
 */
export async function getRespondentCode(params: {
  userId: string;
  studyId: string;
  tx?: Prisma.TransactionClient;
}): Promise<string | null> {
  const { userId, studyId, tx } = params;
  const db = tx ?? prisma;

  const link = await db.participantLink.findUnique({
    where: {
      studyId_userId: {
        studyId,
        userId,
      },
    },
    select: { respondentCode: true },
  });

  return link?.respondentCode ?? null;
}

/**
 * Explicit admin fraud-investigation function.
 * Resolves a respondentCode to a userId with mandatory justification and audit logging.
 *
 * Access Rules:
 * - Requester MUST be verified ADMIN.
 * - Reason MUST be at least 10 characters.
 * - Writes an indelible ActivityLog record before returning the identity.
 */
export async function resolveRespondentForFraudInvestigation(params: {
  respondentCode: string;
  adminUserId: string;
  reason: string;
  ipAddress?: string;
  tx?: Prisma.TransactionClient;
}): Promise<{
  userId: string;
  studyId: string;
  respondentCode: string;
  linkedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
}> {
  const { respondentCode, adminUserId, reason, ipAddress, tx } = params;
  const db = tx ?? prisma;

  if (!reason || reason.trim().length < 10) {
    throw new Error("Fraud investigation requires a detailed reason of at least 10 characters.");
  }

  // Verify admin credentials
  const admin = await db.user.findUnique({
    where: { id: adminUserId },
    select: { id: true, name: true, role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Only platform administrators can resolve respondent codes.");
  }

  // Look up link
  const link = await db.participantLink.findUnique({
    where: { respondentCode },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
        },
      },
    },
  });

  if (!link) {
    throw new Error("Participant link not found for the provided respondent code.");
  }

  // Write ActivityLog entry
  await logActivity({
    userId: adminUserId,
    action: "FRAUD_INVESTIGATION_LINK_ACCESSED",
    description: `Admin ${admin.name} (${adminUserId}) accessed participant link for respondent ${respondentCode}. Reason: ${reason.trim()}`,
    resourceId: link.id,
    resourceType: "ParticipantLink",
    metadata: {
      respondentCode,
      reason: reason.trim(),
      studyId: link.studyId,
      resolvedUserId: link.userId,
      ipAddress: ipAddress || "unknown",
      timestamp: new Date().toISOString(),
    },
  });

  return {
    userId: link.userId,
    studyId: link.studyId,
    respondentCode: link.respondentCode,
    linkedAt: link.createdAt,
    user: link.user,
  };
}

/**
 * Checks cross-mode participation exclusion.
 * Rule: A participant who already completed the parent study cannot take the Tintok version.
 * Conversely, if a participant completed a Tintok version that didn't have teaserLinkEnabled,
 * they cannot take the parent study (preventing duplicate answers across modes).
 */
export async function isCrossModeExcluded(params: {
  userId: string;
  studyId: string;
  tx?: Prisma.TransactionClient;
}): Promise<{ excluded: boolean; reason?: string }> {
  if (!FEATURES.TINTOK_CROSS_MODE_EXCLUSION_DEFAULT) {
    return { excluded: false };
  }

  const { userId, studyId, tx } = params;
  const db = tx ?? prisma;

  const study = await db.study.findUnique({
    where: { id: studyId },
    select: {
      id: true,
      format: true,
      parentStudyId: true,
      childStudies: {
        where: { linkType: "TINTOK_VERSION" },
        select: { id: true, teaserLinkEnabled: true },
      },
    },
  });

  if (!study) {
    return { excluded: false };
  }

  // Case 1: The current study is a Tintok child study
  if (study.parentStudyId) {
    const parentParticipated = await db.participantLink.findUnique({
      where: {
        studyId_userId: {
          studyId: study.parentStudyId,
          userId,
        },
      },
    });

    if (parentParticipated) {
      return {
        excluded: true,
        reason:
          "You have already completed the full standard version of this study. To maintain research statistical integrity across answering modes, the quick version cannot be taken.",
      };
    }
  }

  // Case 2: The current study is a Standard parent study with linked Tintok child versions
  if (study.childStudies && study.childStudies.length > 0) {
    const childIds = study.childStudies.map((c) => c.id);
    const completedChild = await db.participantLink.findFirst({
      where: {
        userId,
        studyId: { in: childIds },
      },
      include: {
        study: {
          select: { id: true, teaserLinkEnabled: true },
        },
      },
    });

    if (completedChild && !completedChild.study.teaserLinkEnabled) {
      return {
        excluded: true,
        reason:
          "You have already completed the quick card version of this study. To maintain research statistical integrity across answering modes, the full version cannot be taken.",
      };
    }
  }

  return { excluded: false };
}

