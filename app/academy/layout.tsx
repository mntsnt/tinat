import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLinksForUser } from "../components/layout/navLinks";
import { AcademyLayoutShell } from "./AcademyLayoutShell";

export default async function AcademyLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true, avatarUrl: true, isVerified: true },
  });

  if (!user) {
    redirect("/login");
  }

  const role = user.role.toUpperCase();
  if (role !== "RESEARCHER") {
    redirect("/dashboard");
  }

  if (!user.isVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

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
