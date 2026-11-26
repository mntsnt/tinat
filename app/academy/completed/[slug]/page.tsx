import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FolderPlus,
  BookOpen,
  Calculator,
  Compass,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { ButtonLink } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { getModuleBySlug, getAllModules, academyModulesData } from "@/lib/academy/content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllModules().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mod = getModuleBySlug(slug);
  if (!mod) return { title: "Completion | Tinat Academy" };

  return {
    title: `Congratulations on Completing ${mod.title}! | Tinat Academy`,
    description: `Celebratory completion overview and next research steps for ${mod.title}.`,
  };
}

export default async function ModuleCompletedPage({ params }: Props) {
  const { slug } = await params;
  const currentModule = getModuleBySlug(slug);

  if (!currentModule) {
    notFound();
  }

  // Find next module in sequence
  const currentIndex = academyModulesData.findIndex((m) => m.slug === slug);
  const nextModule = currentIndex >= 0 && currentIndex < academyModulesData.length - 1
    ? academyModulesData[currentIndex + 1]
    : null;

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/academy"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Academy Catalog
          </Link>
        </div>

        {/* Hero Celebration Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-8 sm:p-12 text-white shadow-2xl text-center space-y-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent pointer-events-none" />

          {/* Floating celebratory trophy */}
          <div className="relative flex justify-center">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl ring-8 ring-emerald-500/20">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-amber-300" />
            </div>
          </div>

          <div className="relative space-y-3">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-3 py-1 font-semibold">
              MODULE {currentModule.number} COMPLETE
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Outstanding Work!
            </h1>
            <p className="mx-auto max-w-xl text-base sm:text-lg text-emerald-100/80 leading-relaxed">
              You have thoroughly explored the lessons, worked examples, and assessment for:
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-emerald-400">
              {currentModule.title}
            </h2>
          </div>

          {/* Quick Stats Strip */}
          <div className="relative mx-auto max-w-lg grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-white/10 pt-6 text-xs">
            <div>
              <p className="text-lg font-bold text-white">{currentModule.lessons.length} Lessons</p>
              <p className="text-emerald-200/70">Mastered</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{currentModule.quiz?.questionBank?.length || 0} Questions</p>
              <p className="text-emerald-200/70">Practiced</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-lg font-bold text-white">100% Free</p>
              <p className="text-emerald-200/70">Knowledge Gained</p>
            </div>
          </div>
        </div>

        {/* Competencies Mastered */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              What You Have Accomplished
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              By completing this module, you have gained practical, evidence-based research competencies aligned with international standards (WHO, EQUATOR, Cochrane) and tailored for health challenges in Ethiopia and Africa:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentModule.learningObjectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs sm:text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-foreground leading-relaxed">{obj}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Practical Application in Tinat Workspace */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-card to-teal-950/20 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <FolderPlus className="h-4 w-4" /> Practical Application
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Put Your New Knowledge to Work in Tinat Workspace
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Don't let your learning stay theoretical. Open a project in the Tinat Research Workspace to organize literature, formulate research objectives, execute sample size calculations, and collaborate with your study team.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <ButtonLink
              href="/projects/new"
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm"
            >
              <FolderPlus className="h-4 w-4" /> Initialize Project in Workspace
            </ButtonLink>
            {currentModule.assignment && (
              <ButtonLink
                href={`/academy/${currentModule.slug}/assignment`}
                variant="outline"
                className="gap-2 text-xs sm:text-sm"
              >
                Review Module Assignment Brief
              </ButtonLink>
            )}
          </div>
        </div>

        {/* Next Learning Steps */}
        <div className="border-t border-border pt-8 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Next Up on Your Research Path</h3>

          {nextModule ? (
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-emerald-600/40 transition-colors">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  NEXT MODULE • MODULE {nextModule.number}
                </span>
                <h4 className="text-lg font-bold text-foreground">
                  {nextModule.title}
                </h4>
                <p className="text-xs text-muted-foreground max-w-xl line-clamp-2">
                  {nextModule.summary}
                </p>
              </div>
              <ButtonLink
                href={`/academy/${nextModule.slug}`}
                className="shrink-0 gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                Start Next Module <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase">CAPSTONE READY</span>
                <h4 className="text-lg font-bold text-foreground mt-0.5">
                  Ready for the Guided Research Proposal Capstone
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  You have completed the core modules! Draft your complete IRB-ready study proposal now.
                </p>
              </div>
              <ButtonLink
                href="/academy/capstone"
                className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Open Capstone Blueprint <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Link
              href="/academy"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Return to Academy Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
