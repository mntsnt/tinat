import { prisma } from "./prisma";

/**
 * Log an activity performed by a user.
 *
 * @param params - Logging parameters.
 *   - userId: ID of the user who performed the action.
 *   - action: Machine‑readable action identifier (e.g., "USER_REGISTER").
 *   - description: Optional human‑readable description.
 *   - resourceId: Optional ID of a related entity (study, payment, etc.).
 *   - resourceType: Optional type of the related entity ("Study", "StudyPayment", ...).
 */
export async function logActivity(params: {
  userId: string;
  action: string;
  description?: string;
  resourceId?: string;
  resourceType?: string;
}) {
  await prisma.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      description: params.description,
      resourceId: params.resourceId,
      resourceType: params.resourceType,
    },
  });
}
