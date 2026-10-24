import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { Sidebar } from "../components/layout/Sidebar";
import { LayoutDashboard } from "lucide-react";

export default async function CollectorLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true, avatarUrl: true },
  });

  if (!user || user.role !== "PARTICIPANT") {
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

  const links = [
    { title: "Dashboard", href: "/collector/dashboard", icon: <LayoutDashboard /> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar
        links={links}
        roleTitle="Data Collector"
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        roleColor="participant"
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] bg-muted/10">
        {children}
      </main>
    </div>
  );
}
