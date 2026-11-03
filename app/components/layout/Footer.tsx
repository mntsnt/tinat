import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:px-7">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-xl font-bold tracking-tight text-primary">Tinat</span>
            <p className="mt-2 text-sm text-muted-foreground">
              Empowering health and medical research in Ethiopia through verified, voluntary academic surveys and ethical data collection.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Participants</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/participant/studies" className="hover:text-foreground transition-colors">Browse Studies</Link></li>
              <li><Link href="/register" className="hover:text-foreground transition-colors">Sign Up</Link></li>
              <li><Link href="/charter" className="hover:text-foreground transition-colors">Participant Charter</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Researchers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground transition-colors">Join as Researcher</Link></li>
              <li><Link href="/researcher/studies/new" className="hover:text-foreground transition-colors">Publish a Study</Link></li>
              <li><Link href="/code-of-conduct" className="hover:text-foreground transition-colors">Code of Conduct</Link></li>
              <li><Link href="/dpa" className="hover:text-foreground transition-colors">Data Processing Agreement</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Governance</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/transparency" className="hover:text-foreground transition-colors">Public Transparency</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Notice</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            <span className="font-semibold text-foreground">Medical & Health Research Notice:</span> Tinat is an academic technology platform for health surveys, observational data collection, and community epidemiological research. Tinat does not support interventional clinical trials, nor provide medical diagnosis, clinical treatment, or medical advice. Tinat administrative verification does not substitute or replace institutional ethics review board (IRB) approval.
          </p>
        </div>

        <div className="mt-6 border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Tinat Health Research Ecosystem. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Notice</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/charter" className="hover:text-foreground transition-colors">Participant Charter</Link>
            <Link href="/code-of-conduct" className="hover:text-foreground transition-colors">Code of Conduct</Link>
            <Link href="/transparency" className="hover:text-foreground transition-colors">Transparency Report</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
