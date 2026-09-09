import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import { prisma } from "../../lib/prisma";
import { LayoutDashboard, Compass, History, Wallet, Settings } from "lucide-react";

export default async function ParticipantLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, name: true, email: true },
  });

  if (!user || user.role !== "PARTICIPANT") {
    redirect("/dashboard");
  }

  const links = [
    { title: "Dashboard", href: "/participant", icon: <LayoutDashboard /> },
    { title: "Discover Studies", href: "/participant/studies", icon: <Compass /> },
    { title: "History", href: "/participant/history", icon: <History /> },
    { title: "Wallet", href: "/participant/wallet", icon: <Wallet /> },
    { title: "Settings", href: "/participant/settings", icon: <Settings /> },
  ];

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-screen">
      <Sidebar
        links={links}
        roleTitle="Participant"
        userName={user.name}
        userEmail={user.email}
        roleColor="emerald"
      />
      <div className="flex-1 overflow-y-auto bg-muted/10">
        {children}
      </div>
    </div>
  );
}
