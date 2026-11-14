import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "node:crypto";
import { getGoogleRedirectUri } from "@/lib/getRedirectUri";
import { getSafeInternalRedirectPath } from "@/lib/safeRedirect";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const authSecret = process.env.AUTH_SECRET;
  const url = new URL(request.url);
  const baseUrl = url.origin;
  const requestedDestination = getSafeInternalRedirectPath(
    url.searchParams.get("redirect")
  );

  if (!clientId || !authSecret) {
    console.error("Google sign-in requires GOOGLE_CLIENT_ID and AUTH_SECRET.");
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("error", "configuration_error");
    if (requestedDestination) {
      loginUrl.searchParams.set("redirect", requestedDestination);
    }
    return NextResponse.redirect(loginUrl);
  }

  const redirectUri = getGoogleRedirectUri(request);
  const requestedRole = url.searchParams.get("role");
  const role = requestedRole === "RESEARCHER" ? "RESEARCHER" : "PARTICIPANT";
  const nonce = randomBytes(32).toString("base64url");
  const signature = createHmac("sha256", authSecret)
    .update(`${nonce}.${role}`)
    .digest("base64url");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", `${nonce}.${role}.${signature}`);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("tinat_google_oauth_nonce", nonce, {
    httpOnly: true,
    secure: redirectUri.startsWith("https://"),
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/api/auth/callback/google",
  });
  if (requestedDestination) {
    response.cookies.set("tinat_google_oauth_redirect", requestedDestination, {
      httpOnly: true,
      secure: redirectUri.startsWith("https://"),
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/api/auth/callback/google",
    });
  }

  return response;
}
