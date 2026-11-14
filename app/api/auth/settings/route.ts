import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { validateUsername } from "@/lib/username";

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Enter valid profile details." }, { status: 400 });
    }
    const profile = body as Record<string, unknown>;
    const { name, phone, bio, institution, fieldOfStudy, avatarUrl } = profile;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    let cleanUsername: string | null | undefined = undefined;
    if (profile.username !== undefined) {
      if (typeof profile.username !== "string") {
        return NextResponse.json({ error: "Username must be text." }, { status: 400 });
      }
      const rawUser = profile.username.trim();
      if (rawUser === "") {
        cleanUsername = null;
      } else {
        const val = validateUsername(rawUser);
        if (!val.ok) {
          return NextResponse.json({ error: val.error }, { status: 400 });
        }
        cleanUsername = val.username;

        const existingUser = await prisma.user.findFirst({
          where: {
            username: cleanUsername,
            id: { not: session.userId },
          },
        });
        if (existingUser) {
          return NextResponse.json({ error: "This username is already taken. Please choose another one." }, { status: 409 });
        }

        const existingAsk = await prisma.askProfile.findFirst({
          where: {
            username: cleanUsername,
            userId: { not: session.userId },
          },
        });
        if (existingAsk) {
          return NextResponse.json({ error: "This username is already taken on Tinat Ask. Please choose another one." }, { status: 409 });
        }
      }
    }

    const optionalFields = { phone, bio, institution, fieldOfStudy };
    if (Object.values(optionalFields).some((value) => value !== undefined && typeof value !== "string")) {
      return NextResponse.json({ error: "Profile details must be text." }, { status: 400 });
    }
    if (
      name.trim().length > 100 ||
      (typeof phone === "string" && phone.trim().length > 30) ||
      (typeof bio === "string" && bio.trim().length > 500) ||
      (typeof institution === "string" && institution.trim().length > 150) ||
      (typeof fieldOfStudy === "string" && fieldOfStudy.trim().length > 150)
    ) {
      return NextResponse.json({ error: "One or more profile fields exceed the allowed length." }, { status: 400 });
    }

    let sanitizedAvatarUrl: string | null | undefined = undefined;
    if (avatarUrl === null || avatarUrl === "") {
      sanitizedAvatarUrl = null;
    } else if (typeof avatarUrl === "string") {
      const trimmed = avatarUrl.trim();
      const isValidFormat =
        trimmed.startsWith("data:image/") ||
        (trimmed.startsWith("https://") && trimmed.length <= 2048);
      if (isValidFormat && trimmed.length <= 1_000_000) {
        sanitizedAvatarUrl = trimmed;
      }
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name.trim(),
        ...(cleanUsername !== undefined ? { username: cleanUsername } : {}),
        phone: typeof phone === "string" ? phone.trim() || null : null,
        bio: typeof bio === "string" ? bio.trim() || null : null,
        institution: typeof institution === "string" ? institution.trim() || null : null,
        fieldOfStudy: typeof fieldOfStudy === "string" ? fieldOfStudy.trim() || null : null,
        ...(sanitizedAvatarUrl !== undefined ? { avatarUrl: sanitizedAvatarUrl } : {}),
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        avatarUrl: true,
      }
    });

    if (cleanUsername) {
      await prisma.askProfile.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          username: cleanUsername,
          displayName: name.trim(),
          bio: typeof bio === "string" ? bio.trim().slice(0, 200) : null,
        },
        update: {
          username: cleanUsername,
        },
      });
    }

    return NextResponse.json({ message: "Settings updated successfully.", user }, { status: 200 });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Something went wrong while updating settings." }, { status: 500 });
  }
}
