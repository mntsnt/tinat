import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary font-bold text-primary-foreground text-xs shadow-sm transition-transform group-hover:scale-110">
                T
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Tinat
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              The premier platform for academic research participation.
              Connecting researchers with participants to advance human knowledge.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">For Participants</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground transition-colors">Join as Participant</Link></li>
              <li><Link href="/participant/studies" className="hover:text-foreground transition-colors">Browse Studies</Link></li>
              <li><Link href="/participant/wallet" className="hover:text-foreground transition-colors">Tinat Credits (TC)</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">For Researchers</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground transition-colors">Join as Researcher</Link></li>
              <li><Link href="/researcher/studies" className="hover:text-foreground transition-colors">Publish a Study</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Pricing & Guidelines</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Tinat Research Ecosystem. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
