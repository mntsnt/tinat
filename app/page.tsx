import Link from "next/link";
import { ButtonLink } from "./components/ui/Button";
import {
  ArrowRight,
  Stethoscope,
  Coins,
  ClipboardCheck,
  Activity,
  HeartPulse,
  Brain,
  Baby,
  Apple,
  Dna,
  GraduationCap,
} from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { HEALTH_CATEGORIES } from "@/lib/healthCategories";
import { FeatureSnapshot } from "./components/landing/FeatureSnapshot";
import { LandingFaq } from "./components/landing/LandingFaq";

type FeaturedStudy = Prisma.StudyGetPayload<{
  include: { _count: { select: { responses: true; questions: true } } };
}>;

export default async function Home() {
  let stats: { totalUsers: number; activeStudies: number; totalResponses: number } | null = null;
  let featuredStudy: FeaturedStudy | null = null;

  try {
    const [users, active, responses, study] = await Promise.all([
      prisma.user.count(),
      prisma.study.count({ where: { status: "ACTIVE" } }),
      prisma.response.count(),
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
    };
    featuredStudy = study;
  } catch (err) {
    console.error("Could not load dynamic landing page stats:", err);
  }

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground overflow-x-hidden">
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-to-b from-emerald-50/70 via-background to-background pt-12 pb-14 dark:from-emerald-950/25 sm:pt-16 sm:pb-18 lg:pt-20 lg:pb-20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-40 h-[28rem] w-[28rem] rounded-full border border-emerald-900/[0.06] dark:border-emerald-100/[0.06]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-[20rem] w-[20rem] rounded-full border border-emerald-900/[0.06] dark:border-emerald-100/[0.06]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative z-10 space-y-6 sm:space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm dark:border-emerald-300/20 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Stethoscope className="h-4 w-4" />
                Medical & Health Research Ecosystem
              </div>

              <h1 className="max-w-2xl text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
                Advance health research.
                <br />
                <span className="text-emerald-700 dark:text-emerald-400">
                  Collect verified data.
                </span>
              </h1>

              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Have a health question to explore, or want to take part in a study? Tinat makes it easier for researchers and participants to connect.
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                <ButtonLink href="/researcher/studies/new" size="lg" className="group h-12 w-full rounded-xl px-6 text-sm font-semibold shadow-md shadow-emerald-900/10 sm:w-auto">
                  Create Health Study
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </ButtonLink>
                <ButtonLink href="/participant/studies" variant="outline" size="lg" className="h-12 w-full rounded-xl border-emerald-900/15 bg-background/70 px-6 text-sm font-semibold hover:bg-emerald-50 dark:border-emerald-100/20 dark:hover:bg-emerald-950/50 sm:w-auto">
                  Discover Studies
                </ButtonLink>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2.5 pt-1">
                {[
                  "Funded Research & Free Forms",
                  "Verified Participant Cohorts",
                  "Confidential & Coded Data",
                  "Tinat Credits (TC) Rewards",
                ].map((feature) => (
                  <span key={feature} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative z-10">
              <div className="rounded-2xl border border-emerald-900/10 bg-card/95 p-4 shadow-xl shadow-emerald-950/[0.06] sm:p-6 dark:border-emerald-100/10">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-400">
                      <Activity className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Live Platform Study
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Active &bull; Accepting Responses
                  </span>
                </div>

                {featuredStudy ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-700/15 bg-emerald-50/60 p-4 dark:bg-emerald-950/30 sm:p-5">
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
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed italic">
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

                    <ButtonLink href={`/participant/studies/${featuredStudy.id}`} variant="outline" size="sm" className="mt-1 w-full text-xs gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/30">
                      View & Participate in this Study <ArrowRight className="w-3.5 h-3.5" />
                    </ButtonLink>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-sm font-semibold text-foreground">No active studies currently</p>
                    <p className="text-xs text-muted-foreground">Be the first to publish a health study or survey.</p>
                    <ButtonLink href="/researcher/studies/new" size="sm" className="bg-emerald-600 text-white">Create Study</ButtonLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-emerald-950/[0.04] sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-bold text-foreground">Platform Activity & Scope</h2>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                &mdash; Real figures directly from Tinat&apos;s health research database
              </p>
            </div>
            <Link href="/participant/studies" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
              Browse Active Studies <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-5 pt-5 md:grid-cols-4 md:gap-6">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {stats?.activeStudies.toLocaleString() ?? "—"}
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">Active Studies</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Currently collecting data</p>
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-3xl">
                {stats?.totalResponses.toLocaleString() ?? "—"}
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">Responses</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Submitted across studies</p>
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {stats?.totalUsers.toLocaleString() ?? "—"}
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">Platform Members</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Researchers & participants</p>
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-3xl">
                {HEALTH_CATEGORIES.length}
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">Health Domains</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Epidemiology, clinical & public health</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Snapshot */}
      <FeatureSnapshot />

      {/* Two Study Pathways Section */}
      <section id="pathways" className="relative z-10 py-20 lg:py-28 bg-muted/20 border-b border-border scroll-mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-4 max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Two Research Pathways
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Designed for every health investigation
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Whether you have grant funding or need zero-cost data collection for class or community work, Tinat provides the infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
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
                  Ideal for academic dissertations, observational health surveys, epidemiologic cohorts, and institutional studies with grant budgets. Reward participants with Tinat Credits (TC) to achieve rapid sample sizes and high completion rates.
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
                    Instant automated credit reward upon verified response
                  </li>
                </ul>
              </div>
              <ButtonLink href="/researcher/studies/new" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Launch Funded Study
              </ButtonLink>
            </div>

            {/* Pathway 2: Free Data Collection */}
            <div className="rounded-2xl border-2 border-primary/30 bg-card p-8 shadow-lg relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary dark:text-teal-400">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-teal-400 bg-primary/10 px-3 py-1 rounded-full">
                    Zero Cost &bull; Direct Publish
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Free Data Collection</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Created for medical students, NGO field workers, healthcare organizations, and pilot questionnaire validation. Collect data freely from voluntary participants without requiring any funding or wallet balance.
                </p>
                <ul className="space-y-2.5 text-xs text-foreground/90 mb-8">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Zero cost to publish &mdash; no credit deposit required
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Full analytics, answer breakdowns, and Excel/CSV export
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Ideal for pilot testing, class assignments, and feedback
                  </li>
                </ul>
              </div>
              <ButtonLink href="/researcher/studies/new" variant="outline" className="w-full border-primary/40 text-foreground hover:bg-primary/10">
                Publish Free Health Form
              </ButtonLink>
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
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Medical & Health Research Disciplines
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Organized into standardized health categories to assist clinicians, students, and participants.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { category: "Public Health", icon: Activity, desc: "Population-level disease prevention and health outcomes." },
              { category: "Clinical Research", icon: Stethoscope, desc: "Patient-reported outcomes, lifestyle factors, and community surveys." },
              { category: "Epidemiology & Biostatistics", icon: HeartPulse, desc: "Disease incidence, determinants, and biostatistics." },
              { category: "Mental & Behavioral Health", icon: Brain, desc: "Psychological well-being, burnout, and behavioral studies." },
              { category: "Nutrition & Dietetics", icon: Apple, desc: "Dietary habits, micronutrient deficiencies, and lifestyle." },
              { category: "Maternal & Child Health", icon: Baby, desc: "Neonatal, pediatric, and reproductive health studies." },
              { category: "Infectious Diseases", icon: Dna, desc: "Viral, bacterial, and parasitic infection surveillance." },
              { category: "Medical Education & Training", icon: GraduationCap, desc: "Trainee assessments, clinical curricula, and exams." },
            ].map((domain) => (
              <Link
                key={domain.category}
                href={`/participant/studies?category=${encodeURIComponent(domain.category)}`}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-emerald-500/50 hover:-translate-y-0.5 shadow-sm"
              >
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <domain.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1 group-hover:text-emerald-600 transition-colors">
                  {domain.category}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {domain.desc}
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center pt-4">
            <ButtonLink href="/participant/studies" variant="outline" className="rounded-xl px-6">
              Explore All {HEALTH_CATEGORIES.length} Health Categories &rarr;
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <LandingFaq />
    </div>
  );
}
