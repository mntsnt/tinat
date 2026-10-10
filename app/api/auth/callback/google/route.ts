import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { getBaseUrl, getGoogleRedirectUri } from "@/lib/getRedirectUri";
import { prisma } from "@/lib/prisma";

const OAUTH_NONCE_COOKIE = "tinat_google_oauth_nonce";
const OAUTH_COOKIE_PATH = "/api/auth/callback/google";

function redirectToLogin(request: NextRequest, error: string) {
  const baseUrl = getBaseUrl(request);
  const response = NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(error)}`, baseUrl)
  );

  response.cookies.set(OAUTH_NONCE_COOKIE, "", {
    httpOnly: true,
    secure: baseUrl.startsWith("https://"),
    sameSite: "lax",
    maxAge: 0,
    path: OAUTH_COOKIE_PATH,
  });

  return response;
}

function redirectToDestination(request: NextRequest, destination: string) {
  const baseUrl = getBaseUrl(request);
  const response = NextResponse.redirect(new URL(destination, baseUrl));

  response.cookies.set(OAUTH_NONCE_COOKIE, "", {
    httpOnly: true,
    secure: baseUrl.startsWith("https://"),
    sameSite: "lax",
    maxAge: 0,
    path: OAUTH_COOKIE_PATH,
  });

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const returnedState = url.searchParams.get("state") || "";
    const [nonce, requestedRole, signature] = returnedState.split(".");
    const stateCookie = request.cookies.get(OAUTH_NONCE_COOKIE)?.value;
    const authSecret = process.env.AUTH_SECRET;
    const validRole =
      requestedRole === "RESEARCHER" || requestedRole === "PARTICIPANT";
    const expectedSignature =
      authSecret && nonce && validRole
        ? createHmac("sha256", authSecret)
            .update(`${nonce}.${requestedRole}`)
            .digest("base64url")
        : "";

    if (
      !stateCookie ||
      !nonce ||
      !signature ||
      nonce !== stateCookie ||
      !validRole ||
      !expectedSignature ||
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return redirectToLogin(request, "invalid_state");
    }

    if (url.searchParams.has("error")) {
      return redirectToLogin(request, "authorization_denied");
    }

    const code = url.searchParams.get("code");
    if (!code) {
      return redirectToLogin(request, "google_sign_in_failed");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error("Google sign-in requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
      return redirectToLogin(request, "configuration_error");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: getGoogleRedirectUri(request),
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Google token exchange failed with status:", tokenResponse.status);
      return redirectToLogin(request, "token_exchange_failed");
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
    };
    if (!tokenData.access_token) {
      return redirectToLogin(request, "token_exchange_failed");
    }

    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!userResponse.ok) {
      console.error("Google profile request failed with status:", userResponse.status);
      return redirectToLogin(request, "profile_fetch_failed");
    }

    const userData = (await userResponse.json()) as {
      email?: string;
      email_verified?: boolean;
      verified_email?: boolean;
      name?: string;
      picture?: string;
    };
    const email = userData.email?.toLowerCase().trim();
    const emailIsVerified =
      userData.email_verified === true || userData.verified_email === true;

    if (!email || !emailIsVerified) {
      return redirectToLogin(request, "unverified_email");
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword = randomBytes(32).toString("base64url");
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          name: userData.name?.trim() || email.split("@")[0],
          passwordHash,
          avatarUrl: userData.picture,
          isVerified: true,
          role: requestedRole,
          wallet: {
            create: { balance: 0 },
          },
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "ACCOUNT_CREATED",
          description: "Registered using Google Sign-In",
        },
      });
    } else {
      if (!user.isVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
      }

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          description: "Logged in via Google",
        },
      });
    }

    await createSession(user.id);

    switch (user.role) {
      case "ADMIN":
        return redirectToDestination(request, "/admin");
      case "RESEARCHER":
        return redirectToDestination(request, "/researcher");
      case "PARTICIPANT":
      default:
        return redirectToDestination(request, "/participant");
    }
  } catch (error) {
    console.error("Google Callback Error:", error);
    return redirectToLogin(request, "internal_error");
  }
}
