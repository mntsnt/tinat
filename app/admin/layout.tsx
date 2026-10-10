import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getLinksForUser } from "../components/layout/navLinks";
import { AdminLayoutShell } from "./AdminLayoutShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true, avatarUrl: true, isVerified: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  if (!user.isVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  const links = getLinksForUser(user);

  return (
    <AdminLayoutShell
      links={links}
      user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
    >
      {children}
    </AdminLayoutShell>
  );
}
