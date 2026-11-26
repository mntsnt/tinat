import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  HelpCircle,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { ButtonLink } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { getModuleBySlug, getAllModules } from "@/lib/academy/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllModules().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module) return { title: "Module Not Found | Tinat Academy" };

  return {
    title: `Module ${module.number}: ${module.title} | Tinat Academy`,
    description: module.summary,
  };
}

export default async function AcademyModuleOverviewPage({ params }: Props) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module) notFound();

  const firstLesson = module.lessons[0];

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/academy"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Academy Catalog
          </Link>
        </div>

        {/* Hero Header */}
        <div className="border-b border-border pb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="uppercase font-bold tracking-wider text-[10px]">
              {module.pathId} PATHWAY
            </Badge>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              MODULE {module.number}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {module.duration}
            </span>
            {module.status === "needs academic review" && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                Needs Academic Review
              </Badge>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {module.title}
          </h1>
          <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
            {module.summary}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {firstLesson && (
              <ButtonLink
                href={`/academy/${module.slug}/${firstLesson.slug}`}
                size="lg"
                className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                Start Module <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            )}
            <ButtonLink
              href={`/academy/${module.slug}/quiz`}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              Take Assessment ({module.quiz?.questionBank?.length || 0} Questions)
            </ButtonLink>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main 2-Col: Syllabus & Objectives */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Objectives */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">What You Will Learn (Objectives)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {module.learningObjectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="leading-relaxed">{obj}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Interactive Syllabus */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Curriculum Syllabus ({module.lessons.length} Lessons)</CardTitle>
                  <span className="text-xs text-muted-foreground font-semibold">Self-Paced</span>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0">
                {module.lessons.map((lesson) => (
                  <Link
                    key={lesson.slug}
                    href={`/academy/${module.slug}/${lesson.slug}`}
                    className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50 group"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          {lesson.orderIndex}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors m-0">
                          {lesson.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 pl-7">
                        {lesson.learningObjectives?.[0] || "Methodology lesson with worked examples"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        {lesson.readingTimeMinutes} min
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Practical Assignment Card */}
            {module.assignment && (
              <Card className="border-sky-600/30 bg-sky-500/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                    <ClipboardCheck className="h-4 w-4" /> Practical Assignment
                  </div>
                  <CardTitle className="text-base text-foreground mt-1">
                    {module.assignment.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {module.assignment.overview}
                  </p>
                  <ButtonLink
                    href={`/academy/${module.slug}/assignment`}
                    size="sm"
                    className="gap-2 bg-sky-700 hover:bg-sky-800 text-white"
                  >
                    View Assignment Brief <ArrowRight className="h-3.5 w-3.5" />
                  </ButtonLink>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar: Prerequisites, Resources, Glossary */}
          <div className="space-y-6">
            {/* Prerequisites */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Prerequisites &amp; Audience</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                {module.prerequisites.map((p, i) => (
                  <p key={i} className="m-0">• {p}</p>
                ))}
              </CardContent>
            </Card>

            {/* Recommended Resources */}
            {module.resources?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    Recommended Literature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {module.resources.map((res, i) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border border-border p-3 text-xs transition-colors hover:border-emerald-500/50 hover:bg-muted/40 group"
                    >
                      <div className="font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 flex items-center justify-between">
                        <span className="truncate">{res.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {res.description}
                      </p>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Glossary Terms */}
            {module.glossary?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Key Glossary Terms</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {module.glossary.map((term, i) => (
                    <div key={i} className="py-2.5 text-xs">
                      <strong className="block text-foreground">{term.term}</strong>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">{term.definition}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
