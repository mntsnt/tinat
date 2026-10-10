import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { Sidebar } from "../components/layout/Sidebar";
import { getLinksForUser } from "../components/layout/navLinks";

export default async function ProjectsLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true, avatarUrl: true },
  });

  if (!user || user.role !== "RESEARCHER") {
    redirect("/dashboard");
  }

  const links = getLinksForUser(user);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar
        links={links}
        roleTitle="Researcher"
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        roleColor="researcher"
      />
      <main className="flex-1 overflow-y-auto bg-muted/10">
        {children}
      </main>
    </div>
  );
}
