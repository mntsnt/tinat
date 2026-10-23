"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import type { SidebarLink } from "../components/layout/Sidebar";

type AdminLayoutShellProps = {
  children: ReactNode;
  links: SidebarLink[];
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

export function AdminLayoutShell({ children, links, user }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const isCommunityChat = pathname === "/admin/community";

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row overflow-hidden bg-background">
      <Sidebar
        links={links}
        roleTitle="System Admin"
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        roleColor="admin"
      />
      <main className={`min-h-0 min-w-0 flex-1 bg-muted/10 ${isCommunityChat ? "overflow-hidden" : "overflow-y-auto [scrollbar-gutter:stable]"}`}>
        {children}
      </main>
    </div>
  );
}
