"use client";

import type { ReactNode } from "react";
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
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] bg-muted/10">
        {children}
      </main>
    </div>
  );
}
