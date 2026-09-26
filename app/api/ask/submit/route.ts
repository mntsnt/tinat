import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In-memory lightweight rate limiting (never persisted to DB to preserve strict anonymity)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.expiresAt) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Clean up expired rate-limit memory periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.expiresAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  try {
    // Quick IP hash for transient in-memory rate-limiting only (never stored in DB)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous_client";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many questions sent recently. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, questionText } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Recipient username is required." },
        { status: 400 }
      );
    }

    if (!questionText || typeof questionText !== "string") {
      return NextResponse.json(
        { error: "Question text is required." },
        { status: 400 }
      );
    }

    const trimmedQuestion = questionText.trim();
    if (trimmedQuestion.length < 3) {
      return NextResponse.json(
        { error: "Question must be at least 3 characters long." },
        { status: 400 }
      );
    }

    if (trimmedQuestion.length > 500) {
      return NextResponse.json(
        { error: "Question cannot exceed 500 characters." },
        { status: 400 }
      );
    }

    // Verify recipient profile
    const profile = await prisma.askProfile.findUnique({
      where: { username: username.toLowerCase().trim() },
      select: { id: true, isEnabled: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Recipient Ask page was not found." },
        { status: 404 }
      );
    }

    if (!profile.isEnabled) {
      return NextResponse.json(
        { error: "This Ask page is currently paused and not accepting questions." },
        { status: 403 }
      );
    }

    // Create question - STRICTLY NO SENDER IDENTIFIERS STORED
    await prisma.askQuestion.create({
      data: {
        profileId: profile.id,
        questionText: trimmedQuestion,
        status: "UNANSWERED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your question has been sent anonymously!",
    });
  } catch (error) {
    console.error("Error submitting anonymous question:", error);
    return NextResponse.json(
      { error: "Failed to send question. Please try again." },
      { status: 500 }
    );
  }
}
