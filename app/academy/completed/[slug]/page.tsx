import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { getModuleBySlug, getAllModules, academyModulesData } from "@/lib/academy/content";
import { AcademyPageFrame } from "../../components/AcademyPageFrame";

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
    title: `Completed: ${mod.title} | Tinat Academy`,
    description: `Review the learning objectives and continue to the next module.`,
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
    <AcademyPageFrame
      backLink={{ href: "/academy", label: "All courses" }}
      eyebrow={`Module ${currentModule.number} · Complete`}
      title="Module complete"
      description={currentModule.title}
      contentClassName="max-w-4xl space-y-8"
    >
      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Learning objectives</h2>
        <Card>
          <CardContent className="divide-y divide-border">
            {currentModule.learningObjectives.map((objective) => (
              <div key={objective} className="flex items-start gap-3 py-3 text-sm leading-6">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{objective}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Continue learning</h2>
        {nextModule ? (
          <div className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-muted-foreground">Next module · Module {nextModule.number}</p>
              <h3 className="mt-1 text-base font-semibold">{nextModule.title}</h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{nextModule.summary}</p>
            </div>
            <ButtonLink href={`/academy/${nextModule.slug}`} className="shrink-0 gap-2">
              View module <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-semibold">Ready for the research proposal capstone?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Apply your learning with a structured proposal checklist.
              </p>
            </div>
            <ButtonLink href="/academy/capstone" className="shrink-0 gap-2">
              View capstone <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        )}
      </section>
    </AcademyPageFrame>
  );
}
