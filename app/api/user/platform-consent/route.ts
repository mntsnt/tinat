import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import {
  checkPlatformConsent,
  recordPlatformConsent,
  hashIp,
} from "@/lib/legal/consentService";
import { getPlatformDocumentPayload } from "@/lib/legal/platformDocuments";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const consentStatus = await checkPlatformConsent(auth.user.id);
    const payload = getPlatformDocumentPayload();

    return NextResponse.json({
      status: "success",
      consentStatus,
      documentDetails: {
        termsVersion: payload.termsVersion,
        privacyVersion: payload.privacyVersion,
        summaryVersion: payload.summaryVersion,
        documentHash: payload.documentHash,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to check platform consent" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { termsAccepted, optionalContactConsent, documentHash, locale } = body;

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "You must accept the Terms of Use and Privacy Notice to continue." },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const ipH = hashIp(ip);

    const record = await recordPlatformConsent({
      userId: auth.user.id,
      optionalContactConsent: Boolean(optionalContactConsent),
      clientProvidedHash: documentHash,
      ipHash: ipH,
      locale: locale || "en",
    });

    return NextResponse.json({
      status: "success",
      message: "Platform legal agreement accepted.",
      record,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to record platform agreement" },
      { status: 400 }
    );
  }
}
