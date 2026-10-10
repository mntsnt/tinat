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
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { HEALTH_CATEGORIES, MEDICAL_DISCLAIMER } from "@/lib/healthCategories";
import { prisma } from "@/lib/prisma";

type FeaturedStudy = Prisma.StudyGetPayload<{
  include: { _count: { select: { responses: true; questions: true } } };
}>;

export default async function Home() {
  let stats = {
    totalUsers: 13,
    activeStudies: 3,
    totalResponses: 8,
  };
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
    <div className="flex flex-col flex-1 overflow-x-hidden bg-background text-foreground">
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:py-24">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <Stethoscope className="h-4 w-4" />
                Health research, made more accessible
              </div>

              <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.65rem]">
                Advance health research.
                <span className="mt-2 block text-emerald-700 dark:text-emerald-400">
                  Collect better data.
                </span>
              </h1>

              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Tinat connects health researchers with participants and gives every study a clear path to collect meaningful data — funded or free.
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <Link href="/researcher/studies/new">
                  <Button size="lg" className="group h-12 w-full rounded-lg bg-emerald-700 px-6 text-sm text-white shadow-sm hover:bg-emerald-800 sm:w-auto dark:bg-emerald-600 dark:hover:bg-emerald-500">
                    Create a study
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/participant/studies">
                  <Button variant="outline" size="lg" className="h-12 w-full rounded-lg border-border px-6 text-sm sm:w-auto">
                    Explore studies
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                {[
                  "Funded and free studies",
                  "Verified participants",
                  "Privacy-conscious",
                ].map((feature) => (
                  <span key={feature} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Hero Study Preview - Live from DB */}
            <div className="hidden lg:block">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-muted p-1.5 text-foreground">
                      <Activity className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      A study on Tinat
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Accepting responses
                  </span>
                </div>

                {featuredStudy ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {featuredStudy.category || "Public Health & Clinical Research"}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {featuredStudy.rewardCredits > 0 ? `${featuredStudy.rewardCredits} TC Reward` : "Free Open Data"}
                        </span>
                      </div>
                      <p className="text-lg font-semibold leading-snug">
                        {featuredStudy.title}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {featuredStudy.objective || featuredStudy.description || "Healthcare research study collecting participant responses on Tinat."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border">
                      <div className="p-3 text-center">
                        <p className="text-lg font-semibold text-foreground">
                          {featuredStudy._count.responses}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Responses
                        </p>
                      </div>
                      <div className="p-3 text-center">
                        <p className="text-lg font-semibold text-foreground">
                          {featuredStudy._count.questions}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Questions
                        </p>
                      </div>
                      <div className="p-3 text-center">
                        <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                          ~{featuredStudy.estimatedMinutes || 5} min
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Est. Time
                        </p>
                      </div>
                    </div>

                    <Link href={`/participant/studies/${featuredStudy.id}`} className="block pt-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                        View this study <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 py-8 text-center">
                    <p className="text-sm font-semibold text-foreground">No active studies just yet</p>
                    <p className="text-xs text-muted-foreground">Be the first to publish a health study or survey.</p>
                    <Link href="/researcher/studies/new">
                      <Button size="sm" className="bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">Create a study</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
        </div>
      </section>

      {/* Live Platform Real-time Metrics Banner */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">The Tinat network</h2>
              <p className="mt-1 text-xs text-muted-foreground">A growing community for health research.</p>
            </div>
            <Link href="/participant/studies" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Browse studies <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-border">
            <div className="sm:px-5 sm:first:pl-0">
              <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {stats.activeStudies.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Active studies</p>
            </div>

            <div className="sm:px-5">
              <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {stats.totalResponses.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Responses collected</p>
            </div>

            <div className="sm:px-5">
              <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {stats.totalUsers.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Community members</p>
            </div>

            <div className="sm:px-5 sm:pr-0">
              <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {HEALTH_CATEGORIES.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Health domains</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Study Types Section */}
      <section id="pathways" className="scroll-mt-16 border-b border-border bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl space-y-3">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Flexible by design
            </span>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              One platform, two ways to do research
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Start with a funded study and participant rewards, or publish a free questionnaire for your class, clinic, or community.
            </p>
          </div>

          <div className="grid max-w-5xl gap-4 md:grid-cols-2">
            {/* Pathway 1: Funded Research */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 sm:p-7">
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div className="rounded-lg bg-muted p-2.5 text-foreground">
                    <Coins className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Participant rewards
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Funded health research</h3>
                <p className="mb-5 text-sm leading-6 text-muted-foreground">
                  Ideal for academic dissertations, clinical trials, epidemiologic cohorts, and institutional studies with grant budgets. Reward participants with Tinat Credits (TC) to achieve rapid sample sizes and high completion rates.
                </p>
                <ul className="mb-7 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    Custom reward per participant in Tinat Credits (TC)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    Targeted cohort demographics and participant capacity cap
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    Instant automated payout upon verified response
                  </li>
                </ul>
              </div>
              <Link href="/researcher/studies/new">
                <Button className="w-full rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                  Create a funded study
                </Button>
              </Link>
            </div>

            {/* Pathway 2: Free Data Collection */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 sm:p-7">
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div className="rounded-lg bg-muted p-2.5 text-foreground">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Always free
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Free data collection</h3>
                <p className="mb-5 text-sm leading-6 text-muted-foreground">
                  Created for medical students, NGO field workers, healthcare organizations, and pilot questionnaire validation. Collect data freely from voluntary participants without requiring any funding or wallet balance.
                </p>
                <ul className="mb-7 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    Zero cost to publish &mdash; no credit deposit required
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    Full analytics, answer breakdowns, and Excel/CSV export
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    Ideal for pilot testing, class assignments, and feedback
                  </li>
                </ul>
              </div>
              <Link href="/researcher/studies/new">
                <Button variant="outline" className="w-full rounded-lg">
                  Publish a free form
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Health Domains Showcase */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-9 px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Explore by topic
            </span>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Research across health disciplines
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Find studies in the areas that matter to you, from public health and epidemiology to medical education.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-emerald-700/40 hover:bg-muted/30 sm:p-5"
              >
                <div className="mb-3 w-fit rounded-md bg-muted p-2 text-muted-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                  <domain.icon className="h-4 w-4" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">
                  {domain.name}
                </h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  {domain.desc}
                </p>
              </Link>
            ))}
          </div>

          <div className="pt-1">
            <Link href="/participant/studies">
              <Button variant="outline" className="rounded-lg">
                Explore all health categories <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Academic Governance */}
      <section className="border-t border-border bg-muted/20 py-12 sm:py-14">
        <div className="mx-auto max-w-4xl space-y-4 px-5 sm:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            Academic integrity and research protocols
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Built for Academic Health Institutions, Hospitals & NGOs
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {MEDICAL_DISCLAIMER} Tinat facilitates participant recruitment, questionnaire design, and data organization under researcher-directed protocols.
          </p>
        </div>
      </section>
    </div>
  );
}
