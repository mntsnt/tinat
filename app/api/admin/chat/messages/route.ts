import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CHANNELS = ["general", "events", "ideas", "help", "support"] as const;

function isChatChannel(value: string): value is (typeof CHANNELS)[number] {
  return CHANNELS.some((channel) => channel === value);
}

async function requireAdmin() {
  const session = await getSession();
  if (!session?.userId) return null;

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  return admin?.role === "ADMIN" ? session : null;
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    }

    const channel = new URL(request.url).searchParams.get("channel") || "general";
    if (!isChatChannel(channel)) {
      return NextResponse.json({ error: "Choose a valid admin chat channel." }, { status: 400 });
    }

    const messages = await prisma.adminChatMessage.findMany({
      where: { channel },
      take: 100,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        channel: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, name: true, avatarUrl: true, institution: true } },
      },
    });

    return NextResponse.json({ messages: messages.reverse(), currentAdminId: session.userId });
  } catch (error) {
    console.error("Failed to load admin chat messages:", error);
    return NextResponse.json({ error: "Could not load admin chat messages." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as
      | { channel?: unknown; content?: unknown }
      | null;
    if (!body || typeof body.content !== "string" || typeof body.channel !== "string") {
      return NextResponse.json({ error: "A channel and message are required." }, { status: 400 });
    }

    const content = body.content.trim();
    if (!isChatChannel(body.channel)) {
      return NextResponse.json({ error: "Choose a valid admin chat channel." }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: "Write a message before sending." }, { status: 400 });
    }
    if (content.length > 1500) {
      return NextResponse.json({ error: "Messages must be 1,500 characters or fewer." }, { status: 400 });
    }

    const message = await prisma.adminChatMessage.create({
      data: {
        channel: body.channel,
        senderId: session.userId,
        content,
      },
      select: {
        id: true,
        channel: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, name: true, avatarUrl: true, institution: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Failed to send admin chat message:", error);
    return NextResponse.json({ error: "Could not send this message." }, { status: 500 });
  }
}
