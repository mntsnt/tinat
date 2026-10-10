"use client";

import Link from "next/link";
import { cn } from "../../../lib/utils";
import { usePathname } from "next/navigation";
import LogoutButton from "../LogoutButton";
import { useState } from "react";
import { Menu, X } from "lucide-react";

type NavLink = {
  title: string;
  href: string;
};

interface NavContentProps {
  user: { name: string; role: string } | null;
  links: NavLink[];
}

export default function NavContent({ user, links }: NavContentProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8 lg:px-10">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-sm font-semibold text-white dark:bg-emerald-600">
            T
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">Tinat</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {link.title}
              </Link>
            );
          })}
        </div>

        {/* Desktop Right */}
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <div className="ml-1 flex items-center gap-3 border-l border-border pl-4">
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <LogoutButton />
            </div>
          ) : (
            <div className="ml-1 flex items-center gap-2 border-l border-border pl-4">
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Right */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div id="public-mobile-menu" className="space-y-1 border-t border-border bg-background px-5 py-3 sm:px-8 md:hidden">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {link.title}
              </Link>
            );
          })}
          {user ? (
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <span className="px-3 text-sm text-muted-foreground">{user.name}</span>
              <LogoutButton />
            </div>
          ) : (
            <div className="mt-2 space-y-1 border-t border-border pt-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md bg-emerald-700 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
