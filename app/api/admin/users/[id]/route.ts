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
          take: 10,
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
          take: 10,
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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { isVerified, faydaVerified, role, walletAdjustment, reason } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: any = {};
    if (typeof isVerified === "boolean") {
      data.isVerified = isVerified;
    }

    if (typeof faydaVerified === "boolean") {
      data.faydaVerified = faydaVerified;
      data.faydaVerifiedAt = faydaVerified ? new Date() : null;
    }

    if (role && ["PARTICIPANT", "RESEARCHER", "ADMIN"].includes(role)) {
      data.role = role;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Wallet adjustment if specified
      if (typeof walletAdjustment === "number" && walletAdjustment !== 0) {
        if (!targetUser.wallet) {
          await tx.wallet.create({
            data: {
              userId: id,
              balance: Math.max(0, walletAdjustment),
            },
          });
        } else {
          await tx.wallet.update({
            where: { userId: id },
            data: {
              balance: {
                increment: walletAdjustment,
              },
            },
          });
        }

        // Record activity log for wallet credit/debit
        await tx.activityLog.create({
          data: {
            userId: admin.id,
            action: "WALLET_ADJUSTED_BY_ADMIN",
            description: `Admin ${admin.name} adjusted wallet of ${targetUser.name} by ${walletAdjustment > 0 ? "+" : ""}${walletAdjustment} TC. Reason: ${reason || "Admin discretion"}`,
            resourceId: id,
            resourceType: "USER",
          },
        });
      }

      if (Object.keys(data).length > 0) {
        // Record activity log for user changes
        await tx.activityLog.create({
          data: {
            userId: admin.id,
            action: "USER_UPDATED_BY_ADMIN",
            description: `Admin ${admin.name} updated user ${targetUser.name}: ${JSON.stringify(data)}`,
            resourceId: id,
            resourceType: "USER",
          },
        });

        return tx.user.update({
          where: { id },
          data,
          include: { wallet: true },
        });
      }

      return tx.user.findUnique({
        where: { id },
        include: { wallet: true },
      });
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
