import Link from "next/link";
import { Button } from "./components/ui/Button";
import { ArrowRight, Sparkles, BookOpen, Wallet, Users, TrendingUp, Trophy, Coins } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-background text-foreground overflow-x-hidden">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pb-32 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium">
                <Sparkles className="w-4 h-4" />
                Collective intelligence, end to end
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Advance human knowledge.<br />
                <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                  Get rewarded.
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Design studies, collect responses from matched participants, and generate analysis grounded in real data. Tinat is the premier platform connecting academic researchers with participants.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto group rounded-xl px-8 h-14 text-base">
                    Start Earning Today
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/researcher">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-8 h-14 text-base">
                    Publish a Study
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4">
                {['Verified Researchers', 'Grounded Analysis', 'Tinat Credits (TC)', 'Instant Payouts'].map(feature => (
                  <span key={feature} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Decorative Hero Element */}
            <div className="relative hidden lg:block perspective-1000">
              <div className="relative animate-float rounded-2xl border border-border bg-card p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs text-muted-foreground font-mono">live · insights</span>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-5">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Active Study</p>
                    <p className="text-base font-medium leading-relaxed">Evaluating the impact of remote work on mental health and productivity metrics in 2026.</p>
                    <p className="text-xs text-muted-foreground mt-3 font-mono">Target: 500 participants</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted border border-border p-4 text-center">
                      <p className="text-2xl font-bold">342</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Responses</p>
                    </div>
                    <div className="rounded-lg bg-muted border border-border p-4 text-center">
                      <p className="text-2xl font-bold">68%</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Completion</p>
                    </div>
                    <div className="rounded-lg bg-muted border border-border p-4 text-center">
                      <p className="text-2xl font-bold text-success">50 TC</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Reward</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Surveys Section */}
      <section id="top-surveys" className="relative z-10 py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">Top paying right now</p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Surveys that pay the most</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real studies with real incentives. Join, complete matched surveys, and earn Tinat Credits you can withdraw as cash.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: "Consumer Behavior & Digital Adoption", reward: "45 TC", remaining: "125", tag: "Market Research", rank: 1, color: "text-amber-600 dark:text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { title: "The State of Freelancing in 2026", reward: "30 TC", remaining: "340", tag: "Social Research", rank: 2, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
              { title: "AI Adoption in Healthcare Systems", reward: "25 TC", remaining: "89", tag: "Healthcare", rank: 3, color: "text-orange-600 dark:text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" }
            ].map((survey) => (
              <div key={survey.rank} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-lg">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="space-y-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${survey.bg} ${survey.color} ${survey.border}`}>
                      <Trophy className="w-3 h-3" /> #{survey.rank} Top Payer
                    </span>
                    <h3 className="text-lg font-bold leading-snug line-clamp-2">{survey.title}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">You earn</p>
                    <p className="text-2xl font-bold text-primary flex items-center gap-1.5">
                      {survey.reward} <Coins className="w-4 h-4" />
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted border border-border p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Still paying</p>
                    <p className="text-xl font-bold flex items-center gap-1.5">{survey.remaining}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">remaining</p>
                  </div>
                </div>
                <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group-hover:gap-3">
                  Join to earn <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Features */}
      <section id="how-it-works" className="relative z-10 py-20 lg:py-28 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">How Tinat Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A transparent, efficient ecosystem built for modern academic research.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Discover</h3>
              <p className="text-muted-foreground leading-relaxed">
                Browse our repository of active academic studies. Filter by duration, topic, and reward to find the perfect fit.
              </p>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Participate</h3>
              <p className="text-muted-foreground leading-relaxed">
                Complete surveys, experiments, and interviews securely on our seamless platform.
              </p>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors">
                <Wallet className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Earn & Withdraw</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive Tinat Credits instantly upon completion. Withdraw directly to your local bank or mobile wallet.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Participants always join and earn for free. Researchers only pay for the responses they collect.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-2">For Participants</h3>
              <p className="text-3xl font-extrabold text-primary mb-6">Free</p>
              <ul className="space-y-3 mb-8 text-muted-foreground">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Access to all public studies</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Earn TC for every completion</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Zero withdrawal fees</li>
              </ul>
              <Link href="/register">
                <Button className="w-full">Sign Up Free</Button>
              </Link>
            </div>
            
            <div className="rounded-2xl border border-primary/50 bg-primary/5 p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
              <h3 className="text-2xl font-bold mb-2">For Researchers</h3>
              <p className="text-3xl font-extrabold text-primary mb-6">Pay as you go</p>
              <ul className="space-y-3 mb-8 text-muted-foreground">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Fund studies with TC</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Advanced demographic targeting</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Export data to CSV/Excel</li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full border-primary/50 hover:bg-primary hover:text-primary-foreground">Create a Study</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" className="relative z-10 py-20 lg:py-28 bg-background">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Trusted by researchers at leading institutions
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale transition-opacity hover:opacity-100">
            <span className="text-2xl font-bold font-serif tracking-tight">University of Science</span>
            <span className="text-2xl font-bold font-serif tracking-tight">Global Institute</span>
            <span className="text-2xl font-bold font-serif tracking-tight">Tech Academy</span>
            <span className="text-2xl font-bold font-serif tracking-tight">Medical Research Hub</span>
          </div>
        </div>
      </section>
    </div>
  );
}
