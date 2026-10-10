"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import {
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
} from "lucide-react";

export type SidebarLink = {
  title: string;
  href: string;
  icon?: React.ReactNode;
};

interface SidebarProps {
  links: SidebarLink[];
  roleTitle: string;
  userId: string;
  userName: string;
  userEmail?: string;
  avatarUrl?: string | null;
  roleColor?: "participant" | "researcher" | "admin";
}

export function Sidebar({
  links,
  roleTitle,
  userId,
  userName,
  userEmail,
  avatarUrl,
  roleColor = "participant",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsCollapsed(localStorage.getItem("tinat_sidebar_collapsed") === "true");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("tinat_sidebar_collapsed", String(next));
      return next;
    });
  };

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  const roleColors = {
    participant: {
      badge: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
      avatar: "bg-emerald-700 text-white dark:bg-emerald-600",
      active: "border-l-2 border-emerald-700 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-200",
    },
    researcher: {
      badge: "bg-cyan-50 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300",
      avatar: "bg-cyan-800 text-white dark:bg-cyan-700",
      active: "border-l-2 border-cyan-800 bg-cyan-50 text-cyan-950 dark:border-cyan-400 dark:bg-cyan-950/50 dark:text-cyan-200",
    },
    admin: {
      badge: "bg-rose-50 text-rose-900 dark:bg-rose-950/50 dark:text-rose-300",
      avatar: "bg-rose-700 text-white dark:bg-rose-600",
      active: "border-l-2 border-rose-700 bg-rose-50 text-rose-950 dark:border-rose-400 dark:bg-rose-950/50 dark:text-rose-200",
    },
  };
  const colors = roleColors[roleColor];
  const settingsHref =
    roleColor === "admin"
      ? "/admin/settings"
      : roleColor === "researcher"
        ? "/researcher/settings"
        : "/participant/settings";

  useEffect(() => {
    if (!mobileOpen) return;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  function closeMobileMenu() {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
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

  function renderNavLinks(mobile = false) {
    const collapsed = !mobile && isCollapsed;
    
    return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
      {links.map((link) => {
        const isExact = pathname === link.href;
        const isPrefix = link.href.split("/").length > 2 && pathname.startsWith(link.href + "/");
        let isActive = isExact || isPrefix;

        if (!isExact && links.some((l) => pathname === l.href)) {
          isActive = false;
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            title={collapsed ? link.title : undefined}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group flex min-h-9 items-center rounded-md px-2.5 py-2 text-[13px] font-medium transition-all active:scale-[0.99]",
              collapsed ? "justify-center gap-0" : "gap-2.5",
              isActive
                ? colors.active
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-5 h-5 [&>svg]:w-4 [&>svg]:h-4 flex items-center justify-center",
                isActive ? "" : "opacity-70 group-hover:opacity-100"
              )}
            >
              {link.icon}
            </span>
            {!collapsed && (
              <>
                <span className="flex-1">{link.title}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </>
            )}
          </Link>
        );
      })}
    </nav>
    );
  }

  function renderUserFooter(mobile = false) {
    const collapsed = !mobile && isCollapsed;
    
    return (
    <div className="relative border-t border-border p-2.5">
      {accountMenuOpen && (
        <div
          role="menu"
          aria-label="Account menu"
          className={cn(
            "absolute bottom-full z-50 mb-2 min-w-52 rounded-lg border border-border bg-card p-1.5 shadow-xl",
            collapsed ? "left-full ml-2" : "inset-x-2"
          )}
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-[13px] font-semibold text-foreground">{userName}</p>
            {userEmail && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
          </div>
          <Link
            href={`/profile/${userId}`}
            role="menuitem"
            onClick={() => setAccountMenuOpen(false)}
            className="flex min-h-9 items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-muted"
          >
            <UserRound className="h-4 w-4 text-muted-foreground" />
            View profile
          </Link>
          <Link
            href={settingsHref}
            role="menuitem"
            onClick={() => setAccountMenuOpen(false)}
            className="flex min-h-9 items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-muted"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Settings
          </Link>
          <div className="my-1 border-t border-border" />
          <button
            role="menuitem"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-9 w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAccountMenuOpen((open) => !open)}
        aria-expanded={accountMenuOpen}
        aria-haspopup="menu"
        aria-label="Open account menu"
        title={collapsed ? userName : undefined}
        className={cn(
          "flex min-h-10 w-full items-center rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/80",
          collapsed ? "justify-center" : "gap-2.5"
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-bold",
            !avatarUrl && colors.avatar
          )}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">{userName}</p>
              {userEmail && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
            </div>
            <ChevronUp className={cn("h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform", accountMenuOpen && "rotate-180")} />
          </>
        )}
      </button>
      
      {!mobile && (
        <button
          onClick={toggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex min-h-9 items-center rounded-md px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted active:scale-[0.99] w-full",
            collapsed ? "justify-center" : "gap-2.5"
          )}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      )}
    </div>
    );
  }

  function renderSidebarHeader(mobile = false) {
    const collapsed = !mobile && isCollapsed;
    
    return (
    <div className={cn("border-b border-border py-3 flex items-center", collapsed ? "px-0 justify-center h-16" : "px-3.5 h-16")}>
      <Link href="/" className={cn("flex items-center transition-opacity hover:opacity-80", collapsed ? "justify-center" : "gap-2.5")}>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
          T
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">Tinat</p>
            <span
              className={cn(
                "mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold",
                colors.badge
              )}
            >
              {roleTitle}
            </span>
          </div>
        )}
      </Link>
    </div>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden min-h-screen shrink-0 flex-col border-r border-border bg-card/70 md:flex transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-56"
      )}>
        {renderSidebarHeader()}
        {renderNavLinks()}
        {renderUserFooter()}
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black font-bold text-white text-xs shadow-sm dark:bg-white dark:text-black">
            T
          </div>
          <span className="font-semibold text-sm text-foreground">
            Tinat <span className={cn("font-medium text-xs px-1.5 py-0.5 rounded", colors.badge)}>{roleTitle}</span>
          </span>
        </Link>
        <button
          ref={menuButtonRef}
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          aria-controls="dashboard-mobile-navigation"
          className="rounded-md p-2 transition-colors hover:bg-muted active:scale-95"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          {/* Drawer */}
          <div
            id="dashboard-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={`${roleTitle} navigation`}
            className="relative flex h-full w-64 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border p-3.5">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black font-bold text-white text-sm shadow-sm dark:bg-white dark:text-black">
                  T
                </div>
                <span className="font-bold text-foreground">Tinat</span>
              </Link>
              <button
                ref={closeButtonRef}
                onClick={closeMobileMenu}
                aria-label="Close menu"
                className="rounded-md p-2 transition-colors hover:bg-muted active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavLinks(true)}
            {renderUserFooter(true)}
          </div>
        </div>
      )}
    </>
  );
}
