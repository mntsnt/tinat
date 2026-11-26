import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getModuleBySlug } from "@/lib/academy/content";
import { QuizEngine } from "../../components/QuizEngine";
import { AcademyPageFrame } from "../../components/AcademyPageFrame";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const academyModule = getModuleBySlug(slug);
  if (!academyModule) return { title: "Assessment Not Found | Tinat Academy" };

  return {
    title: `Mastery Assessment: ${academyModule.title} | Tinat Academy`,
    description: `Pass the ${academyModule.title} assessment to verify your research methodology knowledge.`,
  };
}

export default async function AcademyQuizPage({ params }: Props) {
  const { slug } = await params;
  const academyModule = getModuleBySlug(slug);
  if (!academyModule || !academyModule.quiz) notFound();

  return (
    <AcademyPageFrame
      backLink={{ href: `/academy/${academyModule.slug}`, label: "Back to module" }}
      eyebrow={`Module ${academyModule.number} · Assessment`}
      title={academyModule.quiz.title}
      description={`Check your understanding of ${academyModule.title}. The passing score is ${academyModule.quiz.passPercentage}%.`}
      contentClassName="max-w-4xl"
    >
      <QuizEngine quiz={academyModule.quiz} />
    </AcademyPageFrame>
  );
}
