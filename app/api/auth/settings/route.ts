import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

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
    const { name, phone, bio, institution, fieldOfStudy } = profile;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
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

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name.trim(),
        phone: typeof phone === "string" ? phone.trim() || null : null,
        bio: typeof bio === "string" ? bio.trim() || null : null,
        institution: typeof institution === "string" ? institution.trim() || null : null,
        fieldOfStudy: typeof fieldOfStudy === "string" ? fieldOfStudy.trim() || null : null,
      },
      select: {
        id: true,
        name: true,
        role: true,
      }
    });

    return NextResponse.json({ message: "Settings updated successfully.", user }, { status: 200 });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Something went wrong while updating settings." }, { status: 500 });
  }
}
