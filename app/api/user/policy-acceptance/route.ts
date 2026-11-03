import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { CURRENT_POLICY_VERSIONS } from "@/lib/governance/policies";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      role: true,
      termsAcceptedVersion: true,
      termsAcceptedAt: true,
      charterAcceptedVersion: true,
      charterAcceptedAt: true,
      codeOfConductAcceptedVersion: true,
      codeOfConductAcceptedAt: true,
      dpaAcceptedVersion: true,
      dpaAcceptedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: "success",
    acceptances: user,
    currentVersions: CURRENT_POLICY_VERSIONS,
  });
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { policy, version } = body;

    const dataToUpdate: Record<string, any> = {};
    const now = new Date();

    switch (policy) {
      case "terms":
        dataToUpdate.termsAcceptedVersion = version || CURRENT_POLICY_VERSIONS.TERMS;
        dataToUpdate.termsAcceptedAt = now;
        break;
      case "charter":
        dataToUpdate.charterAcceptedVersion = version || CURRENT_POLICY_VERSIONS.CHARTER;
        dataToUpdate.charterAcceptedAt = now;
        break;
      case "code-of-conduct":
        dataToUpdate.codeOfConductAcceptedVersion = version || CURRENT_POLICY_VERSIONS.CODE_OF_CONDUCT;
        dataToUpdate.codeOfConductAcceptedAt = now;
        break;
      case "dpa":
        dataToUpdate.dpaAcceptedVersion = version || CURRENT_POLICY_VERSIONS.DPA;
        dataToUpdate.dpaAcceptedAt = now;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid policy type. Must be terms, charter, code-of-conduct, or dpa" },
          { status: 400 }
        );
    }

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: dataToUpdate,
      select: {
        id: true,
        termsAcceptedAt: true,
        charterAcceptedAt: true,
        codeOfConductAcceptedAt: true,
        dpaAcceptedAt: true,
      },
    });

    return NextResponse.json({
      status: "success",
      message: `Accepted ${policy}`,
      user: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to record policy acceptance" },
      { status: 500 }
    );
  }
}
