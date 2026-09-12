import Link from "next/link";
import { Button } from "./components/ui/Button";
import {
  ArrowRight,
  Stethoscope,
  Coins,
  ClipboardCheck,
  ShieldCheck,
  Activity,
  HeartPulse,
  Brain,
  Baby,
  Apple,
  Dna,
  Building2,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Users,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { HEALTH_CATEGORIES, MEDICAL_DISCLAIMER } from "@/lib/healthCategories";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  let stats = {
    totalUsers: 13,
    activeStudies: 3,
    totalResponses: 8,
    totalStudies: 3,
  };
  let featuredStudy: any = null;

  try {
    const [users, active, responses, total, study] = await Promise.all([
      prisma.user.count(),
      prisma.study.count({ where: { status: "ACTIVE" } }),
      prisma.response.count(),
      prisma.study.count(),
      prisma.study.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { responses: { _count: "desc" } },
        include: {
          _count: { select: { responses: true, questions: true } },
        },
      }),
    ]);
    stats = {
      totalUsers: users,
      activeStudies: active,
      totalResponses: responses,
      totalStudies: total,
    };
    featuredStudy = study;
  } catch (err) {
    console.error("Could not load dynamic landing page stats:", err);
  }

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground overflow-x-hidden">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pb-32 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Stethoscope className="w-4 h-4" />
                Medical & Health Research Ecosystem
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Advance health research.<br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Collect verified data.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Tinat is the specialized platform built for medical researchers, universities, clinicians, and NGOs. Conduct formal funded clinical studies with participant incentives or publish open health questionnaires completely free.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/researcher/studies/new">
                  <Button size="lg" className="w-full sm:w-auto group rounded-xl px-8 h-14 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                    Create Health Study
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/participant/studies">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-8 h-14 text-base border-border hover:bg-muted">
                    Discover Studies
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2.5 pt-2">
                {[
                  "Funded Research & Free Forms",
                  "Verified Clinical Cohorts",
                  "Human Subjects Data Privacy",
                  "Tinat Credits (TC) Rewards",
                ].map((feature) => (
                  <span key={feature} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Hero Study Preview - Live from DB */}
            <div className="relative hidden lg:block perspective-1000">
              <div className="relative animate-float rounded-2xl border border-border bg-card p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Live Platform Study
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active &bull; Accepting Responses
                  </span>
                </div>

                {featuredStudy ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          {featuredStudy.category || "Public Health & Clinical Research"}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {featuredStudy.rewardCredits > 0 ? `${featuredStudy.rewardCredits} TC Reward` : "Free Open Data"}
                        </span>
                      </div>
                      <p className="text-base font-semibold leading-snug">
                        {featuredStudy.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                        {featuredStudy.objective || featuredStudy.description || "Healthcare research study collecting participant responses on Tinat."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-muted/60 border border-border p-3 text-center">
                        <p className="text-xl font-bold text-foreground">
                          {featuredStudy._count.responses}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          Responses
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/60 border border-border p-3 text-center">
                        <p className="text-xl font-bold text-foreground">
                          {featuredStudy._count.questions}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          Questions
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/60 border border-border p-3 text-center">
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          ~{featuredStudy.estimatedMinutes || 5} min
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          Est. Time
                        </p>
                      </div>
                    </div>

                    <Link href={`/participant/studies/${featuredStudy.id}`} className="block pt-1">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/30">
                        View & Participate in this Study <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-sm font-semibold text-foreground">No active studies currently</p>
                    <p className="text-xs text-muted-foreground">Be the first to publish a health study or survey.</p>
                    <Link href="/researcher/studies/new">
                      <Button size="sm" className="bg-emerald-600 text-white">Create Study</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Platform Real-time Metrics Banner */}
      <section className="relative z-10 -mt-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card/95 backdrop-blur shadow-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-bold text-foreground">
                Platform Activity & Scope
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                &mdash; Real figures directly from Tinat's health research database
              </span>
            </div>
            <Link href="/participant/studies" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1">
              Browse Active Studies <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {stats.activeStudies.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-foreground mt-1">Active Studies</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Currently collecting data</p>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {stats.totalResponses.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-foreground mt-1">Verified Responses</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Health data points submitted</p>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {stats.totalUsers.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-foreground mt-1">Platform Members</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Researchers & participants</p>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400">
                14
              </p>
              <p className="text-xs font-semibold text-foreground mt-1">Health Domains</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Epidemiology, clinical & public health</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Study Types Section */}
      <section className="relative z-10 py-20 lg:py-28 bg-muted/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Two Research Pathways
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
              Designed for every health investigation
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Whether you have grant funding or need zero-cost data collection for class or community work, Tinat provides the infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pathway 1: Funded Research */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-card p-8 shadow-lg relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Coins className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                    Participant Rewards
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Funded Health Research</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Ideal for academic dissertations, clinical trials, epidemiologic cohorts, and institutional studies with grant budgets. Reward participants with Tinat Credits (TC) to achieve rapid sample sizes and high completion rates.
                </p>
                <ul className="space-y-2.5 text-xs text-foreground/90 mb-8">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Custom reward per participant in Tinat Credits (TC)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Targeted cohort demographics and participant capacity cap
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Instant automated payout upon verified response
                  </li>
                </ul>
              </div>
              <Link href="/researcher/studies/new">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Launch Funded Study
                </Button>
              </Link>
            </div>

            {/* Pathway 2: Free Data Collection */}
            <div className="rounded-2xl border-2 border-blue-500/30 bg-card p-8 shadow-lg relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                    100% Free &bull; Direct Publish
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Free Data Collection</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Created for medical students, NGO field workers, healthcare organizations, and pilot questionnaire validation. Collect data freely from voluntary participants without requiring any funding or wallet balance.
                </p>
                <ul className="space-y-2.5 text-xs text-foreground/90 mb-8">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Zero cost to publish &mdash; no credit deposit required
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Full analytics, answer breakdowns, and Excel/CSV export
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Ideal for pilot testing, class assignments, and feedback
                  </li>
                </ul>
              </div>
              <Link href="/researcher/studies/new">
                <Button variant="outline" className="w-full border-blue-500/40 text-foreground hover:bg-blue-500/10">
                  Publish Free Health Form
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Health Domains Showcase */}
      <section className="relative z-10 py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Specialized Domains
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
              Medical & Health Research Disciplines
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Organized into standardized health categories to assist clinicians, students, and participants.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: "Public Health", icon: Activity, desc: "Population-level disease prevention and health outcomes." },
              { name: "Clinical Research", icon: Stethoscope, desc: "Patient assessments, treatment protocols, and trials." },
              { name: "Epidemiology", icon: HeartPulse, desc: "Disease incidence, determinants, and biostatistics." },
              { name: "Mental Health", icon: Brain, desc: "Psychological well-being, burnout, and behavioral studies." },
              { name: "Nutrition & Dietetics", icon: Apple, desc: "Dietary habits, micronutrient deficiencies, and lifestyle." },
              { name: "Maternal & Child Health", icon: Baby, desc: "Neonatal, pediatric, and reproductive health studies." },
              { name: "Infectious Diseases", icon: Dna, desc: "Viral, bacterial, and parasitic infection surveillance." },
              { name: "Medical Education", icon: GraduationCap, desc: "Trainee assessments, clinical curricula, and exams." },
            ].map((domain) => (
              <Link
                key={domain.name}
                href={`/participant/studies?category=${encodeURIComponent(domain.name)}`}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-emerald-500/50 hover:-translate-y-0.5 shadow-sm"
              >
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <domain.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1 group-hover:text-emerald-600 transition-colors">
                  {domain.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {domain.desc}
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center pt-4">
            <Link href="/participant/studies">
              <Button variant="outline" className="rounded-xl px-6">
                Explore All 14 Health Categories &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Academic Governance */}
      <section className="relative z-10 py-16 bg-muted/40 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 p-2 rounded-lg bg-background border border-border text-xs font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Academic Integrity & Research Protocol
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Built for Academic Health Institutions, Hospitals & NGOs
          </h3>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {MEDICAL_DISCLAIMER} Tinat facilitates participant recruitment, questionnaire design, and data organization under researcher-directed protocols.
          </p>
        </div>
      </section>
    </div>
  );
}
