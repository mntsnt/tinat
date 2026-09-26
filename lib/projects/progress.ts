import { ProjectPhase, ProjectTaskStatus } from "@/generated/prisma/enums";

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  totalMilestones: number;
  completedMilestones: number;
  totalMembers: number;
  totalFiles: number;
  sensitiveFiles: number;
  totalDiscussions: number;
  totalDecisions: number;
  totalLinkedStudies: number;
  totalOutputs: number;
  progressPercentage: number;
  health: {
    status: "ON_TRACK" | "ATTENTION_NEEDED" | "AT_RISK";
    label: string;
    description: string;
    badgeColor: string;
  };
}

export const RESEARCH_PHASES: { id: ProjectPhase; label: string; step: number }[] = [
  { id: ProjectPhase.IDEA, label: "Idea", step: 1 },
  { id: ProjectPhase.PLANNING, label: "Planning", step: 2 },
  { id: ProjectPhase.LITERATURE_REVIEW, label: "Lit Review", step: 3 },
  { id: ProjectPhase.PROTOCOL, label: "Protocol", step: 4 },
  { id: ProjectPhase.ETHICS_APPROVAL, label: "Ethics / IRB", step: 5 },
  { id: ProjectPhase.DATA_COLLECTION, label: "Data Collection", step: 6 },
  { id: ProjectPhase.DATA_CLEANING, label: "Data Cleaning", step: 7 },
  { id: ProjectPhase.ANALYSIS, label: "Analysis", step: 8 },
  { id: ProjectPhase.MANUSCRIPT, label: "Manuscript", step: 9 },
  { id: ProjectPhase.SUBMISSION, label: "Submission", step: 10 },
  { id: ProjectPhase.PUBLICATION, label: "Publication", step: 11 },
  { id: ProjectPhase.COMPLETED, label: "Completed", step: 12 },
];

export function calculateProjectMetrics(params: {
  tasks: Array<{ status: ProjectTaskStatus; dueDate: Date | null }>;
  milestones: Array<{ isCompleted: boolean }>;
  membersCount: number;
  filesCount: number;
  sensitiveFilesCount: number;
  discussionsCount: number;
  decisionsCount: number;
  linkedStudiesCount: number;
  outputsCount: number;
}): ProjectStats {
  const now = new Date();
  const totalTasks = params.tasks.length;
  const completedTasks = params.tasks.filter(
    (t) => t.status === ProjectTaskStatus.COMPLETED
  ).length;
  const inProgressTasks = params.tasks.filter(
    (t) => t.status === ProjectTaskStatus.IN_PROGRESS
  ).length;
  const blockedTasks = params.tasks.filter(
    (t) => t.status === ProjectTaskStatus.BLOCKED
  ).length;

  const overdueTasks = params.tasks.filter(
    (t) =>
      t.status !== ProjectTaskStatus.COMPLETED &&
      t.dueDate &&
      new Date(t.dueDate) < now
  ).length;

  const totalMilestones = params.milestones.length;
  const completedMilestones = params.milestones.filter((m) => m.isCompleted).length;

  // Real Progress calculation:
  // 65% weight on tasks, 35% weight on milestones (if milestones exist)
  let progressPercentage = 0;
  if (totalTasks > 0 && totalMilestones > 0) {
    const taskRatio = completedTasks / totalTasks;
    const milestoneRatio = completedMilestones / totalMilestones;
    progressPercentage = Math.round((taskRatio * 0.65 + milestoneRatio * 0.35) * 100);
  } else if (totalTasks > 0) {
    progressPercentage = Math.round((completedTasks / totalTasks) * 100);
  } else if (totalMilestones > 0) {
    progressPercentage = Math.round((completedMilestones / totalMilestones) * 100);
  }

  // Non-judgmental Operational Project Health:
  let health: ProjectStats["health"] = {
    status: "ON_TRACK",
    label: "On Track",
    description: "Tasks and milestones are progressing steadily without operational blockers.",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  if (blockedTasks > 0 || overdueTasks >= 3) {
    health = {
      status: "AT_RISK",
      label: "Operational Blockers",
      description: `${blockedTasks} blocked task(s) and ${overdueTasks} overdue deadline(s) require team attention.`,
      badgeColor: "bg-destructive/10 text-destructive border-destructive/20",
    };
  } else if (overdueTasks > 0) {
    health = {
      status: "ATTENTION_NEEDED",
      label: "Approaching Deadlines",
      description: `${overdueTasks} task(s) past due date. Review schedule with the research team.`,
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    };
  }

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    blockedTasks,
    overdueTasks,
    totalMilestones,
    completedMilestones,
    totalMembers: params.membersCount,
    totalFiles: params.filesCount,
    sensitiveFiles: params.sensitiveFilesCount,
    totalDiscussions: params.discussionsCount,
    totalDecisions: params.decisionsCount,
    totalLinkedStudies: params.linkedStudiesCount,
    totalOutputs: params.outputsCount,
    progressPercentage,
    health,
  };
}
