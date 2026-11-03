import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { jsonError } from "@/lib/validation";

/**
 * Data Subject Right: Right to Access & Data Portability (Proclamation 1321/2024 Art. 21)
 * Exports all personal data associated with the authenticated user account in JSON format.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    // Fetch personal data across platform
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        institution: true,
        fieldOfStudy: true,
        yearOfStudy: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        faydaVerified: true,
        faydaVerifiedAt: true,
        privacyNoticeVersion: true,
        privacyAcceptedAt: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            balance: true,
            pendingBalance: true,
            totalEarned: true,
            totalWithdrawn: true,
            transactions: {
              select: {
                id: true,
                amount: true,
                type: true,
                reason: true,
                balanceAfter: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        participantLinks: {
          select: {
            studyId: true,
            respondentCode: true,
            createdAt: true,
          },
        },
        dataSubjectRequests: {
          select: {
            id: true,
            type: true,
            status: true,
            reason: true,
            dueDate: true,
            completedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!userData) {
      return jsonError("User profile not found", 404);
    }

    // Record DSR access request as COMPLETED
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.dataSubjectRequest.create({
      data: {
        userId: user.id,
        type: "ACCESS",
        status: "COMPLETED",
        reason: "User requested automated personal data export",
        dueDate,
        completedAt: new Date(),
        details: { exportTimestamp: new Date().toISOString() },
      },
    });

    await logActivity({
      userId: user.id,
      action: "DATA_SUBJECT_EXPORT",
      description: `User ${user.name} exported their personal data under Proclamation 1321/2024.`,
      resourceId: user.id,
      resourceType: "User",
    });

    const exportPayload = {
      complianceFramework: "Ethiopian Personal Data Protection Proclamation 1321/2024",
      exportTimestamp: new Date().toISOString(),
      dataSubject: userData,
      notice: "This file contains your confidential personal data. Answers to research questionnaires are separated and pseudonymized under unique Respondent Codes.",
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="tinat_personal_data_${user.id}.json"`,
      },
    });
  } catch (error) {
    console.error("DSR export error:", error);
    return jsonError("Failed to export personal data", 500);
  }
}
