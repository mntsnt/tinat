import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardCheck, Sparkles, Workflow, CheckCircle2 } from "lucide-react";
import { getModuleBySlug } from "@/lib/academy/content";
import { ButtonLink } from "@/app/components/ui/Button";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module) return { title: "Assignment Not Found | Tinat Academy" };

  return {
    title: `Practical Assignment: ${module.title} | Tinat Academy`,
    description: module.assignment?.overview || module.summary,
  };
}

export default async function AcademyAssignmentPage({ params }: Props) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module || !module.assignment) notFound();

  const assignment = module.assignment;

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/academy/${module.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Module Overview
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            MODULE {module.number} PRACTICAL ASSIGNMENT
          </span>
        </div>

        <div className="space-y-3 border-b border-border pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground m-0">
            {assignment.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {assignment.overview}
          </p>
        </div>

        {/* Scenario Card */}
        {assignment.scenario && (
          <div className="rounded-2xl border border-sky-600/30 bg-sky-50/60 dark:bg-sky-950/20 p-6 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-700 dark:text-sky-400">
              ETHIOPIAN CLINICAL &amp; FIELD SCENARIO
            </span>
            <p className="text-xs sm:text-sm text-sky-950 dark:text-sky-200 leading-relaxed m-0 whitespace-pre-line">
              {assignment.scenario}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground m-0 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            Assignment Instructions &amp; Step-by-Step Requirements
          </h3>
          <ul className="space-y-3 text-xs sm:text-sm text-foreground">
            {assignment.instructions.map((inst, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{inst}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Grading Rubric */}
        {assignment.rubric?.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground m-0">
              Evaluation Rubric (100 Points Total)
            </h3>
            <div className="divide-y divide-border">
              {assignment.rubric.map((r, i) => (
                <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                  <div>
                    <strong className="block text-foreground">{r.criterion}</strong>
                    <span className="text-muted-foreground text-xs">{r.description}</span>
                  </div>
                  <span className="shrink-0 font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                    {r.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Workspace Integration CTA */}
        <div className="rounded-2xl border-2 border-emerald-600/30 bg-emerald-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-foreground m-0 flex items-center gap-2">
              <Workflow className="h-5 w-5 text-emerald-600" />
              Complete in Tinat Research Workspace
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Collaborate with research peers, upload literature files, and draft your proposal protocol directly inside Tinat's dedicated workspace.
            </p>
          </div>
          <ButtonLink
            href="/projects/new"
            className="shrink-0 gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Open in Workspace <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
