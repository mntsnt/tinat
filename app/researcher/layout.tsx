import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getLinksForUser } from "../components/layout/navLinks";
import { checkPlatformConsent } from "@/lib/legal/consentService";
import { ResearcherLayoutShell } from "./ResearcherLayoutShell";

export default async function ResearcherLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const consent = await checkPlatformConsent(session.userId);
  if (!consent.hasValidConsent) {
    redirect("/agreement?redirect=/researcher");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true, avatarUrl: true, isVerified: true },
  });

  if (!user || user.role !== "RESEARCHER") {
    redirect("/dashboard");
  }

  if (!user.isVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  const links = getLinksForUser(user);

  return (
    <ResearcherLayoutShell
      links={links}
      userId={user.id}
      userName={user.name}
      userEmail={user.email}
      avatarUrl={user.avatarUrl}
    >
      {children}
    </ResearcherLayoutShell>
  );
}
