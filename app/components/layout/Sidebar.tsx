"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "../../../lib/utils";
import { Menu, X, LogOut, ChevronRight } from "lucide-react";

export type SidebarLink = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

interface SidebarProps {
  links: SidebarLink[];
  roleTitle: string;
  userName: string;
  userEmail?: string;
  roleColor?: "indigo" | "emerald" | "rose"; // participant=emerald, researcher=indigo, admin=rose
}

export function Sidebar({
  links,
  roleTitle,
  userName,
  userEmail,
  roleColor = "indigo",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const colorMap = {
    indigo: {
      badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
      avatar: "bg-indigo-600 text-white",
      active: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-l-2 border-indigo-600",
    },
    emerald: {
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      avatar: "bg-emerald-600 text-white",
      active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-l-2 border-emerald-600",
    },
    rose: {
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
      avatar: "bg-rose-600 text-white",
      active: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-l-2 border-rose-600",
    },
  };

  const colors = colorMap[roleColor];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {links.map((link) => {
        // Exact match for root dashboard pages, prefix match for sub-pages
        const isActive =
          pathname === link.href ||
          (link.href.split("/").length > 2 && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
              isActive
                ? colors.active
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-5 h-5 [&>svg]:w-4 [&>svg]:h-4",
                isActive ? "" : "opacity-70 group-hover:opacity-100"
              )}
            >
              {link.icon}
            </span>
            <span className="flex-1">{link.title}</span>
            {isActive && (
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  const UserFooter = () => (
    <div className="p-3 border-t border-border">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
            colors.avatar
          )}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
          {userEmail && (
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          )}
        </div>
      </div>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-60"
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );

  const SidebarHeader = () => (
    <div className="p-4 border-b border-border">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm shadow-sm flex-shrink-0">
          T
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">Tinat</p>
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              colors.badge
            )}
          >
            {roleTitle}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card/60 min-h-[calc(100vh-0px)]">
        <SidebarHeader />
        <NavLinks />
        <UserFooter />
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground text-xs shadow-sm">
            T
          </div>
          <span className="font-semibold text-sm text-foreground">
            Tinat <span className={cn("font-medium text-xs px-1.5 py-0.5 rounded", colors.badge)}>{roleTitle}</span>
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile Drawer Overlay ───────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full bg-card shadow-2xl border-r border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm shadow-sm">
                  T
                </div>
                <span className="font-bold text-foreground">Tinat</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks />
            <UserFooter />
          </div>
        </div>
      )}
    </>
  );
}
