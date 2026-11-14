"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ShieldAlert,
  Building2,
  Tag,
  FileText,
  Calendar,
  Lock,
  Globe2,
  Layers,
  Activity,
  Archive,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { useConfirm } from "@/app/components/ui/ConfirmDialog";

interface ProjectSettingsTabProps {
  project: {
    id: string;
    title: string;
    description?: string | null;
    researchQuestion?: string | null;
    objective?: string | null;
    category?: string | null;
    studyDesign?: string | null;
    researchArea?: string | null;
    institution?: string | null;
    status: string;
    currentPhase: string;
    visibility: string;
    startDate?: string | null;
    endDate?: string | null;
    isArchived?: boolean;
  };
  auth: {
    isLead?: boolean;
    canManageProject?: boolean;
    userRole?: string;
  };
  onProjectUpdated: () => void;
}

const COMMON_CATEGORIES = [
  "Public Health & Epidemiology",
  "Cardiovascular & Metabolic Health",
  "Maternal & Child Health",
  "Infectious & Communicable Diseases",
  "Mental Health & Wellbeing",
  "Health Systems & Informatics",
  "Nutrition & Dietary Health",
  "Clinical Medicine",
  "Genomics & Precision Medicine",
  "Environmental Health",
];

const STUDY_DESIGNS = [
  "Randomized Controlled Trial (RCT)",
  "Prospective Cohort Study",
  "Retrospective Cohort Study",
  "Case-Control Study",
  "Cross-Sectional Survey",
  "Qualitative & Ethnographic",
  "Mixed-Methods Study",
  "Systematic Review & Meta-Analysis",
  "Translational & Implementation Science",
  "Diagnostic & Laboratory Study",
];

const RESEARCH_PHASES = [
  { id: "PLANNING", label: "Planning & Protocol Design" },
  { id: "ETHICS_REVIEW", label: "Ethics & IRB Review" },
  { id: "DATA_COLLECTION", label: "Data Collection" },
  { id: "DATA_ANALYSIS", label: "Data Analysis & Synthesis" },
  { id: "MANUSCRIPT_PREPARATION", label: "Manuscript Preparation" },
  { id: "PEER_REVIEW", label: "Peer Review & Revision" },
  { id: "DISSEMINATION", label: "Dissemination & Translation" },
  { id: "COMPLETED", label: "Project Completed" },
];

const PROJECT_STATUSES = [
  { id: "ACTIVE", label: "Active", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  { id: "ON_HOLD", label: "On Hold", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  { id: "ARCHIVED", label: "Archived", color: "text-slate-600 bg-slate-500/10 border-slate-500/20" },
  { id: "COMPLETED", label: "Completed", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
];

export function ProjectSettingsTab({ project, auth, onProjectUpdated }: ProjectSettingsTabProps) {
  const router = useRouter();
  const { confirm } = useConfirm();

  // Form State
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || "");
  const [researchQuestion, setResearchQuestion] = useState(project.researchQuestion || "");
  const [objective, setObjective] = useState(project.objective || "");
  const [category, setCategory] = useState(project.category || "");
  const [studyDesign, setStudyDesign] = useState(project.studyDesign || "");
  const [researchArea, setResearchArea] = useState(project.researchArea || "");
  const [institution, setInstitution] = useState(project.institution || "");
  const [currentPhase, setCurrentPhase] = useState(project.currentPhase || "PLANNING");
  const [status, setStatus] = useState(project.status || "ACTIVE");
  const [visibility, setVisibility] = useState(project.visibility || "INTERNAL");
  const [startDate, setStartDate] = useState(
    project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : ""
  );
  const [isArchived, setIsArchived] = useState(Boolean(project.isArchived));

  // Submission State
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canManage = auth?.isLead || auth?.canManageProject || auth?.userRole === "ADMIN";

  // Handle Save Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setFeedback({ type: "error", message: "Project title must be at least 3 characters." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          researchQuestion: researchQuestion.trim() || null,
          objective: objective.trim() || null,
          category: category.trim() || "Health & Medical",
          studyDesign: studyDesign.trim() || "Observational",
          researchArea: researchArea.trim() || null,
          institution: institution.trim() || null,
          status,
          currentPhase,
          visibility,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
          isArchived,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save project settings");
      }

      setFeedback({ type: "success", message: "Project settings successfully updated." });
      onProjectUpdated();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Could not save project settings." });
    } finally {
      setSaving(false);
    }
  }

  // Handle Delete Project
  async function handleDeleteProject() {
    const ok = await confirm({
      title: "Delete Research Project",
      message: `Are you sure you want to permanently delete "${project.title}" and all its tasks, files, milestones, discussions, and activity logs? This action is permanent and cannot be undone.`,
      variant: "danger",
      confirmText: "Permanently Delete Project",
    });

    if (!ok) return;

    setDeleting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete project");
      }

      router.push("/projects");
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete project." });
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl pb-16 animate-in fade-in duration-150">
      {/* Settings Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Settings className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Project Settings</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Configure project details, research question, timeline, IRB/ethical visibility, and lifecycle phases.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* ── CARD 1: GENERAL METADATA ── */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">General Protocol Information</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Core scientific registry</span>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Project Title *</label>
            <input
              type="text"
              required
              minLength={3}
              disabled={!canManage}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Longitudinal Genomic Biomarkers in Early Type 2 Diabetes"
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-60"
            />
          </div>

          {/* Category & Research Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                Research Category
              </label>
              <input
                type="text"
                list="project-categories"
                disabled={!canManage}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Select or enter category..."
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-2xs transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
              <datalist id="project-categories">
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                Research Area / Sub-field
              </label>
              <input
                type="text"
                disabled={!canManage}
                value={researchArea}
                onChange={(e) => setResearchArea(e.target.value)}
                placeholder="e.g. Molecular Epidemiology, Spatial Health"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-2xs transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Institution & Study Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                Institution / Affiliated Body
              </label>
              <input
                type="text"
                disabled={!canManage}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Addis Ababa University, Health Sciences Institute"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-2xs transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                Study Design
              </label>
              <select
                disabled={!canManage}
                value={studyDesign}
                onChange={(e) => setStudyDesign(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-2xs transition-colors text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              >
                {STUDY_DESIGNS.map((design) => (
                  <option key={design} value={design}>
                    {design}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Research Question */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Primary Research Question</label>
            <textarea
              rows={2}
              disabled={!canManage}
              value={researchQuestion}
              onChange={(e) => setResearchQuestion(e.target.value)}
              placeholder="What core scientific hypothesis or problem is this research project solving?"
              className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors disabled:opacity-60 leading-relaxed"
            />
          </div>

          {/* Objective */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Specific Aims &amp; Objectives</label>
            <textarea
              rows={2}
              disabled={!canManage}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="List specific milestones, quantitative endpoints, or intended clinical deliverables..."
              className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors disabled:opacity-60 leading-relaxed"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Detailed Description / Abstract</label>
            <textarea
              rows={3}
              disabled={!canManage}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, methodology, cohort characteristics, or ethical notes..."
              className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors disabled:opacity-60 leading-relaxed"
            />
          </div>

          {/* Dates & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Start Date
              </label>
              <input
                type="date"
                disabled={!canManage}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-2xs transition-colors text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Target End Date
              </label>
              <input
                type="date"
                disabled={!canManage}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-2xs transition-colors text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                Visibility &amp; Access
              </label>
              <select
                disabled={!canManage}
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-2xs transition-colors text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              >
                <option value="INTERNAL">Internal Team Only (Confidential)</option>
                <option value="PUBLIC">Public Scientific Catalog</option>
                <option value="CONFIDENTIAL">Strictly Confidential (High-Security)</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          {canManage && (
            <div className="flex items-center justify-end pt-3 border-t border-border/60">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Protocol Settings</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── CARD 2: RESEARCH LIFECYCLE & PHASE CONTROLS ── */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Research Lifecycle &amp; Phase</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Progression stage tracking</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Phase Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Current Research Phase</label>
              <select
                disabled={!canManage}
                value={currentPhase}
                onChange={(e) => setCurrentPhase(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-2xs transition-colors text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              >
                {RESEARCH_PHASES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Updates milestone grouping and progress indicators across the workspace.
              </p>
            </div>

            {/* Status Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Project Operational Status</label>
              <select
                disabled={!canManage}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-2xs transition-colors text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Setting to On Hold pauses automated task reminders and active recruitment notices.
              </p>
            </div>
          </div>

          {/* Quick Phase Progress Chips */}
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Fast Transition Phase
            </span>
            <div className="flex flex-wrap gap-1.5">
              {RESEARCH_PHASES.map((p) => {
                const isSelected = currentPhase === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!canManage}
                    onClick={() => setCurrentPhase(p.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-600 text-white font-semibold shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Status/Phase Button */}
          {canManage && (
            <div className="flex items-center justify-end pt-3 border-t border-border/60">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Update Lifecycle &amp; Status</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </form>

      {/* ── CARD 3: DANGER ZONE & ADMINISTRATIVE ACTIONS ── */}
      {canManage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-rose-500/20 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Danger Zone</h3>
            </div>
            <span className="text-[11px] font-medium text-rose-600/80">Irreversible actions</span>
          </div>

          <div className="space-y-4">
            {/* Archive Project Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-rose-500/20 bg-background/60">
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  {isArchived ? "Unarchive Research Project" : "Archive Research Project"}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isArchived
                    ? "Restore this project to active workspace views and resume team collaboration."
                    : "Archived projects become read-only and hidden from default project listings."}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const newArchived = !isArchived;
                  setIsArchived(newArchived);
                  try {
                    await fetch(`/api/projects/${project.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isArchived: newArchived }),
                    });
                    onProjectUpdated();
                  } catch {}
                }}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{isArchived ? "Unarchive" : "Archive Project"}</span>
              </button>
            </div>

            {/* Permanent Deletion Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/10">
              <div>
                <h4 className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  Permanently Delete Project
                </h4>
                <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 mt-0.5">
                  Permanently removes this research project, all tasks, milestones, discussions, decisions, and files.
                  This action is irreversible.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
