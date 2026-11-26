import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { academyModules } from "../academyData";
import { AcademyLecture } from "../AcademyLecture";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return academyModules.map((academyModule) => ({ slug: academyModule.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const academyModule = academyModules.find((item) => item.slug === slug);
  if (!academyModule) return { title: "Module not found | Tinat Academy" };
  return {
    title: `${academyModule.title} | Tinat Academy`,
    description: academyModule.summary,
  };
}

export default async function AcademyModulePage({ params }: Props) {
  const { slug } = await params;
  const academyModule = academyModules.find((item) => item.slug === slug);
  if (!academyModule) notFound();

  const previous = academyModules.find((item) => item.number === academyModule.number - 1);
  const next = academyModules.find((item) => item.number === academyModule.number + 1);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <Link href="/academy" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Academy
      </Link>

      <div className="mt-7 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{academyModule.stage}</Badge>
          <span className="text-xs font-bold text-primary">MODULE {academyModule.number}</span>
          <span className="text-xs text-muted-foreground">{academyModule.duration}</span>
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">{academyModule.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{academyModule.summary}</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Learning objectives</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {academyModule.objectives.map((objective) => (
                <div key={objective} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{objective}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Interactive lecture</CardTitle></CardHeader>
            <CardContent>
              <AcademyLecture academyModule={academyModule} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /> Practical assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6">{academyModule.assignment}</p>
              <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground"><strong className="text-foreground">Assessment:</strong> {academyModule.assessment}</p>
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card className="sticky top-20">
            <CardHeader><CardTitle className="text-base">Recommended resources</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {academyModule.resources.map((resource) => (
                resource.href.startsWith("http") ? (
                  <a
                    key={resource.title}
                    href={resource.href}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-muted"
                  >
                    {resource.title}
                  </a>
                ) : (
                  <Link key={resource.title} href={resource.href} className="block rounded-md border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-muted">
                    {resource.title}
                  </Link>
                )
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
        {previous ? (
          <ButtonLink href={`/academy/${previous.slug}`} variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Previous
          </ButtonLink>
        ) : <span />}
        {next ? (
          <ButtonLink href={`/academy/${next.slug}`} className="gap-2">
            Next module <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        ) : (
          <ButtonLink href="/projects" className="gap-2">
            Start a research project <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
