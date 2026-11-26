import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLinksForUser } from "../components/layout/navLinks";
import { AcademyLayoutShell } from "./AcademyLayoutShell";

export default async function AcademyLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  let user = null;
  if (session?.userId) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, name: true, email: true, avatarUrl: true, isVerified: true },
    });
  }

  // If authenticated as a researcher, render with full Researcher sidebar
  if (user && user.role.toUpperCase() === "RESEARCHER") {
    const role = "RESEARCHER";
    return (
      <AcademyLayoutShell
        links={getLinksForUser({ role })}
        roleTitle="Researcher"
        roleColor="researcher"
        user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
      >
        {children}
      </AcademyLayoutShell>
    );
  }

  // Open-access fallback for public visitors or participants
  return <div className="min-h-screen bg-background">{children}</div>;
}
