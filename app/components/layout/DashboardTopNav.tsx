"use client";

import { DashboardNotificationBell } from "./DashboardNotificationBell";
import { Search } from "lucide-react";

export function DashboardTopNav() {
  return (
    <div className="hidden md:flex sticky top-0 z-30 h-11 w-full shrink-0 items-center justify-between px-4 sm:px-6 bg-background/85 backdrop-blur-md border-b border-border/40">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-2xs group"
        title="Quick search or jump to... (Ctrl + K)"
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="hidden sm:inline">Search studies, tools, topics...</span>
        <kbd className="ml-1 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground">
          Ctrl K
        </kbd>
      </button>

      <div className="flex items-center gap-3">
        <DashboardNotificationBell />
      </div>
    </div>
  );
}
