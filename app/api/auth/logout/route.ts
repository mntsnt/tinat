import { NextResponse } from "next/server";
import { destroySession, getSession } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activityLog";

export async function POST() {
  const session = await getSession();
  await destroySession();
  if (session) {
    try {
      await logActivity({
        userId: session.userId,
        action: "USER_LOGOUT",
        description: "User logged out",
      });
    } catch {}
  }

  const response = NextResponse.json({
    message: "Logged out successfully.",
  });

  // Explicitly invalidate session cookie on the response
  response.cookies.set("tinat_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    expires: new Date(0),
  });

  return response;
}