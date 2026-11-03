import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, verifyAdminReauth } from "@/lib/authGuard";
import { jsonError, validateBody } from "@/lib/validation";
import { z } from "zod";

const updateVerificationSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED", "SUSPENDED"]),
  rejectionReason: z.string().optional(),
  adminPassword: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(["ADMIN"], req);
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const validation = await validateBody(updateVerificationSchema, req);
    if (!validation.ok) return validation.response;
    const { status, rejectionReason, adminPassword } = validation.data;

    // Require admin re-authentication when approving a verification
    if (status === "VERIFIED") {
      const reauth = await verifyAdminReauth(auth.user, req, { adminPassword });
      if (!reauth.ok) return reauth.response;
    }

    const verification = await prisma.verification.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        reviewedAt: new Date(),
        reviewedById: auth.user.id,
      },
    });

    let message = "";
    if (status === "VERIFIED") {
      message = `Your ${
        verification.verificationType === "RESEARCHER" ? "Researcher" : "Data Collector"
      } verification has been approved!`;
    } else if (status === "REJECTED") {
      message = `Your ${
        verification.verificationType === "RESEARCHER" ? "Researcher" : "Data Collector"
      } verification was rejected. Reason: ${rejectionReason || "N/A"}`;
    } else if (status === "SUSPENDED") {
      message = `Your ${
        verification.verificationType === "RESEARCHER" ? "Researcher" : "Data Collector"
      } verification has been suspended.`;
    }

    await prisma.notification.create({
      data: {
        userId: verification.userId,
        title: "Verification Status Update",
        message,
        linkUrl:
          verification.verificationType === "RESEARCHER"
            ? "/researcher/settings"
            : "/participant/settings",
      },
    });

    return NextResponse.json({ success: true, verification });
  } catch (error) {
    console.error("Admin verification update error:", error);
    return jsonError("Internal error", 500);
  }
}
