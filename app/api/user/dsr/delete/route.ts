import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { validateBody, jsonError } from "@/lib/validation";

const DeleteRequestSchema = z.object({
  reason: z.string().min(5, "Please state a reason for requesting account deletion"),
  confirmAcknowledgment: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge the legal statutory retention hold on financial transaction records",
  }),
});

/**
 * Data Subject Right: Right to Erasure / Account Deletion (Proclamation 1321/2024 Art. 24)
 * Registers an account erasure request with a 30-day statutory due date and documents
 * legal retention holds for financial ledger transactions.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const validation = await validateBody(DeleteRequestSchema, request);
    if (!validation.ok) return validation.response;

    const { reason } = validation.data;

    // Check if an existing erasure request is already pending
    const existing = await prisma.dataSubjectRequest.findFirst({
      where: {
        userId: user.id,
        type: "ERASURE",
        status: { in: ["PENDING", "IN_REVIEW"] },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "An erasure request is already pending review.",
        request: existing,
      });
    }

    // Due date: 30 days per Proclamation 1321/2024 Art. 24
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const dsr = await prisma.dataSubjectRequest.create({
      data: {
        userId: user.id,
        type: "ERASURE",
        status: "PENDING",
        reason: reason.trim(),
        dueDate,
        details: {
          statutoryHoldNotice:
            "Under Ethiopian banking and anti-money laundering regulations, double-entry financial credit ledgers cannot be deleted and will remain pseudonymized.",
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: "DATA_SUBJECT_ERASURE_REQUESTED",
      description: `User ${user.name} submitted an account erasure request under Proclamation 1321/2024. Due date: ${dueDate.toISOString()}`,
      resourceId: dsr.id,
      resourceType: "DataSubjectRequest",
      metadata: { reason, dueDate: dueDate.toISOString() },
    });

    return NextResponse.json({
      success: true,
      message:
        "Your erasure request has been submitted. In accordance with Article 24 of Proclamation 1321/2024, your request will be processed within 30 days.",
      request: dsr,
      statutoryHold:
        "Notice: While direct identifying information will be erased, double-entry credit accounting records and de-identified scientific study responses are retained under statutory research and financial recordkeeping requirements.",
    });
  } catch (error) {
    console.error("DSR erasure request error:", error);
    return jsonError("Failed to register erasure request", 500);
  }
}
