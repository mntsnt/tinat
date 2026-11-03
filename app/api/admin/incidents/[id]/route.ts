import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { validateBody, jsonError } from "@/lib/validation";

const UpdateIncidentSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "CONTAINED", "NOTIFIED", "RESOLVED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  notifiedParties: z.string().optional().nullable(),
  dataAffected: z.string().optional().nullable(),
  description: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const { id } = await params;
    const validation = await validateBody(UpdateIncidentSchema, request);
    if (!validation.ok) return validation.response;

    const data = validation.data;
    const resolved = data.status === "RESOLVED";

    const updated = await prisma.incidentLog.update({
      where: { id },
      data: {
        ...data,
        ...(data.status ? { resolved } : {}),
      },
    });

    await logActivity({
      userId: admin.id,
      action: "SECURITY_INCIDENT_UPDATED",
      description: `Admin ${admin.name} updated incident ${id} status to ${updated.status}.`,
      resourceId: id,
      resourceType: "IncidentLog",
    });

    return NextResponse.json({ success: true, incident: updated });
  } catch (error) {
    console.error("Update incident error:", error);
    return jsonError("Failed to update incident log", 500);
  }
}
