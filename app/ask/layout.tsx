import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { Sidebar } from "../components/layout/Sidebar";
import { getLinksForUser } from "../components/layout/navLinks";

export default async function AskLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true, avatarUrl: true },
  });

  if (!user) {
    redirect("/login");
  }

  const links = getLinksForUser(user);

  let roleTitle = "Participant";
  let roleColor: "participant" | "researcher" | "admin" = "participant";

  if (user.role === "RESEARCHER") {
    roleTitle = "Researcher";
    roleColor = "researcher";
  } else if (user.role === "ADMIN") {
    roleTitle = "Admin";
    roleColor = "admin";
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar
        links={links}
        roleTitle={roleTitle}
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        roleColor={roleColor}
      />
      <main className="flex-1 overflow-y-auto bg-muted/10">
        {children}
      </main>
    </div>
  );
}
