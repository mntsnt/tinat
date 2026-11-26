import { academyModulesData } from "../lib/academy/content";

console.log("🔍 Validating Tinat Academy Curriculum Content...");

let totalErrors = 0;
let totalWarnings = 0;
let totalModules = 0;
let totalLessons = 0;
let totalQuestions = 0;
let totalReferences = 0;

for (const module of academyModulesData) {
  totalModules++;
  console.log(`\n📘 Checking Module ${module.number}: "${module.title}" (${module.slug})`);

  if (!module.title || !module.slug || !module.summary) {
    console.error(`  ❌ Module missing title, slug, or summary.`);
    totalErrors++;
  }

  if (!module.learningObjectives || module.learningObjectives.length === 0) {
    console.error(`  ❌ Module has no learning objectives.`);
    totalErrors++;
  }

  if (!module.expectedOutcomes || module.expectedOutcomes.length === 0) {
    console.warn(`  ⚠️ Module has no expected outcomes listed.`);
    totalWarnings++;
  }

  // Validate Lessons
  if (!module.lessons || module.lessons.length === 0) {
    console.error(`  ❌ Module has 0 lessons.`);
    totalErrors++;
  } else {
    for (const lesson of module.lessons) {
      totalLessons++;
      if (!lesson.title || !lesson.slug) {
        console.error(`    ❌ Lesson missing title or slug in module ${module.slug}`);
        totalErrors++;
      }

      if (!lesson.learningObjectives || lesson.learningObjectives.length === 0) {
        console.error(`    ❌ Lesson "${lesson.slug}" lacks learning objectives.`);
        totalErrors++;
      }

      if (!lesson.sections || lesson.sections.length === 0) {
        console.error(`    ❌ Lesson "${lesson.slug}" has no content sections.`);
        totalErrors++;
      }

      if (!lesson.keyTakeaways || lesson.keyTakeaways.length === 0) {
        console.error(`    ❌ Lesson "${lesson.slug}" lacks key takeaways.`);
        totalErrors++;
      }

      if (!lesson.references || lesson.references.length === 0) {
        console.error(`    ❌ Lesson "${lesson.slug}" has no references.`);
        totalErrors++;
      } else {
        for (const ref of lesson.references) {
          totalReferences++;
          if (!ref.citationText) {
            console.error(`    ❌ Reference missing citationText in lesson "${lesson.slug}".`);
            totalErrors++;
          }
          if (!ref.isVerified && !ref.needsReviewReason) {
            console.error(`    ❌ Unverified reference "${ref.id}" in lesson "${lesson.slug}" must have a needsReviewReason.`);
            totalErrors++;
          }
        }
      }
    }
  }

  // Validate Quiz
  if (!module.quiz) {
    console.error(`  ❌ Module ${module.slug} lacks a quiz object.`);
    totalErrors++;
  } else {
    const qb = module.quiz.questionBank;
    if (!qb || qb.length === 0) {
      console.error(`  ❌ Module ${module.slug} quiz has empty question bank.`);
      totalErrors++;
    } else {
      for (const q of qb) {
        totalQuestions++;
        if (!q.id || !q.question || !q.type || !q.topicTag) {
          console.error(`    ❌ Quiz question missing id, question text, type, or topicTag.`);
          totalErrors++;
        }

        if (q.type === "single-choice" || q.type === "multiple-select" || q.type === "true-false-justification") {
          if (!q.options || q.options.length < 2) {
            console.error(`    ❌ Question "${q.id}" has fewer than 2 options.`);
            totalErrors++;
          } else {
            const hasCorrect = q.options.some((o) => o.isCorrect);
            if (!hasCorrect) {
              console.error(`    ❌ Question "${q.id}" has no marked correct option.`);
              totalErrors++;
            }
            for (const opt of q.options) {
              if (!opt.explanation || opt.explanation.trim().length === 0) {
                console.error(`    ❌ Question "${q.id}" option "${opt.id}" is missing an explanation.`);
                totalErrors++;
              }
            }
          }
        } else if (q.type === "numeric") {
          if (q.targetNumericValue === undefined || q.numericTolerance === undefined) {
            console.error(`    ❌ Numeric question "${q.id}" missing targetNumericValue or numericTolerance.`);
            totalErrors++;
          }
        } else if (q.type === "fill-blank") {
          if (!q.acceptedBlanks || q.acceptedBlanks.length === 0) {
            console.error(`    ❌ Fill-in-blank question "${q.id}" lacks acceptedBlanks list.`);
            totalErrors++;
          }
        }
      }
    }
  }

  // Validate Assignment
  if (!module.assignment || !module.assignment.title || !module.assignment.instructions) {
    console.error(`  ❌ Module ${module.slug} lacks a valid practical assignment.`);
    totalErrors++;
  }
}

console.log("\n==========================================");
console.log(`📊 SUMMARY OF CONTENT VALIDATION:`);
console.log(`   Modules checked:     ${totalModules}`);
console.log(`   Lessons checked:     ${totalLessons}`);
console.log(`   Questions validated: ${totalQuestions}`);
console.log(`   References checked:  ${totalReferences}`);
console.log(`   Total Warnings:      ${totalWarnings}`);
console.log(`   Total Errors:        ${totalErrors}`);
console.log("==========================================");

if (totalErrors > 0) {
  console.error(`\n❌ BUILD FAILED: ${totalErrors} content validation errors found.`);
  process.exit(1);
} else {
  console.log(`\n✅ ALL CURRICULUM CONTENT PASSED VALIDATION.`);
  process.exit(0);
}
