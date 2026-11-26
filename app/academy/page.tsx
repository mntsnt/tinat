import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Layers3, Calculator, Award, Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { ButtonLink } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { academyModulesData, learningPaths } from "@/lib/academy/content";
import { AcademyCatalogClient } from "./components/AcademyCatalogClient";

export const metadata: Metadata = {
  title: "Tinat Academy | Health & Public-Health Research Education",
  description:
    "An immersive, open-access research academy teaching health and public-health research methodology, biostatistics, epidemiology, and academic reporting in Ethiopia and Africa.",
};

export default function AcademyPage() {
  const totalLessons = academyModulesData.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 px-4 py-16 text-white md:px-8 md:py-24">
        {/* Subtle decorative grid/glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/20 text-emerald-300 font-semibold px-3 py-1 text-xs">
              TINAT ACADEMY
            </Badge>
            <span className="text-xs text-emerald-200/70 font-medium">
              Free & Open-Access Research Education
            </span>
          </div>

          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            Learn to design, conduct, and publish credible health research.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-emerald-100/80 sm:text-lg">
            A comprehensive, practice-first learning environment for medical, public-health, and clinical researchers in Ethiopia and across Africa. Built with integrated sample size calculators, statistical engines, and research workspace tools.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="#catalog" className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40">
              Explore Curriculum <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/academy/capstone" variant="secondary" className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Sparkles className="h-4 w-4 text-emerald-300" /> Research Proposal Capstone
            </ButtonLink>
            <ButtonLink href="/projects" variant="ghost" className="gap-2 text-white/90 hover:text-white hover:bg-white/10">
              Open Workspace
            </ButtonLink>
          </div>

          {/* Quick Stats Pill Strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 pt-8 text-white/90">
            <div>
              <p className="text-2xl font-bold tracking-tight text-white">{academyModulesData.length} Modules</p>
              <p className="text-xs text-emerald-200/70">Beginner to Advanced pathways</p>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-white">{totalLessons}+ Lessons</p>
              <p className="text-xs text-emerald-200/70">With worked Ethiopian examples</p>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-white">100% Free</p>
              <p className="text-xs text-emerald-200/70">No sign-in required to learn</p>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-white">Interactive</p>
              <p className="text-xs text-emerald-200/70">Server-graded feedback & quizzes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex items-start gap-3 p-5">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Interactive Research Calculators</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Run sample size formulas and statistical analyses directly inside lessons with prefilled parameters.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex items-start gap-3 p-5">
              <div className="rounded-lg bg-teal-500/10 p-2 text-teal-600 dark:text-teal-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">African & Ethiopian Context</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Realistic case studies in antenatal care, malaria transmission, tuberculosis adherence, and malnutrition.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex items-start gap-3 p-5">
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-600 dark:text-cyan-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Comprehensive Feedback</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Immediate feedback with detailed rationale for every option, mistake reviews, and milestone progress.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Interactive Catalog */}
      <main id="catalog" className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <AcademyCatalogClient paths={learningPaths} modules={academyModulesData} />
      </main>

      {/* Capstone Proposal Banner */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 p-8 sm:p-10 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-3 text-xs">
                HANDS-ON CAPSTONE
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Develop Your Own Real Research Proposal
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Apply everything you have learned: from drafting PICO research questions and conceptual frameworks to calculating statistical power and designing ethical informed consent forms.
              </p>
            </div>
            <ButtonLink
              href="/academy/capstone"
              className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5"
            >
              Start Capstone Project <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
