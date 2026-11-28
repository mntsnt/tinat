import { AcademyModule, LearningPath, Lesson } from "../types";
import { learningPaths } from "./paths";
import { module1 } from "./module1";
import { module2 } from "./module2";
import { module3 } from "./module3";
import { module4 } from "./module4";
import { module5 } from "./module5";
import { module6 } from "./module6";
import { module7 } from "./module7";
import { module8 } from "./module8";
import { module9 } from "./module9";
import { module10 } from "./module10";
import { module11 } from "./module11";
import { module12 } from "./module12";
import { module13 } from "./module13";

export { learningPaths };

export const moduleCoverMap: Record<number, string> = {
  1: "/assets/academy/modules/module-01-intro-health-research.jpg",
  2: "/assets/academy/modules/module-02-research-questions.jpg",
  3: "/assets/academy/modules/module-03-literature-review.jpg",
  4: "/assets/academy/modules/module-04-research-ethics.jpg",
  5: "/assets/academy/modules/module-05-research-designs.jpg",
  6: "/assets/academy/modules/module-06-sampling-methods.jpg",
  7: "/assets/academy/modules/module-07-questionnaire-development.jpg",
  8: "/assets/academy/modules/module-08-epidemiology.jpg",
  9: "/assets/academy/modules/module-09-biostatistics.jpg",
  10: "/assets/academy/modules/module-10-statistical-analysis.jpg",
  11: "/assets/academy/modules/module-11-qualitative-methods.jpg",
  12: "/assets/academy/modules/module-12-academic-writing.jpg",
  13: "/assets/academy/modules/module-13-reporting-guidelines.jpg",
};

export function getModuleCover(moduleOrNumber: AcademyModule | number): string {
  const num = typeof moduleOrNumber === "number" ? moduleOrNumber : moduleOrNumber.number;
  return moduleCoverMap[num] || `/assets/academy/modules/module-${String(num).padStart(2, "0")}.jpg`;
}

export const academyModulesData: AcademyModule[] = [
  module1,
  module2,
  module3,
  module4,
  module5,
  module6,
  module7,
  module8,
  module9,
  module10,
  module11,
  module12,
  module13,
].map((mod) => ({
  ...mod,
  coverImage: mod.coverImage || moduleCoverMap[mod.number],
}));

export function getAllModules(): AcademyModule[] {
  return academyModulesData;
}

export function getModuleBySlug(slug: string): AcademyModule | undefined {
  return academyModulesData.find((m) => m.slug === slug);
}

export function getLearningPath(id: string): LearningPath | undefined {
  return learningPaths.find((p) => p.id === id);
}

export function getLessonBySlug(
  moduleSlug: string,
  lessonSlug: string
): { module: AcademyModule; lesson: Lesson } | undefined {
  const module = getModuleBySlug(moduleSlug);
  if (!module) return undefined;
  const lesson = module.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return undefined;
  return { module, lesson };
}

export function getAdjacentLessons(
  moduleSlug: string,
  lessonSlug: string
): { prevLesson?: Lesson; nextLesson?: Lesson; nextModule?: AcademyModule } {
  const module = getModuleBySlug(moduleSlug);
  if (!module) return {};

  const currentIndex = module.lessons.findIndex((l) => l.slug === lessonSlug);
  if (currentIndex === -1) return {};

  const prevLesson = currentIndex > 0 ? module.lessons[currentIndex - 1] : undefined;
  const nextLesson =
    currentIndex < module.lessons.length - 1 ? module.lessons[currentIndex + 1] : undefined;

  let nextModule: AcademyModule | undefined;
  if (!nextLesson) {
    const currentModuleIndex = academyModulesData.findIndex((m) => m.slug === moduleSlug);
    if (currentModuleIndex < academyModulesData.length - 1) {
      nextModule = academyModulesData[currentModuleIndex + 1];
    }
  }

  return { prevLesson, nextLesson, nextModule };
}
