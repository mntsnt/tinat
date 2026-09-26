import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { verificationType, verificationReference } = await req.json();

    if (!["RESEARCHER", "DATA_COLLECTOR"].includes(verificationType)) {
      return NextResponse.json({ error: "Invalid verification type" }, { status: 400 });
    }

    if (!verificationReference || verificationReference.trim() === "") {
       return NextResponse.json({ error: "Verification reference (FAN) is required" }, { status: 400 });
    }

    // Do not allow if one already exists and is not rejected
    const existing = await prisma.verification.findUnique({
      where: {
        userId_verificationType: {
          userId: user.id,
          verificationType,
        }
      }
    });

    if (existing && existing.status !== "REJECTED") {
      return NextResponse.json({ error: "Verification request is already " + existing.status.toLowerCase() }, { status: 400 });
    }

    // Encrypt or hash the reference (in a real scenario, this would use a robust encryption service)
    // For now, we'll store a masked version so the raw FAN is never exposed in plaintext
    const maskedRef = `****-****-${verificationReference.slice(-4)}`;

    const verification = await prisma.verification.upsert({
      where: {
        userId_verificationType: {
          userId: user.id,
          verificationType,
        }
      },
      update: {
        status: "PENDING",
        verificationReference: maskedRef,
        submittedAt: new Date(),
        rejectionReason: null
      },
      create: {
        userId: user.id,
        verificationType,
        status: "PENDING",
        verificationReference: maskedRef,
      }
    });

    return NextResponse.json({ success: true, verification });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const verifications = await prisma.verification.findMany({
      where: { userId: user.id }
    });

    return NextResponse.json({ verifications });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
