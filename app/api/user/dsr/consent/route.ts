import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { validateBody, jsonError } from "@/lib/validation";

const ConsentSchema = z.object({
  withdrawOptionalProcessing: z.boolean(),
  reason: z.string().optional(),
});

/**
 * Data Subject Right: Right to Withdraw Consent (Proclamation 1321/2024 Art. 6(3))
 * Allows data subjects to withdraw consent for optional processing at any time.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const validation = await validateBody(ConsentSchema, request);
    if (!validation.ok) return validation.response;

    const { withdrawOptionalProcessing, reason } = validation.data;
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const dsr = await prisma.dataSubjectRequest.create({
      data: {
        userId: user.id,
        type: "WITHDRAW_CONSENT",
        status: "COMPLETED",
        reason: reason || "User updated optional consent preferences",
        dueDate,
        completedAt: new Date(),
        details: { withdrawOptionalProcessing },
      },
    });

    await logActivity({
      userId: user.id,
      action: "DATA_SUBJECT_CONSENT_WITHDRAWN",
      description: `User ${user.name} modified consent preferences under Proclamation 1321/2024.`,
      resourceId: dsr.id,
      resourceType: "DataSubjectRequest",
    });

    return NextResponse.json({
      success: true,
      message: "Consent preferences updated successfully.",
      request: dsr,
    });
  } catch (error) {
    console.error("DSR consent error:", error);
    return jsonError("Failed to update consent preferences", 500);
  }
}
