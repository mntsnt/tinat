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
 *   - metadata: Optional additional structured audit metadata appended to description.
 */
export async function logActivity(params: {
  userId: string;
  action: string;
  description?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
}) {
  const fullDescription = params.metadata
    ? `${params.description ?? ""} [meta: ${JSON.stringify(params.metadata)}]`.trim()
    : params.description;

  await prisma.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      description: fullDescription,
      resourceId: params.resourceId,
      resourceType: params.resourceType,
    },
  });
}
