import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generate6DigitCode,
  generateVerificationToken,
  getActiveCodeForDebug,
} from "@/lib/emailVerification";
import { sendVerificationEmail } from "@/lib/emailService";
import { getBaseUrl } from "@/lib/getRedirectUri";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "This email is already verified. You can log in directly.", isVerified: true },
        { status: 200 }
      );
    }

    const code = generate6DigitCode();
    const token = await generateVerificationToken({
      userId: user.id,
      email: user.email,
      code,
    });

    const baseUrl = getBaseUrl(request);
    const verificationLink = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    const emailResult = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      code,
      verificationLink,
    });

    return NextResponse.json({
      message: "Verification code sent to your email.",
      simulated: emailResult.simulated,
      // For testing when running locally without SMTP, expose code if simulated
      debugCode: emailResult.simulated ? code : undefined,
    });
  } catch (error) {
    console.error("[Resend Verification] Error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email." },
      { status: 500 }
    );
  }
}
