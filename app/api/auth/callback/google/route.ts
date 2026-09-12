import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { getGoogleRedirectUri } from "@/lib/getRedirectUri";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=Google_Sign_In_Failed", request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    const redirectUri = getGoogleRedirectUri(request);

    if (!clientId || !clientSecret) {
      console.error("Missing Google OAuth credentials in .env");
      return NextResponse.redirect(new URL("/login?error=Configuration_Error", request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Failed to fetch Google token:", await tokenResponse.text());
      return NextResponse.redirect(new URL("/login?error=Google_Token_Error", request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      console.error("Failed to fetch Google user profile:", await userResponse.text());
      return NextResponse.redirect(new URL("/login?error=Google_Profile_Error", request.url));
    }

    const userData = await userResponse.json();
    const { email, name, picture } = userData;

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=Google_No_Email", request.url));
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create random password for Google-authenticated users
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          passwordHash,
          avatarUrl: picture,
          isVerified: true, // Auto-verify Google signups
          role: "PARTICIPANT", // Default role
          wallet: {
            create: { balance: 0 },
          },
        },
      });

      // Log the activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "ACCOUNT_CREATED",
          description: "Registered using Google Sign-In",
        }
      });
    } else {
      // Log sign in
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          description: "Logged in via Google",
        }
      });
    }

    // Create session
    await createSession(user.id);

    // Redirect based on role
    switch (user.role) {
      case "ADMIN":
        return NextResponse.redirect(new URL("/admin", request.url));
      case "RESEARCHER":
        return NextResponse.redirect(new URL("/researcher", request.url));
      case "PARTICIPANT":
      default:
        return NextResponse.redirect(new URL("/participant", request.url));
    }
  } catch (error) {
    console.error("Google Callback Error:", error);
    return NextResponse.redirect(new URL("/login?error=Internal_Error", request.url));
  }
}
