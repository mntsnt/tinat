import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ClipboardCheck, Workflow } from "lucide-react";
import { getModuleBySlug } from "@/lib/academy/content";
import { ButtonLink } from "@/app/components/ui/Button";
import { AcademyPageFrame } from "../../components/AcademyPageFrame";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const academyModule = getModuleBySlug(slug);
  if (!academyModule) return { title: "Assignment Not Found | Tinat Academy" };

  return {
    title: `Practical Assignment: ${academyModule.title} | Tinat Academy`,
    description: academyModule.assignment?.overview || academyModule.summary,
  };
}

export default async function AcademyAssignmentPage({ params }: Props) {
  const { slug } = await params;
  const academyModule = getModuleBySlug(slug);
  if (!academyModule || !academyModule.assignment) notFound();

  const assignment = academyModule.assignment;

  return (
    <AcademyPageFrame
      backLink={{ href: `/academy/${academyModule.slug}`, label: "Back to module" }}
      eyebrow={`Module ${academyModule.number} · Practical assignment`}
      title={assignment.title}
      description={assignment.overview}
      contentClassName="max-w-4xl space-y-6"
    >
        {/* Scenario Card */}
        {assignment.scenario && (
          <div className="space-y-2 rounded-md border border-border bg-card p-5">
            <span className="text-sm font-semibold text-foreground">
              Scenario
            </span>
            <p className="m-0 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {assignment.scenario}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-4 rounded-md border border-border bg-card p-5">
          <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-foreground">
            <ClipboardCheck className="h-5 w-5" />
            Instructions
          </h2>
          <ul className="space-y-3 text-sm text-foreground">
            {assignment.instructions.map((inst, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-6">{inst}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Grading Rubric */}
        {assignment.rubric?.length > 0 && (
          <div className="space-y-4 rounded-md border border-border bg-card p-5">
            <h2 className="m-0 text-base font-semibold text-foreground">Evaluation rubric</h2>
            <div className="divide-y divide-border">
              {assignment.rubric.map((r, i) => (
                <div key={i} className="flex flex-col justify-between gap-2 py-3 text-sm sm:flex-row sm:items-center">
                  <div>
                    <strong className="block font-medium text-foreground">{r.criterion}</strong>
                    <span className="text-muted-foreground">{r.description}</span>
                  </div>
                  <span className="shrink-0 text-muted-foreground">{r.points} points</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Workspace Integration CTA */}
        <div className="flex flex-col justify-between gap-4 rounded-md border border-border p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-foreground">
              <Workflow className="h-5 w-5" />
              Use the research workspace
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Draft and organize your work in a Tinat research project.
            </p>
          </div>
          <ButtonLink
            href="/projects/new"
            variant="outline"
            className="shrink-0 gap-2"
          >
            Open workspace <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
    </AcademyPageFrame>
  );
}
