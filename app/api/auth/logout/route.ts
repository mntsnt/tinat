import { NextResponse } from "next/server";
import { destroySession, getSession } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/activityLog";

export async function POST() {
  const session = await getSession();
  await destroySession();
  if (session) {
    await logActivity({
      userId: session.userId,
      action: "USER_LOGOUT",
      description: "User logged out",
    });
  }

  return NextResponse.json({
    message: "Logged out successfully.",
  });
}