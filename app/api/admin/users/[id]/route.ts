import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        institution: true,
        fieldOfStudy: true,
        yearOfStudy: true,
        bio: true,
        avatarUrl: true,
        isVerified: true,
        faydaVerified: true,
        faydaVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            balance: true,
          },
        },
        studies: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            rewardCredits: true,
            createdAt: true,
          },
        },
        withdrawals: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            createdAt: true,
          },
        },
        verifications: {
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            verificationType: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
          },
        },
        _count: {
          select: {
            studies: true,
            responses: true,
            withdrawals: true,
            verifications: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin user detail fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}
