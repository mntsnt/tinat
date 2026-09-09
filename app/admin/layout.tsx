import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import { prisma } from "../../lib/prisma";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  FileText,
  Settings,
} from "lucide-react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, name: true, email: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const links = [
    { title: "Overview", href: "/admin", icon: <LayoutDashboard /> },
    { title: "User Management", href: "/admin/users", icon: <Users /> },
    { title: "Manage Studies", href: "/admin/studies", icon: <FileText /> },
    { title: "Withdrawals", href: "/admin/withdrawals", icon: <CreditCard /> },
    { title: "Activity Logs", href: "/admin/logs", icon: <Activity /> },
    { title: "Settings", href: "/admin/settings", icon: <Settings /> },
  ];

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-screen">
      <Sidebar
        links={links}
        roleTitle="System Admin"
        userName={user.name}
        userEmail={user.email}
        roleColor="rose"
      />
      <div className="flex-1 overflow-y-auto bg-muted/10">
        {children}
      </div>
    </div>
  );
}
