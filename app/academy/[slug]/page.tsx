import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  ClipboardCheck,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { ButtonLink } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { getModuleBySlug, getAllModules } from "@/lib/academy/content";
import { AcademyPageFrame } from "../components/AcademyPageFrame";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllModules().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const academyModule = getModuleBySlug(slug);
  if (!academyModule) return { title: "Module Not Found | Tinat Academy" };

  return {
    title: `Module ${academyModule.number}: ${academyModule.title} | Tinat Academy`,
    description: academyModule.summary,
  };
}

export default async function AcademyModuleOverviewPage({ params }: Props) {
  const { slug } = await params;
  const academyModule = getModuleBySlug(slug);
  if (!academyModule) notFound();

  const firstLesson = academyModule.lessons[0];

  return (
    <AcademyPageFrame
      backLink={{ href: "/academy", label: "All courses" }}
      eyebrow={
        <span className="flex flex-wrap items-center gap-2">
          <span className="capitalize">{academyModule.pathId} pathway</span>
          <span aria-hidden="true">·</span>
          <span>Module {academyModule.number}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {academyModule.duration}
          </span>
          {academyModule.status === "needs academic review" && (
            <Badge variant="outline" className="text-xs font-normal">
              Academic review pending
            </Badge>
          )}
        </span>
      }
      title={academyModule.title}
      description={academyModule.summary}
      actions={
        <>
          {firstLesson && (
            <ButtonLink href={`/academy/${academyModule.slug}/${firstLesson.slug}`} size="md">
              Start learning <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
          )}
          <ButtonLink href={`/academy/${academyModule.slug}/quiz`} variant="outline" size="md">
            Take assessment
          </ButtonLink>
        </>
      }
    >
      {academyModule.coverImage && (
        <div className="relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-xl border border-border bg-muted shadow-xs sm:aspect-[24/9]">
          <img
            src={academyModule.coverImage}
            alt={academyModule.title}
            className="h-full w-full object-cover object-center"
          />
        </div>
      )}
      <div className="grid min-w-0 grid-cols-1 gap-6 @4xl:grid-cols-3">
          {/* Main 2-Col: Syllabus & Objectives */}
          <div className="min-w-0 space-y-6 @4xl:col-span-2">
            {/* Learning Objectives */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Learning objectives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {academyModule.learningObjectives.map((obj, i) => (
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
                  <CardTitle className="text-base">Lessons ({academyModule.lessons.length})</CardTitle>
                  <span className="text-sm text-muted-foreground">Self-paced</span>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0">
                {academyModule.lessons.map((lesson) => (
                  <Link
                    key={lesson.slug}
                    href={`/academy/${academyModule.slug}/${lesson.slug}`}
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
            {academyModule.assignment && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ClipboardCheck className="h-4 w-4" /> Practical assignment
                  </div>
                  <CardTitle className="text-base text-foreground mt-1">
                    {academyModule.assignment.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {academyModule.assignment.overview}
                  </p>
                  <ButtonLink
                    href={`/academy/${academyModule.slug}/assignment`}
                    size="sm"
                    variant="outline"
                    className="gap-2"
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
                {academyModule.prerequisites.map((p, i) => (
                  <p key={i} className="m-0">• {p}</p>
                ))}
              </CardContent>
            </Card>

            {/* Recommended Resources */}
            {academyModule.resources?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    Recommended Literature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {academyModule.resources.map((res, i) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block rounded-md border border-border p-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <div className="font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 flex items-center justify-between">
                        <span className="truncate">{res.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {res.description}
                      </p>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Glossary Terms */}
            {academyModule.glossary?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Key Glossary Terms</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {academyModule.glossary.map((term, i) => (
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
    </AcademyPageFrame>
  );
}
