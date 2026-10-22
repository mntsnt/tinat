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
  ArrowRight,
  Activity,
  Lock,
  Globe2,
  CircleCheck,
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
    return () => { active = false; };
  }, [router]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter === "ACTIVE" && (p.status !== "ACTIVE" || p.isArchived)) return false;
      if (statusFilter === "PAUSED" && p.status !== "PAUSED") return false;
      if (statusFilter === "COMPLETED" && p.status !== "COMPLETED") return false;
      if (statusFilter === "ARCHIVED" && !p.isArchived) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDesc = p.description?.toLowerCase().includes(query);
        const matchesInst = p.institution?.toLowerCase().includes(query);
        const matchesLead = p.lead?.name?.toLowerCase().includes(query) ?? false;
        return matchesTitle || matchesDesc || matchesInst || matchesLead;
      }
      return true;
    });
  }, [projects, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === "ACTIVE" && !p.isArchived).length;
    const completed = projects.filter((p) => p.status === "COMPLETED" && !p.isArchived).length;
    const teamMembers = new Set(projects.flatMap((project) => project.members.map((member) => member.user.id)));
    const overdue = projects.reduce(
      (total, project) => total + project.progress.overdueTasks + project.progress.blockedTasks,
      0,
    );
    return { total: projects.length, active, completed, teamMembers: teamMembers.size, overdue };
  }, [projects]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-7 md:py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <FolderKanban className="w-4 h-4" />
            Research Projects
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Your research workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize projects, collaborate with your team, and track progress.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New project
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Active" value={stats.active} icon={<Activity className="h-4 w-4" />} color="emerald" />
        <StatCard label="Team members" value={stats.teamMembers} icon={<Users className="h-4 w-4" />} color="blue" />
        <StatCard label="Completed" value={stats.completed} icon={<CircleCheck className="h-4 w-4" />} color="violet" />
        <StatCard
          label="Need attention"
          value={stats.overdue}
          icon={<Clock3 className="h-4 w-4" />}
          color={stats.overdue > 0 ? "amber" : "muted"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search research projects"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center rounded-md border border-border bg-muted p-1 text-xs font-medium" role="group" aria-label="Filter by status">
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
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid or States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5 text-center">
          <AlertCircle className="w-7 h-7 text-destructive mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Unable to load projects</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button
            onClick={fetchProjects}
            className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FolderKanban className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery || statusFilter !== "ALL" ? "No projects match your filters" : "No research projects yet"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your search or filters."
              : "Create your first project to start organizing your research."}
          </p>
          {!searchQuery && statusFilter === "ALL" && (
            <Link
              href="/projects/new"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Create first project
            </Link>
          )}
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
  const healthColor = healthColorMap[healthStatus] ?? healthColorMap.ON_TRACK;
  const statusLabel = project.isArchived ? "ARCHIVED" : project.status;
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    PAUSED: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    COMPLETED: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    ARCHIVED: "bg-muted text-muted-foreground",
  };
  const members = Array.isArray(project.members) ? project.members : [];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/20"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {project.studyDesign?.replace(/_/g, " ") || project.category || "Research"}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[statusLabel] ?? statusColors.ARCHIVED}`}>
            {statusLabel.charAt(0) + statusLabel.slice(1).toLowerCase()}
          </span>
          {project.visibility === "PUBLIC" ? (
            <Globe2 className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
        {project.title}
      </h3>

      {/* Institution / Lead */}
      <p className="text-xs text-muted-foreground line-clamp-1 mb-4">
        {project.institution ? `${project.institution} · ` : ""}
        {project.lead?.name || "Unassigned"}
      </p>

      {/* Progress bar */}
      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold text-foreground">{progress.progressPercentage}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${healthColor}`}>
              {progress.health.label}
            </span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{progress.completedTasks}/{progress.totalTasks}</span>
            </div>
          </div>

          {/* Member Avatars */}
          <div className="flex items-center -space-x-1.5">
            {members.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="h-6 w-6 rounded-full ring-2 ring-card bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center uppercase"
              >
                {m.user?.name?.charAt(0) || "U"}
              </div>
            ))}
            {members.length > 3 && (
              <div className="h-6 w-6 rounded-full ring-2 ring-card bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center">
                +{members.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "violet" | "amber" | "muted";
}) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground leading-none">{value}</p>
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${colorMap[color]}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}
