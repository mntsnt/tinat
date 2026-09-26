import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        provider: true,
        model: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error("Error fetching AI conversations:", err);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, studyId, projectId, provider, model } = body;

    const newConversation = await prisma.aIConversation.create({
      data: {
        userId: session.userId,
        title: title || "New Research Chat",
        studyId: studyId || null,
        projectId: projectId || null,
        provider: provider || "GEMINI",
        model: model || "gemini-3.6-flash",
      }
    });

    return NextResponse.json({ conversation: newConversation });
  } catch (err: any) {
    console.error("Error creating AI conversation:", err);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
