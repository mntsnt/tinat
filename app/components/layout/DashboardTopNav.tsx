"use client";

import { DashboardNotificationBell } from "./DashboardNotificationBell";

export function DashboardTopNav() {
  return (
    <div className="sticky top-0 z-30 flex h-11 w-full shrink-0 items-center justify-end px-4 sm:px-6 bg-background/85 backdrop-blur-md border-b border-border/40">
      <div className="flex items-center gap-3">
        <DashboardNotificationBell />
      </div>
    </div>
  );
}
