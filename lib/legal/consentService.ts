import { prisma } from "@/lib/prisma";
import {
  PLATFORM_DOCUMENT_VERSIONS,
  getCombinedDocumentText,
  computeDocumentHash,
} from "./platformDocuments";
import { createHash } from "crypto";

export interface PlatformConsentCheckResult {
  hasValidConsent: boolean;
  needsReacceptance: boolean;
  latestRecord: {
    id: string;
    termsVersion: string;
    privacyVersion: string;
    summaryVersion: string;
    documentHash: string;
    optionalContactConsent: boolean;
    acceptedAt: Date;
  } | null;
  currentVersions: typeof PLATFORM_DOCUMENT_VERSIONS;
  currentDocumentHash: string;
  diffSummary?: string[];
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip || ip === "unknown") return null;
  const salt = process.env.AUTH_SECRET || "tinat-ip-salt";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex").slice(0, 32);
}

/**
 * Checks whether a user has accepted the latest platform legal documents.
 */
export async function checkPlatformConsent(userId: string): Promise<PlatformConsentCheckResult> {
  const currentCombinedText = getCombinedDocumentText();
  const currentDocumentHash = computeDocumentHash(currentCombinedText);

  const latestRecord = await prisma.platformConsentRecord.findFirst({
    where: { userId },
    orderBy: { acceptedAt: "desc" },
    select: {
      id: true,
      termsVersion: true,
      privacyVersion: true,
      summaryVersion: true,
      documentHash: true,
      optionalContactConsent: true,
      acceptedAt: true,
    },
  });

  if (!latestRecord) {
    return {
      hasValidConsent: false,
      needsReacceptance: false,
      latestRecord: null,
      currentVersions: PLATFORM_DOCUMENT_VERSIONS,
      currentDocumentHash,
    };
  }

  const versionsMatch =
    latestRecord.termsVersion === PLATFORM_DOCUMENT_VERSIONS.TERMS &&
    latestRecord.privacyVersion === PLATFORM_DOCUMENT_VERSIONS.PRIVACY &&
    latestRecord.summaryVersion === PLATFORM_DOCUMENT_VERSIONS.SUMMARY &&
    latestRecord.documentHash === currentDocumentHash;

  if (versionsMatch) {
    return {
      hasValidConsent: true,
      needsReacceptance: false,
      latestRecord,
      currentVersions: PLATFORM_DOCUMENT_VERSIONS,
      currentDocumentHash,
    };
  }

  // Version changed -> requires re-acceptance
  const diffSummary: string[] = [];
  if (latestRecord.termsVersion !== PLATFORM_DOCUMENT_VERSIONS.TERMS) {
    diffSummary.push(`Terms of Use updated (was v${latestRecord.termsVersion}, now v${PLATFORM_DOCUMENT_VERSIONS.TERMS})`);
  }
  if (latestRecord.privacyVersion !== PLATFORM_DOCUMENT_VERSIONS.PRIVACY) {
    diffSummary.push(`Privacy Notice updated (was v${latestRecord.privacyVersion}, now v${PLATFORM_DOCUMENT_VERSIONS.PRIVACY})`);
  }
  if (latestRecord.summaryVersion !== PLATFORM_DOCUMENT_VERSIONS.SUMMARY) {
    diffSummary.push(`Data Use Summary updated (was v${latestRecord.summaryVersion}, now v${PLATFORM_DOCUMENT_VERSIONS.SUMMARY})`);
  }
  if (diffSummary.length === 0 && latestRecord.documentHash !== currentDocumentHash) {
    diffSummary.push("Platform legal documents text was amended and re-hashed");
  }

  return {
    hasValidConsent: false,
    needsReacceptance: true,
    latestRecord,
    currentVersions: PLATFORM_DOCUMENT_VERSIONS,
    currentDocumentHash,
    diffSummary,
  };
}

/**
 * Persists a new PlatformConsentRecord for a user.
 */
export async function recordPlatformConsent(params: {
  userId: string;
  optionalContactConsent?: boolean;
  ipHash?: string | null;
  locale?: string;
  clientProvidedHash?: string;
}) {
  const currentCombinedText = getCombinedDocumentText();
  const calculatedHash = computeDocumentHash(currentCombinedText);

  if (params.clientProvidedHash && params.clientProvidedHash !== calculatedHash) {
    throw new Error("Document version hash mismatch. Please refresh and review the updated document text.");
  }

  return prisma.platformConsentRecord.create({
    data: {
      userId: params.userId,
      termsVersion: PLATFORM_DOCUMENT_VERSIONS.TERMS,
      privacyVersion: PLATFORM_DOCUMENT_VERSIONS.PRIVACY,
      summaryVersion: PLATFORM_DOCUMENT_VERSIONS.SUMMARY,
      documentHash: calculatedHash,
      optionalContactConsent: Boolean(params.optionalContactConsent),
      ipHash: params.ipHash || null,
      locale: params.locale || "en",
    },
  });
}
