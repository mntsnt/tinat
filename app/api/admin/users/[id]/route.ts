import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeBalancedAdminAdjustment } from "@/lib/ledger";
import { requireRole, verifyAdminReauth } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["ADMIN"], _req);
    if (!auth.ok) return auth.response;
    const admin = auth.user;

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
            participantLinks: true,
            withdrawals: true,
            verifications: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formattedUser = {
      ...user,
      _count: {
        ...user._count,
        responses: (user._count as any).participantLinks ?? 0,
      },
    };

    return NextResponse.json({ user: formattedUser });
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
    const auth = await requireRole(["ADMIN"], req);
    if (!auth.ok) return auth.response;
    const admin = auth.user;

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { isVerified, faydaVerified, role, walletAdjustment, reason } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!targetUser) {
      return jsonError("User not found", 404);
    }

    // Require admin re-authentication and mandatory reason when changing a user's role
    if (role && role !== targetUser.role) {
      if (typeof reason !== "string" || !reason.trim()) {
        return jsonError("A formal, non-empty reason is strictly required when modifying a user role.", 400);
      }
      const reauth = await verifyAdminReauth(admin, req, body);
      if (!reauth.ok) return reauth.response;
    }

    const data: any = {};
    if (typeof isVerified === "boolean") {
      data.isVerified = isVerified;
    }

    if (typeof faydaVerified === "boolean") {
      data.faydaVerified = faydaVerified;
      data.faydaVerifiedAt = faydaVerified ? new Date() : null;
    }

    if (role && ["PARTICIPANT", "RESEARCHER", "ADMIN", "DATA_COLLECTOR"].includes(role)) {
      data.role = role;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Wallet adjustment if specified (balanced double-entry ledger)
      if (typeof walletAdjustment === "number" && walletAdjustment !== 0) {
        await executeBalancedAdminAdjustment({
          userId: id,
          amount: walletAdjustment,
          reason: reason || "Admin discretion",
          adminId: admin.id,
          adminName: admin.name || "Admin",
          tx,
        });

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
        const actionType = (role && role !== targetUser.role) ? "ROLE_CHANGE" : "USER_UPDATED_BY_ADMIN";
        const logDesc = (role && role !== targetUser.role)
          ? `Role changed from ${targetUser.role} to ${role} for user ${targetUser.name} (${targetUser.id}) by Admin ${admin.name}. Reason: ${reason.trim()}`
          : `Admin ${admin.name} updated user ${targetUser.name}: ${JSON.stringify(data)}`;

        await tx.activityLog.create({
          data: {
            userId: admin.id,
            action: actionType,
            description: logDesc,
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
