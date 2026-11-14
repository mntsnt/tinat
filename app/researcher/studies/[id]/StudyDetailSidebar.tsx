"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TinatLogo } from "@/app/components/ui/TinatLogo";
import {
  LayoutDashboard,
  Brain,
  BarChart3,
  ClipboardCheck,
  Users,
  MessageSquare,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Settings,
  UserRound,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
} from "lucide-react";

interface StudyDetailSidebarProps {
  studyId: string;
  studyTitle: string;
  studyStatus: string;
  category?: string | null;
  activeView: string;
  totalResponses: number;
  totalCollectors: number;
  totalComments: number;
  userName: string;
  userEmail?: string;
  avatarUrl?: string | null;
}

export function StudyDetailSidebar({
  studyId,
  studyTitle,
  studyStatus,
  category,
  activeView,
  totalResponses,
  totalCollectors,
  totalComments,
  userName,
  userEmail,
  avatarUrl,
}: StudyDetailSidebarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("tinat_study_sidebar_collapsed") === "true";
      } catch {
        return false;
      }
    }
    return false;
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const toggleCollapse = () => {
    setIsAnimating(true);
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tinat_study_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
    setTimeout(() => setIsAnimating(false), 250);
  };

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

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

  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "analysis",
      label: "AI analysis",
      icon: Brain,
      badge: null,
    },
    {
      id: "visualizations",
      label: "Data visualizations",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "responses",
      label: "Responses",
      icon: ClipboardCheck,
      badge: totalResponses > 0 ? totalResponses : null,
    },
    {
      id: "collectors",
      label: "Data Collectors",
      icon: Users,
      badge: totalCollectors > 0 ? totalCollectors : null,
    },
    {
      id: "discussion",
      label: "Discussion & feedback",
      icon: MessageSquare,
      badge: totalComments > 0 ? totalComments : null,
    },
  ];

  function renderNavItems(mobile = false) {
    const collapsed = !mobile && isCollapsed;

    return (
      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-2">
        {!collapsed && (
          <p className="px-2 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Study Sections
          </p>
        )}
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={`/researcher/studies/${studyId}?view=${item.id}`}
              onClick={() => {
                if (mobile) setMobileOpen(false);
              }}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex min-h-9 items-center rounded-lg px-2.5 py-2 text-xs font-medium transition-all",
                collapsed ? "justify-center" : "justify-between gap-2.5",
                isActive
                  ? "border-l-2 border-emerald-600 bg-emerald-500/10 text-emerald-900 font-semibold dark:border-emerald-400 dark:text-emerald-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge !== null && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none shrink-0",
                    isActive
                      ? "bg-emerald-600 text-white dark:bg-emerald-500"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.badge}
                </span>
              )}

              {collapsed && item.badge !== null && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white">
                  {item.badge}
                </span>
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
      <div className="relative border-t border-border p-2.5 bg-card/40">
        {accountMenuOpen && (
          <div
            role="menu"
            aria-label="Account options"
            className="absolute bottom-full left-2 right-2 mb-2 rounded-lg border border-border bg-popover p-1 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <Link
              href="/researcher/settings"
              role="menuitem"
              onClick={() => setAccountMenuOpen(false)}
              className="flex min-h-9 items-center gap-2.5 rounded-md px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </Link>
            <div className="my-1 border-t border-border" />
            <button
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex min-h-9 w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
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
          aria-label="Open account menu"
          title={collapsed ? userName : undefined}
          className={cn(
            "flex min-h-9 w-full items-center rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/80",
            collapsed ? "justify-center" : "gap-2.5"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-700 text-[10px] font-bold text-white dark:bg-emerald-600">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={28}
                height={28}
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
                <p className="truncate text-xs font-semibold text-foreground">{userName}</p>
                {userEmail && <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>}
              </div>
              <ChevronUp
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                  accountMenuOpen && "rotate-180"
                )}
              />
            </>
          )}
        </button>

        {!mobile && (
          <button
            onClick={toggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "mt-1 flex min-h-8 items-center rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted active:scale-[0.99] w-full",
              collapsed ? "justify-center" : "gap-2"
            )}
          >
            {collapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
            {!collapsed && <span className="text-[11px]">Collapse sidebar</span>}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ── DESKTOP STUDY SIDEBAR ── */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card/70 md:flex z-30 select-none",
          isAnimating && "transition-[width] duration-200 ease-out",
          isCollapsed ? "w-16" : "w-60 xl:w-64"
        )}
      >
        {/* Top Header: Tinat Brand Logo */}
        <div
          className={cn(
            "border-b border-border py-3 flex items-center shrink-0",
            isCollapsed ? "px-0 justify-center h-14" : "px-3.5 h-14 justify-between"
          )}
        >
          <Link
            href="/researcher"
            className={cn(
              "flex items-center transition-opacity hover:opacity-80",
              isCollapsed ? "justify-center" : "gap-2"
            )}
          >
            <TinatLogo size={22} variant="color" />
            {!isCollapsed && (
              <span className="font-bold text-sm text-foreground tracking-tight">
                Tinat <span className="font-medium text-[11px] text-emerald-600 dark:text-emerald-400">Study</span>
              </span>
            )}
          </Link>
        </div>

        {/* Back Link to All Studies */}
        <div className={cn("border-b border-border/60 p-2", isCollapsed && "flex justify-center")}>
          <Link
            href="/researcher/studies"
            title={isCollapsed ? "Back to Studies" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              isCollapsed && "justify-center px-2"
            )}
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Back to Studies</span>}
          </Link>
        </div>

        {/* Study Context Card (Truncated title + status badge) */}
        {!isCollapsed && (
          <div className="border-b border-border/60 p-3 bg-muted/20">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
                {category || "Health Study"}
              </span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold uppercase",
                  studyStatus === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : studyStatus === "COMPLETED"
                    ? "bg-muted text-muted-foreground"
                    : "bg-amber-500/10 text-amber-600"
                )}
              >
                {studyStatus}
              </span>
            </div>
            <p className="text-xs font-bold text-foreground leading-snug line-clamp-2" title={studyTitle}>
              {studyTitle}
            </p>
          </div>
        )}

        {/* Study Navigation Links */}
        {renderNavItems(false)}

        {/* User Footer */}
        {renderUserFooter(false)}
      </aside>

      {/* ── MOBILE TOP BAR & DRAWER ── */}
      <div className="md:hidden flex shrink-0 items-center justify-between px-4 py-2.5 border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40">
        <Link href="/researcher/studies" className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="truncate max-w-[180px] font-semibold text-foreground">{studyTitle}</span>
        </Link>
        <button
          ref={menuButtonRef}
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          aria-label="Open study menu"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Study Navigation"
            className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border p-3">
              <div className="flex items-center gap-2">
                <TinatLogo size={22} variant="color" />
                <span className="font-bold text-sm text-foreground">Study Sections</span>
              </div>
              <button
                ref={closeButtonRef}
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-b border-border/60 p-3 bg-muted/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {category || "Health Study"}
              </span>
              <p className="text-xs font-bold text-foreground mt-0.5 line-clamp-2">{studyTitle}</p>
            </div>

            {renderNavItems(true)}
            {renderUserFooter(true)}
          </div>
        </div>
      )}
    </>
  );
}
