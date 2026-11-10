"use client";

import { DashboardTopNav } from "../components/layout/DashboardTopNav";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import type { SidebarLink } from "../components/layout/Sidebar";

type ProjectsLayoutShellProps = {
  children: ReactNode;
  links: SidebarLink[];
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  roleTitle?: string;
  roleColor?: "participant" | "researcher" | "admin";
};

export function ProjectsLayoutShell({
  children,
  links,
  user,
  roleTitle = "Researcher",
  roleColor = "researcher",
}: ProjectsLayoutShellProps) {
  const pathname = usePathname();

  // If viewing an individual project workspace (/projects/[id]),
  // do not render the global app sidebar. The project workspace has its own
  // dedicated sidebar and full-screen workspace layout.
  const isProjectWorkspace = pathname
    ? /^\/projects\/[^\/]+(\/.*)?$/.test(pathname) &&
      !pathname.startsWith("/projects/new") &&
      !pathname.startsWith("/projects/invite")
    : false;

  if (isProjectWorkspace) {
    return <div className="fixed inset-0 overflow-hidden bg-background">{children}</div>;
  }

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row overflow-hidden bg-background">
      <Sidebar
        links={links}
        roleTitle={roleTitle}
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        roleColor={roleColor}
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] bg-muted/10 flex flex-col">
        <DashboardTopNav />
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}
