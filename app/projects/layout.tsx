import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getLinksForUser } from "../components/layout/navLinks";
import { ProjectsLayoutShell } from "./ProjectsLayoutShell";

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
    <ProjectsLayoutShell
      links={links}
      user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
    >
      {children}
    </ProjectsLayoutShell>
  );
}
