import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import { prisma } from "../../lib/prisma";
import { LayoutDashboard, FilePlus, FolderOpen, Settings } from "lucide-react";

export default async function ResearcherLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, name: true, email: true },
  });

  if (!user || user.role !== "RESEARCHER") {
    redirect("/dashboard");
  }

  const links = [
    { title: "Dashboard", href: "/researcher", icon: <LayoutDashboard /> },
    { title: "My Studies", href: "/researcher/studies", icon: <FolderOpen /> },
    { title: "Create Study", href: "/researcher/studies/new", icon: <FilePlus /> },
    { title: "Settings", href: "/researcher/settings", icon: <Settings /> },
  ];

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-screen">
      <Sidebar
        links={links}
        roleTitle="Researcher"
        userName={user.name}
        userEmail={user.email}
        roleColor="indigo"
      />
      <div className="flex-1 overflow-y-auto bg-muted/10">
        {children}
      </div>
    </div>
  );
}
