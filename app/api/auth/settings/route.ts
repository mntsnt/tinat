import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, bio, institution, fieldOfStudy } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        bio: bio?.trim() || null,
        institution: institution?.trim() || null,
        fieldOfStudy: fieldOfStudy?.trim() || null,
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
