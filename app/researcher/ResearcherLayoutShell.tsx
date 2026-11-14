"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import type { SidebarLink } from "../components/layout/Sidebar";
import { DashboardTopNav } from "../components/layout/DashboardTopNav";

interface ResearcherLayoutShellProps {
  children: ReactNode;
  links: SidebarLink[];
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
}

export function ResearcherLayoutShell({
  children,
  links,
  userId,
  userName,
  userEmail,
  avatarUrl,
}: ResearcherLayoutShellProps) {
  const pathname = usePathname();

  // When routed to a study detail page (/researcher/studies/[id]), replace the main dashboard sidebar with the study's dedicated StudyDetailSidebar
  const isStudyDetailPage =
    pathname.startsWith("/researcher/studies/") &&
    pathname !== "/researcher/studies" &&
    pathname !== "/researcher/studies/new";

  if (isStudyDetailPage) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row overflow-hidden bg-background">
      <Sidebar
        links={links}
        roleTitle="Researcher"
        userId={userId}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        roleColor="researcher"
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
