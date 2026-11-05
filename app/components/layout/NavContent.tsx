"use client";

import Link from "next/link";
import { cn } from "../../../lib/utils";
import { usePathname } from "next/navigation";
import LogoutButton from "../LogoutButton";
import { ThemeToggle } from "../ThemeToggle";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { TinatLogo } from "../ui/TinatLogo";

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

  const homeHref = user
    ? user.role === "ADMIN"
      ? "/admin"
      : user.role === "RESEARCHER"
        ? "/researcher"
        : "/participant"
    : "/";

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const targetId = window.location.hash.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        setTimeout(() => {
          elem.scrollIntoView({ behavior: "smooth" });
        }, 120);
      }
    }
  }, [pathname]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    isMobile = false
  ) => {
    if (isMobile) {
      setMobileOpen(false);
    }
    if (href.startsWith("/#") || href.startsWith("#")) {
      const targetId = href.replace(/^\/?#/, "");
      if (pathname === "/") {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", href.startsWith("/") ? href : `/${href}`);
        }
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto flex h-14 items-center px-4 md:px-6">
        {/* Logo */}
        <Link
          href={homeHref}
          onClick={(e) => {
            if (pathname === homeHref) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
              window.history.pushState(null, "", homeHref);
            }
          }}
          className="flex items-center gap-2.5 mr-6 transition-transform hover:scale-105"
        >
          <TinatLogo size={28} showText variant="color" />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex flex-1 items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, false)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {link.title}
              </Link>
            );
          })}
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2 border-l border-border pl-3 ml-1">
              <span className="text-sm font-medium text-foreground">{user.name}</span>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l border-border pl-3 ml-1">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/60"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Right */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-md hover:bg-muted transition-colors text-foreground"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, true)}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {link.title}
              </Link>
            );
          })}
          {user ? (
            <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground px-3">{user.name}</span>
              <LogoutButton />
            </div>
          ) : (
            <div className="pt-2 mt-2 border-t border-border space-y-1">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 text-center"
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
