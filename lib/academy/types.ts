export type LearningPathId = "beginner" | "intermediate" | "advanced";

export type ContentStatus = "reviewed" | "needs academic review" | "draft";

export interface LearningPath {
  id: LearningPathId;
  title: string;
  levelBadge: string;
  subtitle: string;
  description: string;
  targetAudience: string;
  estimatedHours: string;
  moduleSlugs: string[];
}

export interface Reference {
  id: string;
  citationText: string; // Vancouver style citation text
  url?: string;
  isVerified: boolean;
  needsReviewReason?: string;
}

export interface GlossaryTerm {
  term: string;
  pronunciation?: string;
  definition: string;
  ethiopianContext?: string;
}

export type CalloutType =
  | "key-idea"
  | "worked-example"
  | "common-mistake"
  | "ethiopian-case-study"
  | "try-it";

export interface Callout {
  type: CalloutType;
  title: string;
  content: string;
}

export interface CheckYourUnderstandingQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type ToolIntegrationType =
  | "sample-size"
  | "statistical-calculator"
  | "research-workspace"
  | "tinat-forms";

export interface ToolIntegrationConfig {
  type: ToolIntegrationType;
  title: string;
  description: string;
  prefilledParams?: Record<string, string | number>;
  ctaText: string;
  ctaHref: string;
}

export interface LessonSection {
  id: string;
  title: string;
  content: string; // Markdown formatted
  callout?: Callout;
}

export interface Lesson {
  slug: string;
  moduleSlug: string;
  title: string;
  orderIndex: number;
  readingTimeMinutes: number;
  learningObjectives: string[];
  sections: LessonSection[];
  checkUnderstanding: CheckYourUnderstandingQuestion[];
  toolIntegration?: ToolIntegrationConfig;
  keyTakeaways: string[];
  references: Reference[];
  status: ContentStatus;
}

export type QuizQuestionType =
  | "single-choice"
  | "multiple-select"
  | "true-false-justification"
  | "numeric"
  | "fill-blank"
  | "ordering-matching"
  | "scenario"
  | "critical-appraisal";

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string; // Detailed reason why this option is right or wrong
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  scenario?: string; // Case study context (e.g. clinic scenario in Hawassa or epidemic report)
  excerpt?: string; // For critical appraisal (e.g. published methodology paragraph with a flaw)
  options?: QuizOption[];
  // For numeric tolerance questions:
  targetNumericValue?: number;
  numericTolerance?: number; // e.g. 0.05
  numericUnit?: string;
  // For fill-in-the-blank questions:
  acceptedBlanks?: string[]; // e.g. ["confounding", "confounder"]
  // For ordering/matching questions:
  matchingPairs?: MatchingPair[];
  correctOrder?: string[]; // Ordered IDs
  // Feedback & pedagogy:
  hint?: string;
  citationLessonSlug?: string;
  topicTag: string;
  explanation: string;
}

export interface ModuleQuiz {
  moduleSlug: string;
  title: string;
  passPercentage: number; // e.g. 70
  displayCount: number; // Questions shown per attempt, e.g. 10
  questionBank: QuizQuestion[]; // Bank of >= 25 questions
}

export interface AssignmentRubricItem {
  criterion: string;
  points: number;
  description: string;
}

export interface PracticalAssignment {
  id: string;
  moduleSlug: string;
  title: string;
  overview: string;
  scenario: string;
  instructions: string[];
  deliverables: string[];
  rubric: AssignmentRubricItem[];
  workspaceTemplateId?: string;
  formsTemplateId?: string;
}

export interface RecommendedResource {
  title: string;
  authorOrOrg: string;
  description: string;
  url: string;
  type: "book" | "guideline" | "toolkit" | "course" | "paper";
  isVerified: boolean;
}

export interface AcademyModule {
  slug: string;
  number: number;
  pathId: LearningPathId;
  title: string;
  subtitle: string;
  duration: string;
  summary: string;
  learningObjectives: string[];
  prerequisites: string[];
  expectedOutcomes: string[];
  lessons: Lesson[];
  quiz: ModuleQuiz;
  assignment: PracticalAssignment;
  resources: RecommendedResource[];
  glossary: GlossaryTerm[];
  status: ContentStatus;
}
