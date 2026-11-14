import { DashboardTopNav } from "../components/layout/DashboardTopNav";
import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import { prisma } from "../../lib/prisma";
import { getLinksForUser } from "../components/layout/navLinks";
import { checkPlatformConsent } from "@/lib/legal/consentService";
import { checkIsUserCollector } from "@/lib/collector/status";

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
    <div className="fixed inset-0 flex flex-col md:flex-row overflow-hidden bg-background">
      <Sidebar
        links={links}
        roleTitle="Participant"
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        roleColor="participant"
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] bg-muted/10 flex flex-col">
        <DashboardTopNav />
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}
