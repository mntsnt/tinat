"use client";

import type { ReactNode } from "react";
import { Sidebar, type SidebarLink } from "../components/layout/Sidebar";
import { DashboardTopNav } from "../components/layout/DashboardTopNav";

type AcademyLayoutShellProps = {
  children: ReactNode;
  links: SidebarLink[];
  roleTitle: string;
  roleColor: "participant" | "researcher" | "admin";
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

export function AcademyLayoutShell({
  children,
  links,
  roleTitle,
  roleColor,
  user,
}: AcademyLayoutShellProps) {
  return (
    <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] flex flex-col md:flex-row overflow-hidden bg-background">
      <Sidebar
        links={links}
        roleTitle={roleTitle}
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        roleColor={roleColor}
      />
      <main className="min-h-0 min-w-0 flex-1 bg-muted/10 overflow-y-auto [scrollbar-gutter:stable] flex flex-col">
        <DashboardTopNav />
        <div className="flex-1 min-w-0 flex flex-col">{children}</div>
      </main>
    </div>
  );
}
