import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIModel } from "@/lib/ai/models";

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

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid chat settings." }, { status: 400 });
    }

    const modelId = "model" in body && typeof body.model === "string" ? body.model : undefined;
    const modelInfo = getAIModel(modelId);
    if (!modelInfo) {
      return NextResponse.json({ error: "The selected AI model is not available." }, { status: 400 });
    }

    const newConversation = await prisma.aIConversation.create({
      data: {
        userId: session.userId,
        title: "title" in body && typeof body.title === "string" ? body.title : "New Research Chat",
        studyId: "studyId" in body && typeof body.studyId === "string" ? body.studyId : null,
        projectId: "projectId" in body && typeof body.projectId === "string" ? body.projectId : null,
        provider: modelInfo.providerId,
        model: modelInfo.id,
      }
    });

    return NextResponse.json({ conversation: newConversation });
  } catch (err: any) {
    console.error("Error creating AI conversation:", err);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
