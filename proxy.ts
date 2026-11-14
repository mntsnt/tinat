import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieToken = request.cookies.get("tinat_session")?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : null;

  const sessionToken = cookieToken || bearerToken;

  const isApi = pathname.startsWith("/api/");
  const returnTo = `${pathname}${request.nextUrl.search}`;

  if (!sessionToken) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", returnTo);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(sessionToken, getSecretKey());
    if (!payload || !payload.userId) {
      throw new Error("Invalid payload");
    }

    return NextResponse.next();
  } catch {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "SessionExpired");
    loginUrl.searchParams.set("redirect", returnTo);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/researcher/:path*",
    "/participant/:path*",
    "/collector/:path*",
    "/forms/:path*",
    "/projects/:path*",
    "/ai/:path*",
    "/dashboard/:path*",
    "/profile",
    "/api/auth/admin/:path*",
    "/api/admin/:path*",
  ],
};
