import type { Metadata } from "next";
import { DashboardTopNav } from "../components/layout/DashboardTopNav";
import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import { prisma } from "../../lib/prisma";
import { getLinksForUser } from "../components/layout/navLinks";
import { checkPlatformConsent } from "@/lib/legal/consentService";
import { checkIsUserCollector } from "@/lib/collector/status";

import { ParticipantLayoutShell } from "./ParticipantLayoutShell";

export const metadata: Metadata = {
  title: "Participant Dashboard | Tinat",
  description: "Discover health research studies and manage your participant account.",
};

export default async function ParticipantLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const consent = await checkPlatformConsent(session.userId);
  if (!consent.hasValidConsent) {
    redirect("/agreement?redirect=/participant");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true, avatarUrl: true, isVerified: true },
  });

  if (!user || user.role !== "PARTICIPANT") {
    redirect("/dashboard");
  }

  if (!user.isVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  const isCollector = await checkIsUserCollector(user.id);
  const links = getLinksForUser({ ...user, isCollector });

  return (
    <ParticipantLayoutShell
      links={links}
      user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
    >
      {children}
    </ParticipantLayoutShell>
  );
}
