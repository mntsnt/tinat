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
    select: { id: true, role: true, name: true, email: true },
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

  if (!verification || verification.status !== "VERIFIED") {
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
        userName={user.name}
        userEmail={user.email}
        roleColor="participant"
      />
      <main className="flex-1 overflow-y-auto bg-muted/10">
        {children}
      </main>
    </div>
  );
}

