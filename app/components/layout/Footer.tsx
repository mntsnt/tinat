"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Send, ShieldCheck } from "lucide-react";
import { TinatLogo } from "../ui/TinatLogo";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
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
    <footer className="border-t border-border bg-muted/20 text-foreground dark:bg-neutral-950 dark:text-neutral-300 transition-colors duration-200">
      <div className="container mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        {/* Top Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-border dark:border-neutral-800/80">
          {/* Brand & Mission Statement */}
          <div className="md:col-span-5 space-y-4">
            <Link
              href="/"
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  window.history.pushState(null, "", "/");
                }
              }}
              className="inline-flex items-center gap-2.5 text-foreground dark:text-white group"
            >
              <TinatLogo size={32} showText variant="color" />
            </Link>
            <p className="text-sm text-muted-foreground dark:text-neutral-400 leading-relaxed max-w-sm">
              Ethiopia&apos;s academic research platform for verified health surveys, observational data collection, and collaborative investigations.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-muted-foreground dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Platform
              </span>
              <span>Addis Ababa, Ethiopia</span>
            </div>
          </div>

          {/* Column 1: Navigate */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground dark:text-neutral-200">
              Navigate
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground dark:text-neutral-400">
              <li>
                <Link
                  href="/#how-it-works"
                  onClick={(e) => handleAnchorClick(e, "/#how-it-works")}
                  className="hover:text-foreground dark:hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/#pathways"
                  onClick={(e) => handleAnchorClick(e, "/#pathways")}
                  className="hover:text-foreground dark:hover:text-white transition-colors"
                >
                  Data Collection
                </Link>
              </li>
              <li>
                <Link
                  href="/#disciplines"
                  onClick={(e) => handleAnchorClick(e, "/#disciplines")}
                  className="hover:text-foreground dark:hover:text-white transition-colors"
                >
                  Health Disciplines
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-foreground dark:hover:text-white transition-colors">
                  Collaborative Hub
                </Link>
              </li>
              <li>
                <Link href="/ask" className="hover:text-foreground dark:hover:text-white transition-colors">
                  Ask Tinat
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  onClick={(e) => handleAnchorClick(e, "/#faq")}
                  className="hover:text-foreground dark:hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>



          {/* Column 2: Terms & Policies */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground dark:text-neutral-200">
              Terms & Policies
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground dark:text-neutral-400">
              <li>
                <Link href="/terms" className="hover:text-foreground dark:hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground dark:hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Giant Animated Brand Wordmark with Backlight Glow & Hover Kinetic Motion */}
        <div className="relative py-10 sm:py-16 select-none overflow-hidden text-center group">
          {/* Ambient Radial Backlight Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 sm:h-44 w-3/4 max-w-4xl rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 blur-3xl transition-all duration-700 ease-out group-hover:scale-115 group-hover:bg-emerald-500/30 animate-tinat-glow"
          />

          <Link
            href="/"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                window.history.pushState(null, "", "/");
              }
            }}
            className="relative inline-block text-center cursor-pointer group"
            title="Tinat - Return to top"
          >
            <h2 className="text-[15vw] sm:text-[16vw] font-black tracking-tighter leading-none uppercase bg-gradient-to-r from-neutral-800 via-emerald-600 to-neutral-800 dark:from-neutral-200 dark:via-emerald-400 dark:to-neutral-200 bg-clip-text text-transparent animate-tinat-shimmer transition-all duration-500 ease-out group-hover:tracking-normal group-hover:drop-shadow-[0_0_40px_rgba(16,185,129,0.35)]">
              Tinat
            </h2>
            <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-muted-foreground/60 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
              Back to top &uarr;
            </span>
          </Link>
        </div>

        {/* Medical & Institutional Disclaimer Notice */}
        <div className="py-4 px-5 rounded-xl border border-border bg-card text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400 mb-8 text-xs leading-relaxed flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong className="text-foreground dark:text-neutral-200">Ethical Research Invariant:</strong> Tinat facilitates academic health surveys, questionnaires, and observational research. Tinat does not provide medical diagnosis, treatment, or clinical trials. Platform verification does not replace independent Institutional Review Board (IRB) approval.
          </p>
        </div>

        {/* Bottom Bar: Copyright & Social Links */}
        <div className="pt-6 border-t border-border dark:border-neutral-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground dark:text-neutral-400">
          <p>© {currentYear} Tinat Health Research Ecosystem. All rights reserved.</p>

          <div className="flex items-center gap-4 text-muted-foreground dark:text-neutral-400">
            {/* X / Twitter */}
            <a
              href="https://x.com/tinat_app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-neutral-800 hover:text-foreground dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* Telegram */}
            <a
              href="https://t.me/tinat_app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-neutral-800 hover:text-foreground dark:hover:text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </a>
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/tinatapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-neutral-800 hover:text-foreground dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
            {/* Email */}
            <a
              href="mailto:contact.tinatapp@gmail.com"
              aria-label="Email"
              className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-neutral-800 hover:text-foreground dark:hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
