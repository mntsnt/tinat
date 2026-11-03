import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";

/**
 * Data Retention & Privacy Sanitization Module
 *
 * Implements data minimization and storage limitation principles under
 * Ethiopian Personal Data Protection Proclamation 1321/2024.
 *
 * Retention Defaults:
 * - Telemetry (ipHash, deviceFingerprint): 90 days
 * - Temporary verification codes: 30 days past expiry
 * - Expired collector invitations: 60 days
 */

export const DEFAULT_RETENTION_CONFIG = {
  TELEMETRY_RETENTION_DAYS: 90,
  VERIFICATION_CODE_RETENTION_DAYS: 30,
  INVITATION_RETENTION_DAYS: 60,
};

export interface RetentionExecutionResult {
  timestamp: string;
  telemetryPurged: number;
  verificationCodesPurged: number;
  invitationsPurged: number;
  durationMs: number;
  success: boolean;
}

/**
 * Anonymizes technical telemetry (ipHash and deviceFingerprint) older than the cutoff.
 */
export async function purgeTelemetryData(cutoffDays: number = DEFAULT_RETENTION_CONFIG.TELEMETRY_RETENTION_DAYS): Promise<number> {
  const cutoffDate = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);

  const updateResult = await prisma.response.updateMany({
    where: {
      submittedAt: {
        lt: cutoffDate,
      },
      OR: [
        { ipHash: { not: null } },
        { deviceFingerprint: { not: null } },
      ],
    },
    data: {
      ipHash: null,
      deviceFingerprint: null,
    },
  });

  return updateResult.count;
}

/**
 * Purges expired verification codes from user accounts.
 */
export async function purgeExpiredVerificationCodes(cutoffDays: number = DEFAULT_RETENTION_CONFIG.VERIFICATION_CODE_RETENTION_DAYS): Promise<number> {
  const cutoffDate = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);

  const updateResult = await prisma.user.updateMany({
    where: {
      verificationCodeExpiresAt: {
        lt: cutoffDate,
      },
      verificationCode: { not: null },
    },
    data: {
      verificationCode: null,
      verificationCodeExpiresAt: null,
    },
  });

  return updateResult.count;
}

/**
 * Purges expired and rejected collector invitations.
 */
export async function purgeExpiredInvitations(cutoffDays: number = DEFAULT_RETENTION_CONFIG.INVITATION_RETENTION_DAYS): Promise<number> {
  const cutoffDate = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);

  const deleteResult = await prisma.collectorInvitation.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
      status: {
        in: ["EXPIRED", "DECLINED"],
      },
    },
  });

  return deleteResult.count;
}

/**
 * Orchestrates full platform data-retention execution.
 */
export async function runDataRetentionPolicy(options?: {
  telemetryDays?: number;
  verificationDays?: number;
  invitationDays?: number;
  systemUserId?: string;
}): Promise<RetentionExecutionResult> {
  const startTime = Date.now();
  const telemetryDays = options?.telemetryDays ?? DEFAULT_RETENTION_CONFIG.TELEMETRY_RETENTION_DAYS;
  const verificationDays = options?.verificationDays ?? DEFAULT_RETENTION_CONFIG.VERIFICATION_CODE_RETENTION_DAYS;
  const invitationDays = options?.invitationDays ?? DEFAULT_RETENTION_CONFIG.INVITATION_RETENTION_DAYS;

  const [telemetryPurged, verificationCodesPurged, invitationsPurged] = await Promise.all([
    purgeTelemetryData(telemetryDays),
    purgeExpiredVerificationCodes(verificationDays),
    purgeExpiredInvitations(invitationDays),
  ]);

  const durationMs = Date.now() - startTime;
  const timestamp = new Date().toISOString();

  // Audit retention execution in ActivityLog
  try {
    const adminUser = options?.systemUserId
      ? { id: options.systemUserId }
      : await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        action: "DATA_RETENTION_POLICY_EXECUTED",
        description: `Automated retention policy purged ${telemetryPurged} telemetry records, ${verificationCodesPurged} expired codes, ${invitationsPurged} invitations.`,
        resourceId: "system-retention",
        resourceType: "System",
        metadata: {
          telemetryPurged,
          verificationCodesPurged,
          invitationsPurged,
          telemetryCutoffDays: telemetryDays,
          durationMs,
          timestamp,
        },
      });
    }
  } catch (logErr) {
    console.error("Failed to write retention activity log:", logErr);
  }

  return {
    timestamp,
    telemetryPurged,
    verificationCodesPurged,
    invitationsPurged,
    durationMs,
    success: true,
  };
}
