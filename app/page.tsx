import Link from "next/link";
import Image from "next/image";
import { ButtonLink } from "./components/ui/Button";
import {
  ArrowRight,
  Stethoscope,
  Coins,
  Activity,
  HeartPulse,
  Brain,
  Baby,
  Apple,
  Dna,
  GraduationCap,
  MapPin,
  CheckCircle2,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { HEALTH_CATEGORIES } from "@/lib/healthCategories";
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
      prisma.study.count({ where: { status: "ACTIVE", isPrivate: false } }),
      prisma.response.count(),
      prisma.study.findFirst({
        where: { status: "ACTIVE", isPrivate: false },
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
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-to-b from-emerald-50/60 via-background to-background pt-12 pb-14 dark:from-emerald-950/20 sm:pt-16 sm:pb-18 lg:pt-20 lg:pb-20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-40 h-[28rem] w-[28rem] rounded-full border border-emerald-900/[0.06] dark:border-emerald-100/[0.06]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-[20rem] w-[20rem] rounded-full border border-emerald-900/[0.06] dark:border-emerald-100/[0.06]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Left Column: Core Value Proposition */}
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-300/20 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Stethoscope className="h-3.5 w-3.5" />
                Health Research &amp; Data Collection
              </div>

              <h1 className="max-w-xl text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl text-foreground">
                Publish health studies.
                <br />
                <span className="text-emerald-700 dark:text-emerald-400">
                  Collect reliable data.
                </span>
              </h1>

              <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Run health surveys with verified participants across Ethiopia. Collect data online or in the field.
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                <ButtonLink
                  href="/researcher/studies/new"
                  size="lg"
                  className="group h-12 w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 px-6 text-sm font-semibold shadow-md shadow-emerald-900/10 sm:w-auto dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  Publish a Study
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </ButtonLink>
                <ButtonLink
                  href="/participant/studies"
                  variant="outline"
                  size="lg"
                  className="h-12 w-full rounded-xl border-border bg-card px-6 text-sm font-semibold hover:bg-muted sm:w-auto"
                >
                  Browse Studies
                </ButtonLink>
              </div>

              {/* Feature List (Screenshot list with ScholarXIV removed, simplified to plain English) */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
                {[
                  "Platform-Determined TC Rewards",
                  "Ground Field Enumerators (ETB)",
                  "Collaborative Workspaces & Kanban",
                  "Independent Tinat Forms",
                  "Coded & Confidential Data",
                ].map((feature) => (
                  <span key={feature} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Column: Active Study Snapshot */}
            <div className="relative z-10">
              <div className="rounded-2xl border border-emerald-900/10 bg-card p-5 shadow-xl shadow-emerald-950/[0.05] sm:p-6 dark:border-emerald-100/10">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-400">
                      <Activity className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Live Study on Tinat
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Active &bull; Accepting Responses
                  </span>
                </div>

                {/* Visual Research Context Banner */}
                <div className="relative h-36 sm:h-40 w-full overflow-hidden rounded-xl mb-4 border border-border/80 shadow-2xs">
                  <Image
                    src="/researcher-hero.jpg"
                    alt="Clinical researcher reviewing epidemiological health data"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 550px"
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white pointer-events-none">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-emerald-700/90 backdrop-blur-xs px-2.5 py-0.5 rounded shadow-2xs">
                      {featuredStudy?.category || "Medical Research"}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-medium bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10">
                      Verified Health Science
                    </span>
                  </div>
                </div>

                {featuredStudy ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-700/15 bg-emerald-50/50 p-4 dark:bg-emerald-950/20 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          {featuredStudy.category || "Public Health"}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {featuredStudy.rewardCredits > 0 ? `${featuredStudy.rewardCredits} Credits` : "Open Data"}
                        </span>
                      </div>
                      <p className="text-base font-semibold leading-snug text-foreground">
                        {featuredStudy.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {featuredStudy.objective || featuredStudy.description || "Healthcare research study collecting participant responses on Tinat."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                        <p className="text-xl font-bold text-foreground">
                          {featuredStudy._count.responses}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          Responses
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                        <p className="text-xl font-bold text-foreground">
                          {featuredStudy._count.questions}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          Questions
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                          ~{featuredStudy.estimatedMinutes || 5} min
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          Est. Time
                        </p>
                      </div>
                    </div>

                    <ButtonLink
                      href={`/participant/studies/${featuredStudy.id}`}
                      variant="outline"
                      size="sm"
                      className="mt-1 w-full text-xs gap-1.5 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 dark:hover:bg-emerald-950/30"
                    >
                      View &amp; Answer Questionnaire <ArrowRight className="w-3.5 h-3.5" />
                    </ButtonLink>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-sm font-semibold text-foreground">No active studies currently</p>
                    <p className="text-xs text-muted-foreground">Be the first to publish a health questionnaire.</p>
                    <ButtonLink href="/researcher/studies/new" size="sm" className="bg-emerald-700 text-white">
                      Create Study
                    </ButtonLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Activity Stats */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {stats?.activeStudies.toLocaleString() ?? "—"}
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">Active Studies</p>
              <p className="text-[11px] text-muted-foreground">Collecting responses right now</p>
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-3xl">
                {stats?.totalResponses.toLocaleString() ?? "—"}
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">Responses Submitted</p>
              <p className="text-[11px] text-muted-foreground">Across all health questionnaires</p>
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {stats?.totalUsers.toLocaleString() ?? "—"}
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">Members</p>
              <p className="text-[11px] text-muted-foreground">Researchers &amp; participants</p>
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-3xl">
                {HEALTH_CATEGORIES.length}
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">Health Disciplines</p>
              <p className="text-[11px] text-muted-foreground">From epidemiology to clinical care</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works for Researchers (3 Clean Steps without individual deck links) */}
      <section id="how-it-works" className="relative z-10 py-14 lg:py-18 bg-background border-b border-border scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              For Researchers
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              How it works
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Publish a study, gather responses, and download your data in three steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Build your questionnaire</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Add multiple choice, rating scales, or short answers. Write questions in English, Amharic, Afaan Oromo, Tigrinya, or Somali.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Collect responses</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Reach online participants who earn platform credits, or assign local enumerators to conduct in-person interviews for cash (ETB).
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Download clean data</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Export your results anytime in Excel or CSV format with coded answers, ready to open in SPSS, Stata, R, or Excel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Study Pathways Section */}
      <section id="pathways" className="relative z-10 py-16 lg:py-20 bg-muted/20 border-b border-border scroll-mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Data Collection Modes
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Two ways to collect data
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Choose digital surveys for online participants or field collection for community interviews.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pathway 1: Digital Surveys */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="relative h-48 w-full rounded-xl overflow-hidden mb-6 border border-border/80 group">
                  <Image
                    src="/participant-study.jpg"
                    alt="Ethiopian participant answering health questionnaire on smartphone"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-emerald-700/90 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-2xs">
                      Online Participants
                    </span>
                    <span className="text-[11px] font-medium text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded">
                      Self-Administered
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    Online Participants
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Digital Surveys</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Best for surveys, academic theses, and clinical questionnaires answered on phones or computers.
                </p>
                <ul className="space-y-3 text-xs text-muted-foreground mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Free to publish &mdash; no credit deposits or platform fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Participants earn platform credits automatically for their time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Target by age, gender, or region to reach the participants you need</span>
                  </li>
                </ul>
              </div>
              <ButtonLink
                href="/researcher/studies/new"
                className="w-full bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                Publish Online Study
              </ButtonLink>
            </div>

            {/* Pathway 2: Field Data Collection */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="relative h-48 w-full rounded-xl overflow-hidden mb-6 border border-border/80 group">
                  <Image
                    src="/field-collector.jpg"
                    alt="Field enumerator conducting health survey in community"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-emerald-700/90 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-2xs">
                      Field Enumerators
                    </span>
                    <span className="text-[11px] font-medium text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded">
                      In-Person &bull; Community Field
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    Field Enumerators &bull; Paid in ETB
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Field Data Collection</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Best for clinics, health posts, and communities where participants don&apos;t have smartphones or internet.
                </p>
                <ul className="space-y-3 text-xs text-muted-foreground mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Assign trained enumerators to interview people face-to-face in local languages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Enumerators earn cash compensation in Ethiopian Birr (ETB)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Supports verbal consent recording directly on mobile</span>
                  </li>
                </ul>
              </div>
              <ButtonLink
                href="/researcher/studies/new"
                variant="outline"
                className="w-full hover:bg-muted"
              >
                Create Field Study
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Health Categories (Clean visual chips with just 1 link at the bottom) */}
      <section id="disciplines" className="relative z-10 py-14 lg:py-18 bg-background border-b border-border scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Disciplines
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Health &amp; medical fields
            </h2>
            <p className="text-muted-foreground text-sm">
              Studies organized by standard health categories.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { category: "Public Health", icon: Activity },
              { category: "Clinical Research", icon: Stethoscope },
              { category: "Epidemiology & Biostatistics", icon: HeartPulse },
              { category: "Mental & Behavioral Health", icon: Brain },
              { category: "Nutrition & Dietetics", icon: Apple },
              { category: "Maternal & Child Health", icon: Baby },
              { category: "Infectious Diseases", icon: Dna },
              { category: "Medical Education & Training", icon: GraduationCap },
            ].map((domain) => (
              <div
                key={domain.category}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
                  <domain.icon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-foreground">
                  {domain.category}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/participant/studies"
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              Browse all {HEALTH_CATEGORIES.length} health categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <LandingFaq />

      {/* Final Call to Action */}
      <section className="relative z-10 py-16 lg:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
            <div className="grid lg:grid-cols-12 items-center">
              <div className="p-8 sm:p-12 lg:col-span-7 space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <Users className="h-3.5 w-3.5" />
                  Ethiopian Medical &amp; Public Health Community
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                  Ready to publish your study?
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl">
                  Create questionnaires with skip logic and rosters, gather responses from verified participants across Ethiopia, or deploy field enumerators with direct Birr (ETB) compensation.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <ButtonLink
                    href="/researcher/studies/new"
                    size="lg"
                    className="h-12 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 px-6 font-semibold dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-md shadow-emerald-900/10 text-center justify-center"
                  >
                    Publish a Study
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </ButtonLink>
                  <ButtonLink
                    href="/participant/studies"
                    variant="outline"
                    size="lg"
                    className="h-12 rounded-xl border-border bg-card px-6 font-semibold hover:bg-muted text-center justify-center"
                  >
                    Browse Active Studies
                  </ButtonLink>
                </div>
              </div>
              <div className="relative h-64 sm:h-80 lg:h-full lg:min-h-[380px] lg:col-span-5 overflow-hidden">
                <Image
                  src="/collaborative-team.jpg"
                  alt="Ethiopian medical researchers and public health collaborators"
                  fill
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-card via-card/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
