import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Layers3 } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { ButtonLink } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { academyModules } from "./academyData";

export const metadata: Metadata = {
  title: "Tinat Academy | Medical and Public-Health Research",
  description: "Practice-first research education for students and researchers.",
};

export default function AcademyPage() {
  const stages = ["Foundation", "Methods", "Practice", "Advanced"] as const;

  return (
    <div className="w-full">
      <section className="border-b border-border bg-gradient-to-br from-cyan-950 via-slate-950 to-emerald-950 px-4 py-14 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Badge variant="secondary" className="mb-5 border-white/20 bg-white/10 text-white">
            TINAT ACADEMY
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Learn to conduct credible health research.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-cyan-50/85 md:text-lg">
            Beginner-friendly lessons, realistic assignments and practical tools for medical, public-health and social-health research.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#curriculum" className="gap-2">
              Start the curriculum <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/projects" variant="secondary" className="gap-2">
              Open Research Workspace
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <GraduationCap className="mt-0.5 h-5 w-5 text-primary" />
              <div><p className="font-semibold">18 structured modules</p><p className="mt-1 text-sm text-muted-foreground">A complete learning pathway.</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Layers3 className="mt-0.5 h-5 w-5 text-primary" />
              <div><p className="font-semibold">Practice-led exercises</p><p className="mt-1 text-sm text-muted-foreground">Calculators, datasets and field tools.</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <BookOpen className="mt-0.5 h-5 w-5 text-primary" />
              <div><p className="font-semibold">Verified sources</p><p className="mt-1 text-sm text-muted-foreground">WHO, CDC, Cochrane and EQUATOR.</p></div>
            </CardContent>
          </Card>
        </div>

        <div id="curriculum" className="mt-12">
          {stages.map((stage) => {
            const modules = academyModules.filter((module) => module.stage === stage);
            return (
              <section key={stage} className="mb-10">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{stage}</p>
                    <h2 className="mt-1 text-2xl font-bold">{stage === "Foundation" ? "Begin with the essentials" : `${stage} pathway`}</h2>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {modules.map((module) => (
                    <Link key={module.slug} href={`/academy/${module.slug}`} className="group">
                      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md">
                        <CardHeader className="pb-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-primary">MODULE {module.number}</span>
                            <span className="text-xs text-muted-foreground">{module.duration}</span>
                          </div>
                          <CardTitle className="text-base leading-snug">{module.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-6 text-muted-foreground">{module.summary}</p>
                          <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-foreground">
                            Open module <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
