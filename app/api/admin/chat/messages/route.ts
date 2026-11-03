import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";
import { jsonError, validateBody } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const CHANNELS = ["general", "events", "ideas", "help", "support"] as const;

function isChatChannel(value: string): value is (typeof CHANNELS)[number] {
  return CHANNELS.some((channel) => channel === value);
}

const chatMessageSchema = z.object({
  channel: z.enum(CHANNELS),
  content: z.string().trim().min(1, "Write a message before sending.").max(1500, "Messages must be 1,500 characters or fewer."),
});

export async function GET(request: Request) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;

    const channel = new URL(request.url).searchParams.get("channel") || "general";
    if (!isChatChannel(channel)) {
      return jsonError("Choose a valid admin chat channel.", 400);
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

    return NextResponse.json({ messages: messages.reverse(), currentAdminId: auth.user.id });
  } catch (error) {
    console.error("Failed to load admin chat messages:", error);
    return jsonError("Could not load admin chat messages.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(["ADMIN"], request);
    if (!auth.ok) return auth.response;

    const rateCheck = checkRateLimit(request, "CHAT", auth.user.id);
    if (!rateCheck.allowed) return rateCheck.response;

    const validation = await validateBody(chatMessageSchema, request);
    if (!validation.ok) return validation.response;
    const { channel, content } = validation.data;

    const message = await prisma.adminChatMessage.create({
      data: {
        channel,
        senderId: auth.user.id,
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
    return jsonError("Could not send this message.", 500);
  }
}
