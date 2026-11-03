import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { validateBody, jsonError } from "@/lib/validation";

const CreateIncidentSchema = z.object({
  type: z.string().min(2, "Incident type is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("HIGH"),
  category: z.string().default("DATA_PROTECTION"),
  description: z.string().min(5, "Description is required"),
  detectedAt: z.string().optional(),
  dataAffected: z.string().optional().nullable(),
  notifiedParties: z.string().optional().nullable(),
  status: z.enum(["OPEN", "INVESTIGATING", "CONTAINED", "NOTIFIED", "RESOLVED"]).default("OPEN"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: Request) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;

    const incidents = await prisma.incidentLog.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, incidents });
  } catch (error) {
    console.error("Fetch incidents error:", error);
    return jsonError("Failed to fetch incident logs", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const validation = await validateBody(CreateIncidentSchema, request);
    if (!validation.ok) return validation.response;

    const data = validation.data;
    const detectedAt = data.detectedAt ? new Date(data.detectedAt) : new Date();

    const incident = await prisma.incidentLog.create({
      data: {
        type: data.type,
        severity: data.severity,
        category: data.category,
        description: data.description,
        detectedAt,
        dataAffected: data.dataAffected,
        notifiedParties: data.notifiedParties,
        status: data.status,
        metadata: (data.metadata || {}) as any,
        resolved: data.status === "RESOLVED",
      },
    });

    await logActivity({
      userId: admin.id,
      action: "SECURITY_INCIDENT_LOGGED",
      description: `Admin ${admin.name} recorded security incident [${data.type}] with severity ${data.severity}.`,
      resourceId: incident.id,
      resourceType: "IncidentLog",
      metadata: {
        incidentId: incident.id,
        severity: data.severity,
        type: data.type,
        status: data.status,
      },
    });

    return NextResponse.json({ success: true, incident }, { status: 201 });
  } catch (error) {
    console.error("Create incident error:", error);
    return jsonError("Failed to create incident log", 500);
  }
}
