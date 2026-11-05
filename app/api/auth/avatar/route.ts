import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BASE64_LENGTH = 1_000_000; // ~750KB image payload
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    let finalAvatarUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("avatar") as File | null;

      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No image file provided." }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Unsupported image format. Please upload JPEG, PNG, WebP, or GIF." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Image file is too large. Maximum size is 2MB." },
          { status: 400 }
        );
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      finalAvatarUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
    } else {
      const body: unknown = await request.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
      }

      const { avatarUrl } = body as { avatarUrl?: unknown };
      if (typeof avatarUrl !== "string" || !avatarUrl.trim()) {
        return NextResponse.json({ error: "avatarUrl is required." }, { status: 400 });
      }

      const trimmedUrl = avatarUrl.trim();

      const isDataUrl = ALLOWED_MIME_TYPES.some((mime) =>
        trimmedUrl.startsWith(`data:${mime};base64,`)
      );
      const isHttpsUrl = trimmedUrl.startsWith("https://") && trimmedUrl.length <= 2048;

      if (!isDataUrl && !isHttpsUrl) {
        return NextResponse.json(
          { error: "Image must be a valid Data URL (JPEG, PNG, WebP) or secure HTTPS link." },
          { status: 400 }
        );
      }

      if (trimmedUrl.length > MAX_BASE64_LENGTH) {
        return NextResponse.json(
          { error: "Image payload exceeds maximum allowed size (750KB compressed)." },
          { status: 400 }
        );
      }

      finalAvatarUrl = trimmedUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: finalAvatarUrl },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile picture updated successfully.",
      user: updatedUser,
      avatarUrl: updatedUser.avatarUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to update profile picture. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile picture removed successfully.",
      user: updatedUser,
      avatarUrl: null,
    });
  } catch (error) {
    console.error("Avatar removal error:", error);
    return NextResponse.json(
      { error: "Failed to remove profile picture. Please try again." },
      { status: 500 }
    );
  }
}
