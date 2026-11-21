"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import type { SidebarLink } from "../components/layout/Sidebar";
import { DashboardTopNav } from "../components/layout/DashboardTopNav";
import type { ReactNode } from "react";

type CollectorLayoutShellProps = {
  children: ReactNode;
  links: SidebarLink[];
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

export function CollectorLayoutShell({ children, links, user }: CollectorLayoutShellProps) {
  const pathname = usePathname();
  const isCollectPage = pathname?.includes("/collect") ?? false;

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row overflow-hidden bg-background">
      <Sidebar
        links={links}
        roleTitle="Data Collector"
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        roleColor="participant"
      />
      <main
        className={`min-h-0 min-w-0 flex-1 bg-muted/10 flex flex-col ${
          isCollectPage ? "overflow-hidden" : "overflow-y-auto [scrollbar-gutter:stable]"
        }`}
      >
        {!isCollectPage && <DashboardTopNav />}
        <div className={`flex-1 min-w-0 flex flex-col ${isCollectPage ? "min-h-0 overflow-hidden" : ""}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
