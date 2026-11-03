import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/authGuard";
import { validateBody, jsonError } from "@/lib/validation";
import { getClientIp } from "@/lib/rateLimit";
import { resolveRespondentForFraudInvestigation } from "@/lib/identity/linkService";

const ResolveSchema = z.object({
  respondentCode: z.string().min(1, "respondentCode is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters detailing the fraud investigation justification"),
});

export async function POST(request: Request) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;

    const validation = await validateBody(ResolveSchema, request);
    if (!validation.ok) return validation.response;

    const { respondentCode, reason } = validation.data;
    const ipAddress = getClientIp(request);

    const result = await resolveRespondentForFraudInvestigation({
      respondentCode,
      adminUserId: auth.user.id,
      reason,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      data: result,
      auditNotice: "This access was permanently recorded in the platform ActivityLog for regulatory compliance.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to resolve respondent code";
    return jsonError(message, 400);
  }
}
