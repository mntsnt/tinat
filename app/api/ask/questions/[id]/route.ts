import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { answerText, isPublic, status, deckConfig } = body;

    // Verify profile ownership
    const profile = await prisma.askProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const question = await prisma.askQuestion.findUnique({
      where: { id },
    });

    if (!question || question.profileId !== profile.id) {
      return NextResponse.json(
        { error: "Question not found or unauthorized" },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};

    if (typeof answerText === "string") {
      dataToUpdate.answerText = answerText.trim();
      dataToUpdate.status = "ANSWERED";
      dataToUpdate.answeredAt = new Date();
    }

    if (typeof isPublic === "boolean") {
      dataToUpdate.isPublic = isPublic;
    }

    if (
      status &&
      ["UNANSWERED", "ANSWERED", "ARCHIVED", "DELETED"].includes(status)
    ) {
      dataToUpdate.status = status;
    }

    if (deckConfig !== undefined) {
      dataToUpdate.deckConfig = deckConfig;
    }

    const updated = await prisma.askQuestion.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await prisma.askProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const question = await prisma.askQuestion.findUnique({
      where: { id },
    });

    if (!question || question.profileId !== profile.id) {
      return NextResponse.json(
        { error: "Question not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.askQuestion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Question deleted" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
