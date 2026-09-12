import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { logActivity } from "../../../../lib/activityLog";
import { generate6DigitCode, generateVerificationToken } from "@/lib/emailVerification";
import { sendVerificationEmail } from "@/lib/emailService";
import { getBaseUrl } from "@/lib/getRedirectUri";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userRole = role === "RESEARCHER" ? "RESEARCHER" : "PARTICIPANT";

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: userRole,
        wallet: {
          create: { balance: 0 },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Log the registration activity
    await logActivity({
      userId: user.id,
      action: "USER_REGISTER",
      description: `Registered as ${user.role}`,
    });

    // Generate verification code and dispatch email
    let simulated = false;
    let debugCode: string | undefined = undefined;
    try {
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

      simulated = emailResult.simulated;
      debugCode = emailResult.simulated ? code : undefined;
    } catch (emailErr) {
      console.error("Failed to send initial verification email:", emailErr);
    }

    return NextResponse.json(
      {
        message: "Account created successfully. Please verify your email.",
        user,
        email: user.email,
        simulated,
        debugCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the account." },
      { status: 500 }
    );
  }
}