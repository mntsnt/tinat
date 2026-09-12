import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import {
  verifyVerificationToken,
  validateVerificationCode,
  clearVerificationEntry,
} from "@/lib/emailVerification";
import { getBaseUrl } from "@/lib/getRedirectUri";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, email, code } = body;

    let targetEmail: string | null = null;
    let targetUserId: string | null = null;

    if (token) {
      // 1. Verify via token
      const payload = await verifyVerificationToken(token);
      if (!payload) {
        return NextResponse.json(
          { error: "Invalid or expired verification link. Please request a new code." },
          { status: 400 }
        );
      }
      targetEmail = payload.email;
      targetUserId = payload.userId;
    } else if (email && code) {
      // 2. Verify via 6-digit code
      const normalizedEmail = String(email).toLowerCase().trim();
      const isValid = validateVerificationCode(normalizedEmail, String(code));
      if (!isValid) {
        return NextResponse.json(
          { error: "Incorrect or expired verification code." },
          { status: 400 }
        );
      }
      targetEmail = normalizedEmail;
    } else {
      return NextResponse.json(
        { error: "Please provide either a verification token or an email and code." },
        { status: 400 }
      );
    }

    // Find the user in database
    const user = await prisma.user.findFirst({
      where: targetUserId ? { id: targetUserId } : { email: targetEmail! },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Email is already verified.", isVerified: true },
        { status: 200 }
      );
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    if (targetEmail) {
      clearVerificationEntry(targetEmail);
    }

    await logActivity({
      userId: user.id,
      action: "EMAIL_VERIFIED",
      description: `Email ${user.email} successfully verified`,
    });

    return NextResponse.json(
      {
        message: "Email verified successfully! You can now access all features.",
        isVerified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Verify Email] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while verifying your email." },
      { status: 500 }
    );
  }
}

// GET handles direct link clicks from email: /api/auth/verify-email?token=...
export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/verify-email?status=invalid", baseUrl));
    }

    const payload = await verifyVerificationToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/verify-email?status=expired", baseUrl));
    }

    const user = await prisma.user.findFirst({
      where: { email: payload.email },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });

      clearVerificationEntry(payload.email);

      await logActivity({
        userId: user.id,
        action: "EMAIL_VERIFIED",
        description: `Email ${user.email} verified via email link`,
      });
    }

    return NextResponse.redirect(new URL("/verify-email?status=success", baseUrl));
  } catch (error) {
    console.error("[Verify Email GET] Error:", error);
    return NextResponse.redirect(new URL("/verify-email?status=error", baseUrl));
  }
}
