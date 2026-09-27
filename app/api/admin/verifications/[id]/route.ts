import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, rejectionReason } = await req.json();

    if (!["VERIFIED", "REJECTED", "SUSPENDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const verification = await prisma.verification.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        reviewedAt: new Date(),
        reviewedById: user.id
      }
    });

    let message = "";
    if (status === "VERIFIED") message = `Your ${verification.verificationType === "RESEARCHER" ? "Researcher" : "Data Collector"} verification has been approved!`;
    else if (status === "REJECTED") message = `Your ${verification.verificationType === "RESEARCHER" ? "Researcher" : "Data Collector"} verification was rejected. Reason: ${rejectionReason || "N/A"}`;
    else if (status === "SUSPENDED") message = `Your ${verification.verificationType === "RESEARCHER" ? "Researcher" : "Data Collector"} verification has been suspended.`;

    await prisma.notification.create({
      data: {
        userId: verification.userId,
        title: "Verification Status Update",
        message,
        linkUrl: verification.verificationType === "RESEARCHER" ? "/researcher/settings" : "/participant/settings"
      }
    });

    return NextResponse.json({ success: true, verification });
  } catch (error) {
    console.error("Admin verification update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
