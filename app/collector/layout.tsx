import type { Metadata } from "next";
import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getLinksForUser } from "../components/layout/navLinks";
import { CollectorLayoutShell } from "./CollectorLayoutShell";

export const metadata: Metadata = {
  title: "Field Collection | Tinat",
  description: "Collect and submit assigned health research responses.",
};

export default async function CollectorLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true, avatarUrl: true },
  });

  if (!user || (user.role !== "PARTICIPANT" && user.role !== "DATA_COLLECTOR" && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const verification = await prisma.verification.findUnique({
    where: {
      userId_verificationType: {
        userId: user.id,
        verificationType: "DATA_COLLECTOR"
      }
    }
  });

  const isVerifiedCollector = verification?.status === "VERIFIED";

  // Free data collectors do not need to verify. Allow access if user has assignments or pending invitations
  const [assignedCount, pendingInvites] = await Promise.all([
    prisma.studyDataCollector.count({ where: { userId: user.id } }),
    prisma.collectorInvitation.count({ where: { inviteeId: user.id, status: "PENDING" } })
  ]);

  if (!isVerifiedCollector && assignedCount === 0 && pendingInvites === 0) {
    redirect("/dashboard");
  }

  const links = getLinksForUser({ ...user, isCollector: true });

  return (
    <CollectorLayoutShell
      links={links}
      user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
    >
      {children}
    </CollectorLayoutShell>
  );
}
