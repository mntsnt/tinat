import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RESERVED_USERNAMES = new Set([
  "api",
  "admin",
  "dashboard",
  "login",
  "register",
  "logout",
  "participant",
  "researcher",
  "ask",
  "settings",
  "studies",
  "wallet",
  "profile",
  "support",
  "help",
  "terms",
  "privacy",
]);

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        askProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      profile: user.askProfile,
    });
  } catch (error) {
    console.error("Error fetching ask profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let { username, displayName, bio, theme, isEnabled, allowPublicAnswers } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    username = username.trim().toLowerCase();

    // Username format validation: 3-30 chars, alphanumeric, underscores, hyphens
    if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-30 characters long and contain only letters, numbers, hyphens, or underscores.",
        },
        { status: 400 }
      );
    }

    if (RESERVED_USERNAMES.has(username)) {
      return NextResponse.json(
        { error: "This username is reserved. Please pick another one." },
        { status: 400 }
      );
    }

    // Check if username is taken by another user
    const existing = await prisma.askProfile.findUnique({
      where: { username },
    });

    if (existing && existing.userId !== session.userId) {
      return NextResponse.json(
        { error: "This username is already taken. Please pick another one." },
        { status: 409 }
      );
    }

    const trimmedDisplayName = (displayName || "").trim().slice(0, 50);
    const trimmedBio = (bio || "").trim().slice(0, 200);
    const validTheme = typeof theme === "string" ? theme.trim() : "minimal";

    const profile = await prisma.askProfile.upsert({
      where: { userId: session.userId },
      update: {
        username,
        displayName: trimmedDisplayName || username,
        bio: trimmedBio,
        theme: validTheme,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        allowPublicAnswers:
          allowPublicAnswers !== undefined ? Boolean(allowPublicAnswers) : true,
      },
      create: {
        userId: session.userId,
        username,
        displayName: trimmedDisplayName || username,
        bio: trimmedBio,
        theme: validTheme,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        allowPublicAnswers:
          allowPublicAnswers !== undefined ? Boolean(allowPublicAnswers) : true,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error creating/updating ask profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
