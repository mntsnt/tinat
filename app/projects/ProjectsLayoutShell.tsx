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
};

export function ProjectsLayoutShell({ children, links, user }: ProjectsLayoutShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <Sidebar
        links={links}
        roleTitle="Researcher"
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        roleColor="researcher"
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-muted/10">
        {children}
      </main>
    </div>
  );
}
