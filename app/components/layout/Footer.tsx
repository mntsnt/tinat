import Link from "next/link";
import {
  Stethoscope,
  Mail,
  Send,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-neutral-950 text-neutral-300">
      <div className="container mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        {/* Top Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-neutral-800/80">
          {/* Brand & Mission Statement */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 text-white group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Stethoscope className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Tinat</span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              Ethiopia&apos;s academic research platform for verified health surveys, observational data collection, and collaborative investigations under Ethiopian Personal Data Protection Proclamation No. 1321/2024.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Platform
              </span>
              <span>Addis Ababa, Ethiopia</span>
            </div>
          </div>

          {/* Column 1: Navigate */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Navigate
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/participant/studies" className="hover:text-white transition-colors">
                  Research Studies
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors">
                  Collaborative Hub
                </Link>
              </li>
              <li>
                <Link href="/ask" className="hover:text-white transition-colors">
                  Ask Tinat
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Researchers */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Researchers
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/researcher/studies/new" className="hover:text-white transition-colors">
                  Create Study
                </Link>
              </li>
              <li>
                <Link href="/forms/new" className="hover:text-white transition-colors">
                  Free Form Builder
                </Link>
              </li>
              <li>
                <Link href="/projects/new" className="hover:text-white transition-colors">
                  New Project
                </Link>
              </li>
              <li>
                <Link href="/code-of-conduct" className="hover:text-white transition-colors">
                  Code of Conduct
                </Link>
              </li>
              <li>
                <Link href="/dpa" className="hover:text-white transition-colors">
                  Data Processing Agreement
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Terms & Policies */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Terms & Policies
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/charter" className="hover:text-white transition-colors">
                  Participant Charter
                </Link>
              </li>
              <li>
                <Link href="/transparency" className="hover:text-white transition-colors">
                  Transparency Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/inventory.md"
                  target="_blank"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  System Inventory <ExternalLink className="w-3 h-3 text-neutral-500" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Massive ScholarXIV-style Giant Typography Wordmark */}
        <div className="py-8 sm:py-14 select-none overflow-hidden text-center">
          <h2 className="text-[15vw] sm:text-[16vw] font-black tracking-tighter leading-none text-white/95 uppercase hover:text-white transition-colors">
            Tinat
          </h2>
        </div>

        {/* Medical & Institutional Disclaimer Notice */}
        <div className="py-4 px-5 rounded-xl border border-neutral-800 bg-neutral-900/60 mb-8 text-neutral-400 text-xs leading-relaxed flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong className="text-neutral-200">Ethical Research Invariant:</strong> Tinat facilitates academic health surveys, questionnaires, and observational research. Tinat does not provide medical diagnosis, treatment, or clinical trials. Platform verification does not replace independent Institutional Review Board (IRB) approval.
          </p>
        </div>

        {/* Bottom Bar: Copyright & Social Links */}
        <div className="pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-400">
          <p>© {currentYear} Tinat Health Research Ecosystem. All rights reserved.</p>

          <div className="flex items-center gap-4 text-neutral-400">
            {/* X / Twitter */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            {/* Telegram */}
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </a>
            {/* Email */}
            <a
              href="mailto:contact@tinat.app"
              aria-label="Email"
              className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
