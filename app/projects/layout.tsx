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

  if (!user) {
    redirect("/login");
  }

  const verification = await prisma.verification.findUnique({
    where: {
      userId_verificationType: {
        userId: user.id,
        verificationType: "DATA_COLLECTOR"
      }
    }
  });

  const links = getLinksForUser({ ...user, isCollector: verification?.status === "VERIFIED" });

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
    <ProjectsLayoutShell
      links={links}
      user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
      roleTitle={roleTitle}
      roleColor={roleColor}
    >
      {children}
    </ProjectsLayoutShell>
  );
}
