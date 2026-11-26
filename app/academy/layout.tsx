import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAcademyAccess } from "@/lib/academy/access";
import { getLinksForUser } from "../components/layout/navLinks";
import { AcademyLayoutShell } from "./AcademyLayoutShell";

export default async function AcademyLayout({ children }: { children: ReactNode }) {
  const { session, user } = await getAcademyAccess();

  if (!session?.userId || !user) {
    redirect("/login?redirect=%2Facademy");
  }

  if (user.role !== "RESEARCHER") {
    redirect(user.role === "ADMIN" ? "/admin" : "/participant");
  }

  if (!user.isVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  return (
    <AcademyLayoutShell
      links={getLinksForUser({ role: "RESEARCHER" })}
      roleTitle="Researcher"
      roleColor="researcher"
      user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
    >
      {children}
    </AcademyLayoutShell>
  );
}
