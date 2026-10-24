import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { getLinksForUser } from "../components/layout/navLinks";
import { AskLayoutShell } from "./AskLayoutShell";

export default async function AskLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  let user = null;
  let roleTitle = "Participant";
  let roleColor: "participant" | "researcher" | "admin" = "participant";

  if (session?.userId) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, name: true, email: true, avatarUrl: true },
    });

    if (user?.role === "RESEARCHER") {
      roleTitle = "Researcher";
      roleColor = "researcher";
    } else if (user?.role === "ADMIN") {
      roleTitle = "Admin";
      roleColor = "admin";
    }
  }

  const links = getLinksForUser(user);

  return (
    <AskLayoutShell
      links={links}
      user={user}
      roleTitle={roleTitle}
      roleColor={roleColor}
    >
      {children}
    </AskLayoutShell>
  );
}
