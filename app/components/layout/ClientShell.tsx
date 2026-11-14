"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { IntroAnimation } from "../ui/IntroAnimation";

// Routes that use their own shell, or auth screens that should not show the dashboard navbar.
// The global Navbar and Footer must NOT render inside these.
const DASHBOARD_PREFIXES = [
  "/dashboard",
  "/admin",
  "/participant",
  "/researcher",
  "/collector",
  "/projects",
  "/ask",
  "/ai",
  "/forms",
  "/f",
  "/profile",
  "/register",
  "/login",
  "/verify-email",
];
const FOOTER_PATHS = new Set([
  "/",
  "/privacy",
  "/terms",
  "/charter",
  "/code-of-conduct",
  "/transparency",
  "/dpa",
]);

interface ClientShellProps {
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

/**
 * ClientShell reads the current pathname and decides whether to show
 * the public Navbar/Footer or to simply render children directly.
 *
 * Role dashboards (/admin, /participant, /researcher) have their own
 * sidebar + top-bar, so they opt out of the global Navbar/Footer.
 */
export function ClientShell({ navbar, footer, children }: ClientShellProps) {
  const pathname = usePathname();
  const isDashboard = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));
  const shouldShowFooter = FOOTER_PATHS.has(pathname);

  if (isDashboard) {
    return (
      <>
        <IntroAnimation />
        {children}
      </>
    );
  }

  return (
    <>
      <IntroAnimation />
      {navbar}
      <main className="flex-1 flex flex-col">{children}</main>
      {shouldShowFooter && footer}
    </>
  );
}
