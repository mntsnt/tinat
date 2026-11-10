import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TinatLogo } from "../components/ui/TinatLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import { DashboardNotificationBell } from "../components/layout/DashboardNotificationBell";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  let homeHref = "/";
  if (session?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    if (user?.role === "RESEARCHER") homeHref = "/researcher";
    else if (user?.role === "ADMIN") homeHref = "/admin";
    else if (user?.role === "PARTICIPANT") homeHref = "/participant";
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={homeHref} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <TinatLogo size={28} showText variant="color" />
          </Link>
          {session && (
            <Link
              href={homeHref}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground ml-3 border-l border-border pl-3 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session && <DashboardNotificationBell />}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
