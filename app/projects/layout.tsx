import type { Metadata } from "next";
import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getLinksForUser } from "../components/layout/navLinks";
import { ProjectsLayoutShell } from "./ProjectsLayoutShell";
import { checkIsUserCollector } from "@/lib/collector/status";

export const metadata: Metadata = {
  title: "Projects | Tinat",
  description: "Collaborate on research projects and manage project materials.",
};

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

  const isCollector = user.role === "PARTICIPANT" ? await checkIsUserCollector(user.id) : false;
  const links = getLinksForUser({ ...user, isCollector });

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
