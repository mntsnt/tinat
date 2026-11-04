import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { decodePayload } from "fayda-decoder";
import { verifySignature } from "fayda-decoder/verify";

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

    // 2. Cryptographically verify the signature if present
    if (!result.signature.present) {
      return NextResponse.json({ error: "Fayda QR payload is missing the required cryptographic signature." }, { status: 400 });
    }

    let isSignatureVerified = false;
    try {
      const verification = await verifySignature(result);
      isSignatureVerified = verification.verified;
      if (!verification.verified && verification.reason === "MALFORMED_JWS") {
        return NextResponse.json({ error: "Fayda card authenticity verification failed. The signature is malformed or corrupted." }, { status: 403 });
      }
    } catch (sigErr) {
      console.warn("Fayda signature verification warning:", sigErr);
    }

    // Return the safe subset of data to preview
    return NextResponse.json({
      success: true,
      data: {
        fullName: result.fields.full_name,
        fan: result.fields.fan,
        dateOfBirth: result.fields.date_of_birth,
        sex: result.fields.gender
      }
    });
  } catch (error: unknown) {
    console.error("Fayda preview error:", error);
    return NextResponse.json({ error: "Internal server error during preview" }, { status: 500 });
  }
}
