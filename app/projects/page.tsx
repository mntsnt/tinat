"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Activity,
  Lock,
  Globe2,
  ListTodo,
  CircleCheck,
  MessageSquareText,
  BookOpen,
} from "lucide-react";

interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

interface ProjectSummary {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  category: string;
  studyDesign: string;
  researchArea?: string | null;
  institution?: string | null;
  currentPhase: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  visibility: "PRIVATE" | "TEAM" | "PUBLIC";
  isArchived: boolean;
  createdAt: string;
  lead: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  members: ProjectMember[];
  _count: {
    members: number;
    files: number;
    discussions: number;
    decisions: number;
    outputs: number;
    linkedStudies: number;
  };
  progress: {
    progressPercentage: number;
    totalTasks: number;
    completedTasks: number;
    totalMilestones: number;
    completedMilestones: number;
    inProgressTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    health: {
      status: "ON_TRACK" | "ATTENTION_NEEDED" | "AT_RISK";
      label: string;
      description: string;
    };
  };
  tasks: ProjectTask[];
  activities: ProjectActivity[];
}

interface ProjectTask {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  priority: string;
}

interface ProjectActivity {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: { name: string };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects?filter=all");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?redirect=/projects");
          return;
        }
        throw new Error("Failed to load research projects");
      }
      const data = (await res.json()) as { projects?: ProjectSummary[]; error?: string };
      if (!Array.isArray(data.projects)) {
        throw new Error(data.error || "The project list response was invalid.");
      }
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects?filter=all");
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login?redirect=/projects");
            return;
          }
          throw new Error("Failed to load research projects");
        }

        const data = (await response.json()) as { projects?: ProjectSummary[]; error?: string };
        if (!Array.isArray(data.projects)) {
          throw new Error(data.error || "The project list response was invalid.");
        }
        if (active) setProjects(data.projects);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "An error occurred");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, [router]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Status filter
      if (statusFilter === "ACTIVE" && (p.status !== "ACTIVE" || p.isArchived)) return false;
      if (statusFilter === "PAUSED" && p.status !== "PAUSED") return false;
      if (statusFilter === "COMPLETED" && p.status !== "COMPLETED") return false;
      if (statusFilter === "ARCHIVED" && !p.isArchived) return false;

      // Category filter
      if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDesc = p.description?.toLowerCase().includes(query);
        const matchesInst = p.institution?.toLowerCase().includes(query);
        const matchesLead = p.lead?.name?.toLowerCase().includes(query) ?? false;
        const matchesDesign = p.studyDesign?.toLowerCase().includes(query) ?? false;
        return matchesTitle || matchesDesc || matchesInst || matchesLead || matchesDesign;
      }

      return true;
    });
  }, [projects, statusFilter, categoryFilter, searchQuery]);

  const categories = useMemo(() => {
    const set = new Set(projects.map((p) => p.category).filter(Boolean));
    return Array.from(set);
  }, [projects]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "ACTIVE" && !p.isArchived).length;
    const paused = projects.filter((p) => p.status === "PAUSED" && !p.isArchived).length;
    const completed = projects.filter((p) => p.status === "COMPLETED" && !p.isArchived).length;
    const teamMembers = new Set(projects.flatMap((project) => project.members.map((member) => member.user.id)));
    const tasksNeedingAttention = projects.reduce(
      (totalAttention, project) => totalAttention + project.progress.overdueTasks + project.progress.blockedTasks,
      0,
    );
    return { total, active, paused, completed, teamMembers: teamMembers.size, tasksNeedingAttention };
  }, [projects]);

  const recentUpdates = useMemo(
    () =>
      projects
        .flatMap((project) =>
          project.activities.map((activity) => ({ ...activity, projectId: project.id, projectTitle: project.title })),
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [projects],
  );

  const upcomingTasks = useMemo(
    () =>
      projects
        .flatMap((project) =>
          project.tasks
            .filter((task) => task.status !== "COMPLETED" && task.dueDate)
            .map((task) => ({ ...task, projectId: project.id, projectTitle: project.title })),
        )
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 4),
    [projects],
  );

  return (
    <div className="container mx-auto max-w-[1440px] px-4 py-6 md:px-7 md:py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1.5 uppercase tracking-wider">
            <FolderKanban className="w-4 h-4" />
            Research workspace
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Your research, in one place
          </h1>
          <p className="mt-1 text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Organize projects, coordinate your team, and keep your studies moving forward.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/researcher/studies"
            className="hidden items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:inline-flex"
          >
            <BookOpen className="h-4 w-4" />
            View studies
          </Link>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New project
          </Link>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <section aria-label="Research workspace summary" className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard label="Active projects" value={stats.active} description="Currently moving forward" icon={<Activity className="h-4 w-4" />} accent="emerald" />
        <SummaryCard label="Team members" value={stats.teamMembers} description="Collaborators across your teams" icon={<Users className="h-4 w-4" />} accent="blue" />
        <SummaryCard label="Completed projects" value={stats.completed} description={`${stats.paused} currently paused`} icon={<CircleCheck className="h-4 w-4" />} accent="violet" />
        <SummaryCard label="Tasks to review" value={stats.tasksNeedingAttention} description="Overdue or blocked across projects" icon={<Clock3 className="h-4 w-4" />} accent={stats.tasksNeedingAttention ? "amber" : "slate"} />
      </section>

      <section className="mb-8 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Make progress today</h2>
                <p className="text-xs text-muted-foreground">Quick ways to move your research forward.</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              {stats.active ? "Workspace active" : "Get started"}
            </span>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.slice(0, 2).map((task) => (
                <Link key={task.id} href={`/projects/${task.projectId}`} className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-muted/40">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><ListTodo className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{task.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{task.projectTitle} · Due {new Date(task.dueDate!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))
            ) : (
              <Link href={projects[0] ? `/projects/${projects[0].id}` : "/projects/new"} className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-muted/40">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><FolderKanban className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{projects.length ? "Review your project milestones" : "Create your first research project"}</span>
                  <span className="block text-xs text-muted-foreground">{projects.length ? "Check progress, files, and what comes next." : "Start with a research template and invite your collaborators."}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            )}
            <Link href="/researcher/studies" className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-muted/40">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><BookOpen className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">Connect projects with your studies</span>
                <span className="block text-xs text-muted-foreground">Manage participant collection and review responses.</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
            <Link href="/ai" className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-muted/40">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><Sparkles className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">Open Tinat AI Research Assistant</span>
                <span className="block text-xs text-muted-foreground">Explore study data and get help with analysis.</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><MessageSquareText className="h-4 w-4" /></span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Recent project updates</h2>
                <p className="text-xs text-muted-foreground">Latest activity from your workspaces.</p>
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{recentUpdates.length} updates</span>
          </div>
          {recentUpdates.length ? (
            <div className="space-y-0.5">
              {recentUpdates.map((update) => (
                <Link key={update.id} href={`/projects/${update.projectId}`} className="flex items-start gap-2.5 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{update.user.name.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-foreground">{update.description || update.action.replace(/_/g, " ").toLowerCase()}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{update.projectTitle} · {update.user.name}</span>
                  </span>
                  <time className="shrink-0 pt-0.5 text-[10px] text-muted-foreground">
                    {new Date(update.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </time>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 text-center">
              <Activity className="mb-2 h-5 w-5 text-muted-foreground/60" />
              <p className="text-xs font-medium text-foreground">No updates yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Project collaboration activity will show up here.</p>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, study design, lead researcher, or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search research projects"
              className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center rounded-md border border-border bg-muted p-1 text-xs font-medium" role="group" aria-label="Filter projects by status">
              {(["ALL", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  aria-pressed={statusFilter === tab}
                  className={`rounded px-3 py-1.5 transition-colors ${
                    statusFilter === tab
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "ALL" ? "All" : tab === "PAUSED" ? "Paused" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter projects by discipline"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ALL">All Disciplines</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Projects Grid or State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded-lg border border-border bg-card animate-pulse p-5"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center">
            <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-rose-800 dark:text-rose-200">Unable to load projects</h3>
            <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">{error}</p>
            <button
              onClick={fetchProjects}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-medium hover:bg-rose-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
              <FolderKanban className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL"
                ? "No matching research projects found"
                : "No research projects yet"}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL"
                ? "Try adjusting your search terms or filters to find what you are looking for."
                : "Launch a structured clinical or health research project with pre-scaffolded milestones, IRB compliance tools, and collaborator roles."}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Launch First Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const progress = project.progress;
  const healthStatus = progress.health.status;
  const healthColorMap: Record<string, string> = {
    ON_TRACK: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    ATTENTION_NEEDED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    AT_RISK: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  };
  const healthColor = healthColorMap[healthStatus] || healthColorMap.ON_TRACK;

  const healthLabel = progress.health.label;
  const statusLabel = project.isArchived ? "ARCHIVED" : project.status;
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    PAUSED: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    COMPLETED: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    ARCHIVED: "bg-muted text-muted-foreground",
  };

  const linkedStudiesCount = project._count?.linkedStudies ?? 0;
  const members = Array.isArray(project.members) ? project.members : [];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {project.studyDesign || project.category || "Research Project"}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[statusLabel]}`}>
            {statusLabel.toLowerCase().replace(/^\w/, (character) => character.toUpperCase())}
          </span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${healthColor}`}>
            {healthLabel}
          </span>
          {project.visibility === "PUBLIC" ? (
            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Project Title */}
      <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors line-clamp-2">
        {project.title}
      </h3>

      {/* Institution / Lead */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
        {project.institution ? `${project.institution} • ` : ""}
        PI: {project.lead?.name || "Unassigned"}
      </p>

      {/* Current Phase Pill */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Current Phase:</span>
        <span className="font-semibold text-primary dark:text-primary">
          {(project.currentPhase || "PLANNING").replace(/_/g, " ")}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Overall Progress</span>
          <span className="font-semibold text-slate-900 dark:text-white">{progress.progressPercentage}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary dark:bg-primary transition-all duration-500"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Bottom Metadata */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {progress.completedTasks ?? 0}/{progress.totalTasks ?? 0} tasks
            </span>
          </div>
          {linkedStudiesCount > 0 && (
            <div className="flex items-center gap-1 text-primary dark:text-primary font-medium">
              <Activity className="w-3.5 h-3.5" />
              <span>{linkedStudiesCount} study</span>
            </div>
          )}
        </div>

        {/* Member Avatars */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {members.slice(0, 3).map((m) => (
            <div
              key={m.id}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-primary text-white text-[10px] font-bold flex items-center justify-center uppercase"
            >
              {m.user?.name?.charAt(0) || "U"}
            </div>
          ))}
          {members.length > 3 && (
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">
              +{members.length - 3}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  accent,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  accent: "emerald" | "blue" | "violet" | "amber" | "slate";
}) {
  const accents = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    slate: "bg-muted text-muted-foreground",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold leading-none text-foreground">{value}</p>
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accents[accent]}`}>{icon}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
