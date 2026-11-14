import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUsername } from "@/lib/username";

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
        username: true,
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
        username: user.username,
        email: user.email,
        role: user.role,
      },
      profile: user.askProfile,
      defaultUsername: user.username || user.askProfile?.username || null,
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
    const { displayName, bio, theme, isEnabled, allowPublicAnswers } = body;
    let { username } = body;

    const val = validateUsername(username);
    if (!val.ok) {
      return NextResponse.json({ error: val.error }, { status: 400 });
    }
    username = val.username;

    // Check if username is taken by another user in AskProfile or User
    const [existingAsk, existingUser] = await Promise.all([
      prisma.askProfile.findUnique({
        where: { username },
      }),
      prisma.user.findFirst({
        where: {
          username,
          id: { not: session.userId },
        },
      }),
    ]);

    if ((existingAsk && existingAsk.userId !== session.userId) || existingUser) {
      return NextResponse.json(
        { error: "This username is already taken. Please pick another one." },
        { status: 409 }
      );
    }

    const trimmedDisplayName = (displayName || "").trim().slice(0, 50);
    const trimmedBio = (bio || "").trim().slice(0, 200);
    const validTheme = typeof theme === "string" ? theme.trim() : "minimal";

    const [profile] = await Promise.all([
      prisma.askProfile.upsert({
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
      }),
      prisma.user.update({
        where: { id: session.userId },
        data: { username },
      }),
    ]);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error creating/updating ask profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.askProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Ask profile not found." }, { status: 404 });
    }

    await prisma.askQuestion.deleteMany({
      where: { profileId: profile.id },
    });

    await prisma.askProfile.delete({
      where: { id: profile.id },
    });

    return NextResponse.json({
      success: true,
      message: "Ask profile deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting ask profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
