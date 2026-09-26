"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Calendar,
  Lock,
  Globe2,
  ShieldCheck,
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
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "ARCHIVED";
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
    tasks: number;
    milestones: number;
    files: number;
    outputs: number;
    linkedStudies: number;
  };
  progress: {
    percentage: number;
    taskPercentage: number;
    milestonePercentage: number;
    totalTasks: number;
    completedTasks: number;
    totalMilestones: number;
    completedMilestones: number;
    health: "ON_TRACK" | "ATTENTION_NEEDED" | "AT_RISK";
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login?redirect=/projects";
          return;
        }
        throw new Error("Failed to load research projects");
      }
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Status filter
      if (statusFilter === "ACTIVE" && p.status !== "ACTIVE") return false;
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
        const matchesLead = p.lead?.name.toLowerCase().includes(query);
        const matchesDesign = p.studyDesign.toLowerCase().includes(query);
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
    const active = projects.filter((p) => p.status === "ACTIVE").length;
    const completed = projects.filter((p) => p.status === "COMPLETED").length;
    const totalMembers = projects.reduce((acc, p) => acc + p.members.length, 0);
    return { total, active, completed, totalMembers };
  }, [projects]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm mb-1 tracking-wide uppercase">
                <FolderKanban className="w-4 h-4" />
                Collaborative Health Research
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Research Projects & Teams
              </h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400 max-w-2xl text-sm leading-relaxed">
                End-to-end academic and clinical research workspaces from hypothesis and protocol to data collection, analysis, and peer-reviewed publication.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm shadow-indigo-600/20 transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99] text-sm"
              >
                <Plus className="w-4 h-4" />
                New Research Project
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Workspaces</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
              <div className="text-xs font-medium text-indigo-700 dark:text-indigo-400">Active Investigations</div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">{stats.active}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Completed & Published</div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{stats.completed}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Collaborators</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.totalMembers}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, study design, lead researcher, or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-medium">
              {(["ALL", "ACTIVE", "COMPLETED", "ARCHIVED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === tab
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab === "ALL" ? "All Projects" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                className="h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse p-6"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center">
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
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {searchQuery || statusFilter !== "ALL"
                ? "No matching research projects found"
                : "No research projects yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your search terms or filters to find what you are looking for."
                : "Launch a structured clinical or health research project with pre-scaffolded milestones, IRB compliance tools, and collaborator roles."}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Launch First Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const progress = project.progress || project.stats || {
    percentage: 0,
    completedTasks: 0,
    totalTasks: 0,
    health: "ON_TRACK",
  };

  const health = progress.health || "ON_TRACK";
  const healthStatus = typeof health === "object" ? (health as any).status : health;

  const healthColorMap: Record<string, string> = {
    ON_TRACK: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    ATTENTION_NEEDED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    AT_RISK: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  };
  const healthColor = healthColorMap[healthStatus] || healthColorMap.ON_TRACK;

  const healthLabelMap: Record<string, string> = {
    ON_TRACK: "On Track",
    ATTENTION_NEEDED: "Needs Review",
    AT_RISK: "At Risk",
  };
  const healthLabel = healthLabelMap[healthStatus] || "On Track";

  const linkedStudiesCount = project._count?.linkedStudies ?? 0;
  const members = Array.isArray(project.members) ? project.members : [];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-200"
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {project.studyDesign || project.category || "Research Project"}
        </span>
        <div className="flex items-center gap-1.5">
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
      <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
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
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          {(project.currentPhase || "PLANNING").replace(/_/g, " ")}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Overall Progress</span>
          <span className="font-semibold text-slate-900 dark:text-white">{progress.percentage ?? 0}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
            style={{ width: `${progress.percentage ?? 0}%` }}
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
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
              <Activity className="w-3.5 h-3.5" />
              <span>{linkedStudiesCount} study</span>
            </div>
          )}
        </div>

        {/* Member Avatars */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {members.slice(0, 3).map((m: any, idx: number) => (
            <div
              key={idx}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center uppercase"
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
