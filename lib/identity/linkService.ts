import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { Prisma } from "@/generated/prisma/client";

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
    select: { id: true },
  });

  return Boolean(link);
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
