import { NextRequest, NextResponse } from "next/server";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { getEthicsDocument } from "@/lib/ethics/storage";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireStudyOwnerOrAdmin(id, request);
    if (!auth.ok) return auth.response;

    const approval = await prisma.ethicsApproval.findUnique({
      where: { studyId: id },
    });

    if (!approval || !approval.documentPath) {
      return NextResponse.json(
        { error: "No ethics approval document uploaded for this study." },
        { status: 404 }
      );
    }

    const doc = await getEthicsDocument(approval.documentPath);
    if (!doc) {
      return NextResponse.json(
        { error: "Stored ethics document file not found on server." },
        { status: 404 }
      );
    }

    return new NextResponse(doc.buffer as any, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${doc.filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve ethics document" },
      { status: 500 }
    );
  }
}
