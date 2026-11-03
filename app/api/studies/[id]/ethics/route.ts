import { NextRequest, NextResponse } from "next/server";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { saveEthicsDocument } from "@/lib/ethics/storage";
import { logActivity } from "@/lib/activityLog";

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
      include: {
        verifiedByAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      studyId: id,
      ethicsApproval: approval,
      ethicsExempt: auth.study.ethicsExempt,
      ethicsExemptionReason: auth.study.ethicsExemptionReason,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch ethics approval" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireStudyOwnerOrAdmin(id, request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const contentType = request.headers.get("content-type") || "";
    let committeeName = "";
    let approvalNumber = "";
    let approvalDateStr = "";
    let expiryDateStr = "";
    let documentBuffer: Buffer | null = null;
    let documentFilename = "approval.pdf";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      committeeName = (formData.get("committeeName") as string) || "";
      approvalNumber = (formData.get("approvalNumber") as string) || "";
      approvalDateStr = (formData.get("approvalDate") as string) || "";
      expiryDateStr = (formData.get("expiryDate") as string) || "";
      const file = formData.get("document") as File | null;
      if (file) {
        documentFilename = file.name || "approval.pdf";
        const arrayBuf = await file.arrayBuffer();
        documentBuffer = Buffer.from(arrayBuf);
      }
    } else {
      const body = await request.json();
      committeeName = body.committeeName || "";
      approvalNumber = body.approvalNumber || "";
      approvalDateStr = body.approvalDate || "";
      expiryDateStr = body.expiryDate || "";
      if (body.documentBase64) {
        documentBuffer = Buffer.from(body.documentBase64, "base64");
        documentFilename = body.documentFilename || "approval.pdf";
      }
    }

    if (!committeeName.trim()) {
      return NextResponse.json(
        { error: "Committee name is required." },
        { status: 400 }
      );
    }

    if (!approvalNumber.trim()) {
      return NextResponse.json(
        { error: "Approval reference number is required." },
        { status: 400 }
      );
    }

    const approvalDate = new Date(approvalDateStr);
    const expiryDate = new Date(expiryDateStr);

    if (isNaN(approvalDate.getTime()) || isNaN(expiryDate.getTime())) {
      return NextResponse.json(
        { error: "Valid approval date and expiry date are required." },
        { status: 400 }
      );
    }

    if (expiryDate.getTime() <= approvalDate.getTime()) {
      return NextResponse.json(
        { error: "Expiry date must be after the approval date." },
        { status: 400 }
      );
    }

    let documentPath = "pending-upload.pdf";
    if (documentBuffer) {
      documentPath = await saveEthicsDocument(id, documentFilename, documentBuffer);
    }

    const ethicsApproval = await prisma.ethicsApproval.upsert({
      where: { studyId: id },
      create: {
        studyId: id,
        committeeName: committeeName.trim(),
        approvalNumber: approvalNumber.trim(),
        approvalDate,
        expiryDate,
        documentPath,
        status: "PENDING",
      },
      update: {
        committeeName: committeeName.trim(),
        approvalNumber: approvalNumber.trim(),
        approvalDate,
        expiryDate,
        ...(documentBuffer ? { documentPath } : {}),
        status: "PENDING",
        verifiedAt: null,
        verifiedByAdminId: null,
      },
    });

    await logActivity({
      userId: user.id,
      action: "ETHICS_APPROVAL_SUBMITTED",
      description: `Ethics approval submitted for study ${id}: ${approvalNumber}`,
      resourceId: id,
      resourceType: "Study",
    });

    return NextResponse.json({
      message: "Ethics approval submitted successfully for administrative review.",
      ethicsApproval,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit ethics approval" },
      { status: 500 }
    );
  }
}
