import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import { prisma } from "../../lib/prisma";
import { getLinksForUser } from "../components/layout/navLinks";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, name: true, email: true, isVerified: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  if (!user.isVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  const links = getLinksForUser(user);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar
        links={links}
        roleTitle="System Admin"
        userName={user.name}
        userEmail={user.email}
        roleColor="admin"
      />
      <main className="flex-1 overflow-y-auto bg-muted/10">
        {children}
      </main>
    </div>
  );
}
