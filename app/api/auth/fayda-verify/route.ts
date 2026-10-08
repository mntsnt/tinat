import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { decodePayload } from "fayda-decoder";
import { verifySignature } from "fayda-decoder/verify";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await req.json();
    if (!payload || typeof payload !== "string") {
      return NextResponse.json({ error: "Missing or invalid payload" }, { status: 400 });
    }

    // 1. Decode payload on the server
    const result = decodePayload(payload);
    if (!result.ok) {
      return NextResponse.json({ error: "Invalid Fayda QR code" }, { status: 400 });
    }

    // 2. Cryptographically verify the signature
    const verification = await verifySignature(result);
    if (!verification.verified) {
      return NextResponse.json({ error: "Fayda card authenticity verification failed. The signature is invalid." }, { status: 403 });
    }

    // 3. Extract the FAN securely and hash it to prevent duplicates
    const fan = result.fields.fan;
    if (!fan) {
      return NextResponse.json({ error: "Fayda card does not contain a FAN." }, { status: 400 });
    }
    const fanHash = crypto.createHash("sha256").update(fan).digest("hex");

    // 4. Check for duplicate verification
    const existing = await prisma.user.findUnique({
      where: { faydaFanHash: fanHash },
      select: { id: true }
    });

    if (existing && existing.id !== session.userId) {
      return NextResponse.json({ error: "This Fayda ID has already been used to verify another account." }, { status: 409 });
    }

    // 5. Save verification state to user profile
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        faydaVerified: true,
        faydaFanHash: fanHash,
        faydaVerifiedAt: new Date(),
        // We do NOT store the raw payload, the face image, or the plain FAN.
      }
    });

    return NextResponse.json({ success: true, verifiedAt: new Date().toISOString() });
  } catch (error: unknown) {
    console.error("Fayda verification error:", error);
    return NextResponse.json({ error: "Internal server error during verification" }, { status: 500 });
  }
}
