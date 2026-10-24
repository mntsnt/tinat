"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import type { SidebarLink } from "../components/layout/Sidebar";

interface AskLayoutShellProps {
  children: ReactNode;
  links: SidebarLink[];
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  roleTitle?: string;
  roleColor?: "participant" | "researcher" | "admin";
}

export function AskLayoutShell({
  children,
  links,
  user,
  roleTitle = "Participant",
  roleColor = "participant",
}: AskLayoutShellProps) {
  const pathname = usePathname();
  const isPublicProfile = pathname.startsWith("/ask/") && pathname !== "/ask";

  // If viewing a public ask profile (/ask/username) or not logged in, render clean full-width without dashboard sidebar
  if (isPublicProfile || !user) {
    return <main className="min-h-screen bg-background">{children}</main>;
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
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] bg-muted/10">
        {children}
      </main>
    </div>
  );
}
