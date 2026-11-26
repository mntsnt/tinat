import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { getModuleBySlug } from "@/lib/academy/content";
import { QuizEngine } from "../../components/QuizEngine";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module) return { title: "Assessment Not Found | Tinat Academy" };

  return {
    title: `Mastery Assessment: ${module.title} | Tinat Academy`,
    description: `Pass the ${module.title} assessment to verify your research methodology knowledge.`,
  };
}

export default async function AcademyQuizPage({ params }: Props) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module || !module.quiz) notFound();

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/academy/${module.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Module Overview
          </Link>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <GraduationCap className="h-4 w-4" />
            <span>Tinat Academy Assessment</span>
          </div>
        </div>

        <QuizEngine quiz={module.quiz} />
      </div>
    </div>
  );
}
