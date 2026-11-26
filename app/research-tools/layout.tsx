import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLinksForUser } from "../components/layout/navLinks";
import { ResearcherLayoutShell } from "../researcher/ResearcherLayoutShell";

export default async function ResearchToolsLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true, avatarUrl: true, isVerified: true },
  });

  if (!user || user.role !== "RESEARCHER") {
    redirect("/dashboard");
  }

  if (!user.isVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  return (
    <ResearcherLayoutShell
      links={getLinksForUser(user)}
      userId={user.id}
      userName={user.name}
      userEmail={user.email}
      avatarUrl={user.avatarUrl}
    >
      {children}
    </ResearcherLayoutShell>
  );
}
