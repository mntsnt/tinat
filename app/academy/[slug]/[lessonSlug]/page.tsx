import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLessonBySlug, getAdjacentLessons, getAllModules } from "@/lib/academy/content";
import { LessonReaderContainer } from "../../components/LessonReaderContainer";

type Props = {
  params: Promise<{ slug: string; lessonSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const result = getLessonBySlug(slug, lessonSlug);
  if (!result) return { title: "Lesson Not Found | Tinat Academy" };

  return {
    title: `${result.lesson.title} | ${result.module.title} | Tinat Academy`,
    description: result.lesson.learningObjectives?.[0] || result.module.summary,
  };
}

export default async function AcademyLessonPage({ params }: Props) {
  const { slug, lessonSlug } = await params;
  const result = getLessonBySlug(slug, lessonSlug);
  if (!result) notFound();

  const { prevLesson, nextLesson, nextModule } = getAdjacentLessons(slug, lessonSlug);

  return (
    <LessonReaderContainer
      module={result.module}
      lesson={result.lesson}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      nextModule={nextModule}
    />
  );
}
