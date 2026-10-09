"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FolderKanban,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  FileText,
  Sparkles,
  Activity,
  MessageSquare,
  Scale,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Lock,
  Globe2,
  MoreVertical,
  Download,
  Trash2,
  Send,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Layers,
  FileCode,
  Tag,
  Paperclip,
  Check,
  Info,
} from "lucide-react";

interface ProjectWorkspaceClientProps {
  projectId: string;
  currentUserId: string;
}

interface ProjectMilestoneView {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  phase: string;
  isCompleted: boolean;
  tasks?: { id: string }[];
}

interface ProjectNoteView {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  updatedAt: string;
  author?: { name: string | null } | null;
}

interface ProjectDiscussionReplyView {
  id: string;
  content: string;
  createdAt: string;
  author?: { name: string | null } | null;
}

interface ProjectDiscussionView {
  id: string;
  title: string;
  content: string;
  category: string;
  isResolved: boolean;
  createdAt: string;
  author?: { id: string; name: string | null } | null;
  replies?: ProjectDiscussionReplyView[];
}

interface ProjectDecisionView {
  id: string;
  decisionNumber: number;
  decision: string;
  reason: string | null;
  relatedDoc: string | null;
  status: string;
  date: string;
  madeBy?: { name: string | null } | null;
}

interface ProjectOutputView {
  id: string;
  title: string;
  type: string;
  status: string;
  targetJournal: string | null;
  submissionDeadline: string | null;
  linkUrl: string | null;
  fileUrl: string | null;
}

interface ProjectChatMessageView {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { name: string | null } | null;
}

const LIFECYCLE_PHASES = [
  "IDEA",
  "PLANNING",
  "LITERATURE_REVIEW",
  "PROTOCOL",
  "ETHICS_APPROVAL",
  "DATA_COLLECTION",
  "DATA_CLEANING",
  "ANALYSIS",
  "MANUSCRIPT",
  "SUBMISSION",
  "PUBLICATION",
  "COMPLETED",
];

const FILE_FOLDERS = [
  { id: "ALL", label: "All Files" },
  { id: "PROTOCOL", label: "Protocols & SOPs" },
  { id: "ETHICS", label: "Ethics & IRB Documents" },
  { id: "LITERATURE", label: "Literature & References" },
  { id: "DATA", label: "Raw Data (Sensitive)" },
  { id: "ANALYSIS", label: "Statistical Analysis" },
  { id: "MANUSCRIPT", label: "Manuscript Drafts" },
  { id: "FIGURES", label: "Figures & Tables" },
  { id: "OTHER", label: "Other Materials" },
];

export function ProjectWorkspaceClient({ projectId, currentUserId }: ProjectWorkspaceClientProps) {
  const [project, setProject] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "tasks"
    | "team"
    | "files"
    | "studies"
    | "records"
    | "ai"
  >("overview");
  const [recordTab, setRecordTab] = useState<"milestones" | "notes" | "discussions" | "decisions" | "outputs" | "chat">("milestones");

  // Tab sub-states
  const [taskView, setTaskView] = useState<"kanban" | "list">("kanban");
  const [fileFolderFilter, setFileFolderFilter] = useState("ALL");
  const [notesCategoryFilter, setNotesCategoryFilter] = useState("ALL");

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [showOutputModal, setShowOutputModal] = useState(false);

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskPhase, setTaskPhase] = useState("PLANNING");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("RESEARCHER");
  const [inviteMessage, setInviteMessage] = useState("");

  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDesc, setMilestoneDesc] = useState("");
  const [milestoneDeadline, setMilestoneDeadline] = useState("");
  const [milestonePhase, setMilestonePhase] = useState("PLANNING");

  const [decisionText, setDecisionText] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionRelatedDoc, setDecisionRelatedDoc] = useState("");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState("Protocol Decisions");

  const [discTitle, setDiscTitle] = useState("");
  const [discContent, setDiscContent] = useState("");
  const [discCategory, setDiscCategory] = useState("General");
  const [activeDiscussion, setActiveDiscussion] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");

  // Chat state
  const [chatMessages, setChatMessages] = useState<ProjectChatMessageView[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Studies state
  const [availableStudies, setAvailableStudies] = useState<any[]>([]);
  const [selectedStudyToLink, setSelectedStudyToLink] = useState("");
  const [studyLinkNotes, setStudyLinkNotes] = useState("");

  // Outputs state
  const [outputTitle, setOutputTitle] = useState("");
  const [outputType, setOutputType] = useState("RESEARCH_PAPER");
  const [outputJournal, setOutputJournal] = useState("");
  const [outputDeadline, setOutputDeadline] = useState("");

  // AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiHistory, setAiHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModel, setAiModel] = useState("gemini");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  async function fetchProject(showLoading = true) {
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        throw new Error("Failed to load project workspace");
      }
      const data = await res.json();
      setProject(data.project);
      setAuth(data.auth);
      setTaskPhase(data.project.currentPhase || "PLANNING");
      setMilestonePhase(data.project.currentPhase || "PLANNING");
    } catch (err: any) {
      if (showLoading) {
        setError(err.message || "An error occurred");
      } else {
        setActionError("Your change was saved, but the project could not refresh. Reload to see the latest data.");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function mutateProjectResource(
    path: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: Record<string, unknown>,
    fallbackMessage = "The project could not be updated."
  ) {
    setActionError(null);
    try {
      const response = await fetch(path, {
        method,
        ...(body ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        } : {}),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || fallbackMessage);
      await fetchProject(false);
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : fallbackMessage);
      return false;
    }
  }

  

  async function fetchChatMessages() {
    setChatLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Project chat could not be loaded.");
      setChatMessages(data.messages || []);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Project chat could not be loaded.");
    } finally {
      setChatLoading(false);
    }
  }

  // Load available studies when opening studies modal
  useEffect(() => {
    if (showStudyModal) {
      fetchStudies();
    }
  }, [showStudyModal]);

  async function fetchStudies() {
    try {
      const res = await fetch(`/api/projects/${projectId}/studies`);
      if (res.ok) {
        const data = await res.json();
        setAvailableStudies(data.availableStudies || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Phase advance / update
  async function handlePhaseChange(newPhase: string) {
    if (!auth?.canManageProject) return;
    await mutateProjectResource(`/api/projects/${projectId}`, "PATCH", { currentPhase: newPhase }, "Project phase could not be updated.");
  }

  // Task creation
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const saved = await mutateProjectResource(
      `/api/projects/${projectId}/tasks`,
      "POST",
      {
          title: taskTitle.trim(),
          description: taskDesc.trim() || null,
          priority: taskPriority,
          phase: taskPhase,
          assigneeId: taskAssignee || null,
          dueDate: taskDueDate || null,
      },
      "Task could not be created."
    );
    if (saved) {
      setShowTaskModal(false);
      setTaskTitle("");
      setTaskDesc("");
    }
  }

  // Task status toggle
  async function handleTaskStatusChange(taskId: string, newStatus: string) {
    await mutateProjectResource(`/api/projects/${projectId}/tasks/${taskId}`, "PATCH", { status: newStatus }, "Task status could not be updated.");
  }

  // Milestone toggle
  async function handleToggleMilestone(milestoneId: string, currentVal: boolean) {
    await mutateProjectResource(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      "PATCH",
      { isCompleted: !currentVal },
      "Milestone status could not be changed."
    );
  }

  // Add Milestone
  async function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    const saved = await mutateProjectResource(
      `/api/projects/${projectId}/milestones`,
      "POST",
      {
        title: milestoneTitle.trim(),
        description: milestoneDesc.trim() || null,
        phase: milestonePhase,
        deadline: milestoneDeadline || null,
      },
      "Milestone could not be created."
    );
    if (saved) {
      setShowMilestoneModal(false);
      setMilestoneTitle("");
      setMilestoneDesc("");
      setMilestoneDeadline("");
    }
  }

  async function handleDeleteMilestone(milestoneId: string, title: string) {
    if (!window.confirm(`Delete milestone "${title}"?`)) return;
    await mutateProjectResource(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      "DELETE",
      undefined,
      "Milestone could not be deleted."
    );
  }

  // Send Invitation
  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const saved = await mutateProjectResource(
      `/api/projects/${projectId}/members`,
      "POST",
      {
          email: inviteEmail.trim(),
          role: inviteRole,
          message: inviteMessage.trim() || null,
      },
      "Invitation could not be sent."
    );
    if (saved) {
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteMessage("");
    }
  }

  // Log Methodological Decision
  async function handleCreateDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!decisionText.trim()) return;
    const saved = await mutateProjectResource(
      `/api/projects/${projectId}/decisions`,
      "POST",
      {
        decision: decisionText.trim(),
        reason: decisionReason.trim() || null,
        relatedDoc: decisionRelatedDoc.trim() || null,
      },
      "Decision could not be recorded."
    );
    if (saved) {
      setShowDecisionModal(false);
      setDecisionText("");
      setDecisionReason("");
      setDecisionRelatedDoc("");
    }
  }

  // Create Note
  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    const saved = await mutateProjectResource(
      `/api/projects/${projectId}/notes`,
      "POST",
      { title: noteTitle.trim(), content: noteContent.trim(), category: noteCategory },
      "Research note could not be saved."
    );
    if (saved) {
      setShowNoteModal(false);
      setNoteTitle("");
      setNoteContent("");
    }
  }

  async function handleToggleNotePinned(noteId: string, isPinned: boolean) {
    await mutateProjectResource(
      `/api/projects/${projectId}/notes/${noteId}`,
      "PATCH",
      { isPinned: !isPinned },
      "Note pin status could not be changed."
    );
  }

  async function handleDeleteNote(noteId: string, title: string) {
    if (!window.confirm(`Delete note "${title}"?`)) return;
    await mutateProjectResource(
      `/api/projects/${projectId}/notes/${noteId}`,
      "DELETE",
      undefined,
      "Research note could not be deleted."
    );
  }

  // Create Discussion Thread
  async function handleCreateDiscussion(e: React.FormEvent) {
    e.preventDefault();
    if (!discTitle.trim() || !discContent.trim()) return;
    const saved = await mutateProjectResource(
      `/api/projects/${projectId}/discussions`,
      "POST",
      { title: discTitle.trim(), content: discContent.trim(), category: discCategory },
      "Discussion could not be posted."
    );
    if (saved) {
      setShowDiscussionModal(false);
      setDiscTitle("");
      setDiscContent("");
    }
  }

  async function handleToggleDiscussionResolved(discussionId: string, isResolved: boolean) {
    await mutateProjectResource(
      `/api/projects/${projectId}/discussions/${discussionId}`,
      "PATCH",
      { isResolved: !isResolved },
      "Discussion status could not be changed."
    );
  }

  async function handleDeleteDiscussion(discussionId: string, title: string) {
    if (!window.confirm(`Delete discussion "${title}"?`)) return;
    await mutateProjectResource(
      `/api/projects/${projectId}/discussions/${discussionId}`,
      "DELETE",
      undefined,
      "Discussion could not be deleted."
    );
  }

  // Reply to Discussion
  async function handleReplyDiscussion(discussionId: string) {
    if (!replyContent.trim()) return;
    const saved = await mutateProjectResource(
      `/api/projects/${projectId}/discussions/${discussionId}/reply`,
      "POST",
      { content: replyContent.trim() },
      "Reply could not be posted."
    );
    if (saved) setReplyContent("");
  }

  async function handleUpdateOutputStatus(outputId: string, status: string) {
    await mutateProjectResource(
      `/api/projects/${projectId}/outputs/${outputId}`,
      "PATCH",
      { status },
      "Deliverable status could not be changed."
    );
  }

  // Send Chat message
  async function handleSendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: chatInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Message could not be sent.");
      setChatInput("");
      await fetchChatMessages();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Message could not be sent.");
    }
  }

  // Link Study
  async function handleLinkStudy(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudyToLink) return;
    const saved = await mutateProjectResource(
      `/api/projects/${projectId}/studies`,
      "POST",
      {
          studyId: selectedStudyToLink,
          notes: studyLinkNotes.trim() || null,
      },
      "Study could not be linked."
    );
    if (saved) {
      setShowStudyModal(false);
      setSelectedStudyToLink("");
      setStudyLinkNotes("");
    }
  }

  // Add Output
  async function handleCreateOutput(e: React.FormEvent) {
    e.preventDefault();
    if (!outputTitle.trim()) return;
    const saved = await mutateProjectResource(
      `/api/projects/${projectId}/outputs`,
      "POST",
      {
        title: outputTitle.trim(),
        type: outputType,
        targetJournal: outputJournal.trim() || null,
        submissionDeadline: outputDeadline || null,
      },
      "Deliverable could not be created."
    );
    if (saved) {
      setShowOutputModal(false);
      setOutputTitle("");
      setOutputJournal("");
      setOutputDeadline("");
    }
  }

  // AI Prompt execution
  async function handleAskAI(customQuery?: string, actionType?: string) {
    const query = customQuery || aiPrompt;
    if (!query.trim() && !actionType) return;

    setAiLoading(true);
    const newHistory = [...aiHistory, { role: "user", content: query || `Execute: ${actionType}` }];
    setAiHistory(newHistory);
    setAiPrompt("");

    try {
      const res = await fetch(`/api/projects/${projectId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          action: actionType,
          history: aiHistory,
          model: aiModel,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiHistory([
          ...newHistory,
          { role: "assistant", content: data.reply || "No response received." },
        ]);
      } else {
        setAiHistory([
          ...newHistory,
          { role: "assistant", content: `Error: ${data.error || "Failed to generate AI response"}` },
        ]);
      }
    } catch (err: any) {
      setAiHistory([
        ...newHistory,
        { role: "assistant", content: `Error connecting to Project AI: ${err.message}` },
      ]);
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading Research Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Workspace Unavailable</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{error || "Project not found or access denied."}</p>
          <Link
            href="/projects"
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const progress = project.progress || project.stats || {
    percentage: 0,
    taskPercentage: 0,
    milestonePercentage: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalMilestones: 0,
    completedMilestones: 0,
    health: "ON_TRACK",
  };
  const currentPhase = project.currentPhase || "PLANNING";
  const currentPhaseIndex = Math.max(0, LIFECYCLE_PHASES.indexOf(currentPhase));
  const phaseProgress = ((currentPhaseIndex + 1) / LIFECYCLE_PHASES.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Workspace Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Research projects
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  progress.health === "ON_TRACK"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    : progress.health === "ATTENTION_NEEDED"
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                }`}
              >
                {progress.health === "ON_TRACK"
                  ? "On Track"
                  : progress.health === "ATTENTION_NEEDED"
                  ? "Attention Needed"
                  : "At Risk"}
              </span>

              {project.visibility === "PUBLIC" ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  <Globe2 className="w-3 h-3" />
                  Public
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  <Lock className="w-3 h-3" />
                  Team
                </span>
              )}
            </div>
          </div>

          {/* Title & Quick Actions */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {project.title}
                </h1>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {project.studyDesign || project.category}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Led by <span className="font-medium text-foreground">{project.lead?.name || "Research team"}</span>
                {project.institution ? ` · ${project.institution}` : ""}
                {project.category ? ` · ${project.category}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab("ai")}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Ask AI
              </button>

              {auth?.canEditTasks && (
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  New Task
                </button>
              )}

              {auth?.canManageTeam && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Users className="h-4 w-4" />
                  Invite
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
              <label htmlFor="project-phase" className="text-xs font-medium text-muted-foreground">Research phase</label>
              <select
                id="project-phase"
                value={currentPhase}
                disabled={!auth?.canManageProject}
                onChange={(event) => handlePhaseChange(event.target.value)}
                className="min-w-0 max-w-full flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm font-medium text-foreground disabled:cursor-default disabled:opacity-100 sm:flex-none"
              >
                {LIFECYCLE_PHASES.map((phase) => <option key={phase} value={phase}>{phase.replace(/_/g, " ")}</option>)}
              </select>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{currentPhaseIndex + 1} of {LIFECYCLE_PHASES.length}</span>
            </div>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Research lifecycle progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(phaseProgress)}>
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${phaseProgress}%` }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab Views */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 2xl:flex-row 2xl:gap-0">
        <nav aria-label="Project sections" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 pb-2 sm:-mx-6 sm:px-6 2xl:sticky 2xl:top-4 2xl:mx-0 2xl:w-52 2xl:shrink-0 2xl:self-start 2xl:flex-col 2xl:overflow-visible 2xl:border-b-0 2xl:border-r 2xl:px-0 2xl:pb-0 2xl:pr-3">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "tasks", label: `Tasks (${project.tasks?.length || 0})`, icon: CheckCircle2 },
            { id: "team", label: `Team (${project.members?.length || 0})`, icon: Users },
            { id: "files", label: `Files & Data (${project.files?.length || 0})`, icon: FileText },
            { id: "studies", label: `Linked Studies (${project.linkedStudies?.length || 0})`, icon: Activity },
            { id: "records", label: "Research Log", icon: BookOpen },
            { id: "ai", label: "Project AI", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors 2xl:w-full ${
                  isActive
                    ? "bg-primary/10 text-primary 2xl:rounded-r-none 2xl:border-r-2 2xl:border-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="min-w-0 flex-1 2xl:pl-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Progress Card */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold uppercase tracking-wider">Project Progress</span>
                  <span className="font-bold text-primary dark:text-primary text-sm">
                    {progress.percentage}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400">Tasks Completed</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {progress.completedTasks} / {progress.totalTasks}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Milestones Reached</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {progress.completedMilestones} / {progress.totalMilestones}
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Protocol Card */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Hypothesis / Research Question
                </span>
                <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {project.researchQuestion || "No research question documented yet. Add PICO question in settings."}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Objective</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {project.objective || "Standard protocol"}
                  </span>
                </div>
              </div>

              {/* Ethics & Compliance Card */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-primary mb-2 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  IRB / Ethics Status
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {project.ethicsApprovalNumber ? `Ref: ${project.ethicsApprovalNumber}` : "Pending Approval / Review"}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {project.ethicsCommittee ? `Committee: ${project.ethicsCommittee}` : "No review board registered."}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Participant health data access segregated</span>
                </div>
              </div>
            </div>

            {/* Upcoming Milestones & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Milestones */}
              <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Key Milestones
                  </h3>
                  
                </div>

                <div className="space-y-3">
                  {project.milestones?.slice(0, 4).map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleMilestone(m.id, m.isCompleted)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            m.isCompleted
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {m.isCompleted && <Check className="w-3 h-3" />}
                        </button>
                        <div>
                          <span
                            className={`font-semibold ${
                              m.isCompleted
                                ? "line-through text-slate-400"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {m.title}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2">Phase: {m.phase}</span>
                        </div>
                      </div>

                      {m.deadline && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {new Date(m.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Log */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Audit Activity
                </h3>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {project.activities?.length === 0 ? (
                    <p className="text-xs text-slate-400">No activity logged yet.</p>
                  ) : (
                    project.activities?.slice(0, 6).map((act: any) => (
                      <div key={act.id} className="text-xs border-l-2 border-indigo-400 pl-2.5 py-1">
                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-snug">
                          {act.description}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.createdAt).toLocaleDateString()} {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TASKS (KANBAN & LIST) */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setTaskView("kanban")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      taskView === "kanban"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Kanban Board
                  </button>
                  <button
                    onClick={() => setTaskView("list")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      taskView === "list"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    List View
                  </button>
                </div>
              </div>

              {auth?.canEditTasks && (
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Research Task
                </button>
              )}
            </div>

            {/* Kanban Columns */}
            {taskView === "kanban" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { id: "TODO", label: "To Do", bg: "bg-slate-100 dark:bg-slate-900/60" },
                  { id: "IN_PROGRESS", label: "In Progress", bg: "bg-primary/5/50 dark:bg-blue-950/20" },
                  { id: "IN_REVIEW", label: "Review & PI Check", bg: "bg-purple-50/50 dark:bg-purple-950/20" },
                  { id: "BLOCKED", label: "Blocked / Ethics Gate", bg: "bg-rose-50/50 dark:bg-rose-950/20" },
                  { id: "COMPLETED", label: "Completed", bg: "bg-emerald-50/50 dark:bg-emerald-950/20" },
                ].map((col) => {
                  const tasksInCol = project.tasks?.filter((t: any) => t.status === col.id) || [];
                  return (
                    <div
                      key={col.id}
                      className={`p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 ${col.bg} flex flex-col`}
                    >
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {col.label}
                        </span>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {tasksInCol.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 flex-1 min-h-[300px]">
                        {tasksInCol.map((task: any) => (
                          <div
                            key={task.id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-xs"
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  task.priority === "URGENT"
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                    : task.priority === "HIGH"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {task.priority}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">{task.phase}</span>
                            </div>

                            <h4 className="font-semibold text-slate-900 dark:text-white leading-snug">
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Footer */}
                            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                              <span>{task.assignee?.name || "Unassigned"}</span>
                              {auth?.canEditTasks && (
                                <select
                                  value={task.status}
                                  onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                                  className="text-[10px] rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-0.5"
                                >
                                  <option value="TODO">To Do</option>
                                  <option value="IN_PROGRESS">Progress</option>
                                  <option value="IN_REVIEW">Review</option>
                                  <option value="BLOCKED">Blocked</option>
                                  <option value="COMPLETED">Done</option>
                                </select>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-xs">
                {project.tasks?.map((task: any) => (
                  <div key={task.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handleTaskStatusChange(
                            task.id,
                            task.status === "COMPLETED" ? "TODO" : "COMPLETED"
                          )
                        }
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {task.status === "COMPLETED" && <Check className="w-3 h-3" />}
                      </button>
                      <div>
                        <h4
                          className={`font-semibold ${
                            task.status === "COMPLETED"
                              ? "line-through text-slate-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>Phase: {task.phase}</span>
                          <span>•</span>
                          <span>Priority: {task.priority}</span>
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {task.assignee?.name || "Unassigned"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MILESTONES & TIMELINE */}
        

        {/* TAB 4: TEAM & PERMISSIONS */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Collaborator Directory & Access Controls
                </h3>
                <p className="text-xs text-slate-500">
                  Manage research investigators, analysts, coordinators, and sensitive patient data clearance.
                </p>
              </div>
              {auth?.canManageTeam && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold"
                >
                  <Users className="w-3.5 h-3.5" />
                  Invite Collaborator
                </button>
              )}
            </div>

            {/* Team Directory Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members?.map((member: any) => {
                const canAccessHealth = [
                  "PROJECT_OWNER",
                  "PRINCIPAL_INVESTIGATOR",
                  "DATA_ANALYST",
                ].includes(member.role);
                return (
                  <div
                    key={member.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm uppercase">
                        {member.user.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {member.user.name}
                        </h4>
                        <span className="text-[11px] text-slate-500">{member.user.email}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Research Role:</span>
                        <span className="font-bold text-primary dark:text-primary">
                          {member.role.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Health Data Clearance:</span>
                        {canAccessHealth ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <ShieldCheck className="w-3 h-3" />
                            Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                            <Lock className="w-3 h-3" />
                            Restricted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: FILES & DATA REPOSITORY */}
        {activeTab === "files" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Research Document & Data Repository
                </h3>
                <p className="text-xs text-slate-500">
                  Organized academic directories with version history and sensitive health data isolation.
                </p>
              </div>
            </div>

            {/* Folder Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-medium">
              {FILE_FOLDERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFileFolderFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                    fileFolderFilter === f.id
                      ? "bg-primary text-white border-primary font-semibold"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sensitive Data Notice */}
            {fileFolderFilter === "DATA" && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Protected Health Information (PHI) Notice</h4>
                  <p className="mt-0.5 leading-relaxed">
                    This directory is reserved for clinical, participant, or observational microdata. Only team members with verified health data clearance (PI or Data Analyst) can view unmasked download URLs.
                  </p>
                </div>
              </div>
            )}

            {/* Files List */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-xs">
              {project.files?.filter((f: any) =>
                fileFolderFilter === "ALL" ? true : f.folder === fileFolderFilter
              ).length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No files uploaded in this folder yet.
                </div>
              ) : (
                project.files
                  ?.filter((f: any) =>
                    fileFolderFilter === "ALL" ? true : f.folder === fileFolderFilter
                  )
                  .map((file: any) => (
                    <div key={file.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {file.name}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                              v{file.version}
                            </span>
                            {file.isSensitiveHealthData && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Sensitive PHI
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Uploaded by {file.uploader?.name || "Team Member"} • {file.folder}
                          </span>
                        </div>
                      </div>

                      {file.fileUrl ? (
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/5 hover:text-primary transition-colors font-medium text-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Access Restricted
                        </span>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: NOTES & WIKI */}
        

        {/* TAB 7: DISCUSSIONS & CHAT */}
        

        {/* TAB 8: DECISION LOG */}
        

        {/* TAB 9: LINKED STUDIES */}
        {(activeTab === "studies" || activeTab === "records") && (
          <div className="space-y-6">
            <div className={activeTab === "records" ? "hidden" : "flex items-center justify-between"}>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Connected Tinat Data-Collection Studies
                </h3>
              </div>
            </div>

            {activeTab === "records" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Research log</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Keep project milestones, working notes, team discussion, decisions, and deliverables together.
                  </p>
                </div>

                <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800" role="tablist" aria-label="Research log sections">
                  {([
                    ["milestones", "Milestones", project.milestones?.length || 0],
                    ["notes", "Notes", project.notes?.length || 0],
                    ["discussions", "Discussions", project.discussions?.length || 0],
                    ["chat", "Team chat", chatMessages.length],
                    ["decisions", "Decision log", project.decisions?.length || 0],
                    ["outputs", "Deliverables", project.outputs?.length || 0],
                  ] as const).map(([id, label, count]) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={recordTab === id}
                      onClick={() => {
                        setRecordTab(id);
                        setActionError(null);
                        if (id === "chat") void fetchChatMessages();
                      }}
                      className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                        recordTab === id
                          ? "border-primary text-primary"
                          : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {label} <span className="ml-1 text-xs text-slate-400">{count}</span>
                    </button>
                  ))}
                </div>

                {recordTab === "milestones" && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Project milestones</h3>
                        <p className="text-sm text-slate-500">Track major research checkpoints and completion.</p>
                      </div>
                      {(auth?.canManageProject || auth?.canMakeDecisions) && (
                        <button onClick={() => setShowMilestoneModal(true)} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">
                          <Plus className="h-4 w-4" /> Add milestone
                        </button>
                      )}
                    </div>
                    {project.milestones?.length ? (
                      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                        {project.milestones.map((milestone: ProjectMilestoneView) => (
                          <div key={milestone.id} className="flex items-start gap-3 p-4">
                            <button
                              type="button"
                              disabled={!auth?.canEditTasks && !auth?.canManageProject}
                              onClick={() => handleToggleMilestone(milestone.id, milestone.isCompleted)}
                              aria-label={`${milestone.isCompleted ? "Reopen" : "Complete"} ${milestone.title}`}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${milestone.isCompleted ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 dark:border-slate-600"} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {milestone.isCompleted && <Check className="h-3.5 w-3.5" />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <h4 className={`font-medium ${milestone.isCompleted ? "text-slate-500 line-through" : "text-slate-900 dark:text-white"}`}>{milestone.title}</h4>
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{milestone.phase?.replace(/_/g, " ")}</span>
                              </div>
                              {milestone.description && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{milestone.description}</p>}
                              <p className="mt-2 text-xs text-slate-500">
                                {milestone.deadline ? `Due ${new Date(milestone.deadline).toLocaleDateString()}` : "No due date"}
                                {milestone.tasks?.length ? ` · ${milestone.tasks.length} linked task${milestone.tasks.length === 1 ? "" : "s"}` : ""}
                              </p>
                            </div>
                            {auth?.canManageProject && (
                              <button type="button" onClick={() => handleDeleteMilestone(milestone.id, milestone.title)} aria-label={`Delete ${milestone.title}`} className="rounded p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
                        No milestones yet. Add the first checkpoint for this project.
                      </div>
                    )}
                  </section>
                )}

                {recordTab === "notes" && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Research notes</h3>
                        <p className="text-sm text-slate-500">Store meeting notes, literature observations, and protocol details.</p>
                      </div>
                      {(auth?.canEditTasks || auth?.canMakeDecisions) && (
                        <button onClick={() => setShowNoteModal(true)} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> New note</button>
                      )}
                    </div>
                    {project.notes?.length ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {project.notes.map((note: ProjectNoteView) => (
                          <article key={note.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-semibold text-slate-900 dark:text-white">{note.title}</h4>
                                  {note.isPinned && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Pinned</span>}
                                </div>
                                <p className="mt-1 text-xs text-slate-500">{note.category} · {note.author?.name || "Research team"} · {new Date(note.updatedAt).toLocaleDateString()}</p>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                {(auth?.canEditTasks || auth?.canMakeDecisions) && <button type="button" onClick={() => handleToggleNotePinned(note.id, note.isPinned)} className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{note.isPinned ? "Unpin" : "Pin"}</button>}
                                {(auth?.canManageProject || auth?.canMakeDecisions) && <button type="button" onClick={() => handleDeleteNote(note.id, note.title)} aria-label={`Delete note ${note.title}`} className="rounded p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" /></button>}
                              </div>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">{note.content}</p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">No notes yet. Create a shared research note for the team.</div>
                    )}
                  </section>
                )}

                {recordTab === "discussions" && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Team discussions</h3>
                        <p className="text-sm text-slate-500">Discuss study methods and keep replies attached to their topic.</p>
                      </div>
                      <button onClick={() => setShowDiscussionModal(true)} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Start discussion</button>
                    </div>
                    {project.discussions?.length ? (
                      <div className="space-y-3">
                        {project.discussions.map((discussion: ProjectDiscussionView) => (
                          <article key={discussion.id} className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            <div className="p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">{discussion.title}</h4>
                                    <span className={`rounded px-2 py-0.5 text-xs ${discussion.isResolved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{discussion.isResolved ? "Resolved" : "Open"}</span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500">{discussion.category} · {discussion.author?.name || "Research team"} · {new Date(discussion.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => setActiveDiscussion(activeDiscussion === discussion.id ? null : discussion.id)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-primary hover:bg-primary/5">
                                    <MessageSquare className="h-4 w-4" /> {discussion.replies?.length || 0} replies
                                  </button>
                                  {(auth?.canManageProject || discussion.author?.id === currentUserId) && <button type="button" onClick={() => handleToggleDiscussionResolved(discussion.id, discussion.isResolved)} className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{discussion.isResolved ? "Reopen" : "Resolve"}</button>}
                                  {(auth?.canManageProject || discussion.author?.id === currentUserId) && <button type="button" onClick={() => handleDeleteDiscussion(discussion.id, discussion.title)} aria-label={`Delete discussion ${discussion.title}`} className="rounded p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" /></button>}
                                </div>
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">{discussion.content}</p>
                            </div>
                            {activeDiscussion === discussion.id && (
                              <div className="space-y-3 border-t border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                                {discussion.replies?.map((reply: ProjectDiscussionReplyView) => (
                                  <div key={reply.id} className="rounded-md bg-white p-3 dark:bg-slate-900">
                                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{reply.content}</p>
                                    <p className="mt-2 text-xs text-slate-500">{reply.author?.name || "Team member"} · {new Date(reply.createdAt).toLocaleString()}</p>
                                  </div>
                                ))}
                                <form onSubmit={(event) => { event.preventDefault(); handleReplyDiscussion(discussion.id); }} className="flex gap-2">
                                  <input value={replyContent} onChange={(event) => setReplyContent(event.target.value)} aria-label={`Reply to ${discussion.title}`} placeholder="Write a reply..." className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                  <button type="submit" disabled={!replyContent.trim()} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"><Send className="h-4 w-4" /> Reply</button>
                                </form>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">No discussions yet. Start a thread to gather the team’s input.</div>
                    )}
                  </section>
                )}

                  {recordTab === "chat" && (
                    <section className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Project team chat</h3>
                        <p className="text-sm text-slate-500">Quick coordination messages for the project team.</p>
                      </div>
                      <div className="flex h-[min(55vh,560px)] min-h-[280px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
                          {chatLoading ? (
                            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading messages...</div>
                          ) : chatMessages.length ? chatMessages.map((message) => (
                            <div key={message.id} className={`max-w-[90%] rounded-lg border p-3 sm:max-w-[75%] ${message.senderId === currentUserId ? "ml-auto border-primary/20 bg-primary/5" : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"}`}>
                              <p className="whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200">{message.content}</p>
                              <p className="mt-2 text-xs text-slate-500">{message.sender?.name || "Team member"} · {new Date(message.createdAt).toLocaleString()}</p>
                            </div>
                          )) : (
                            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">No messages yet. Start the project conversation.</div>
                          )}
                        </div>
                        <form onSubmit={handleSendChatMessage} className="flex shrink-0 gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
                          <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} aria-label="Project chat message" placeholder="Write a message to the team..." className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" />
                          <button type="submit" disabled={!chatInput.trim()} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"><Send className="h-4 w-4" /> Send</button>
                        </form>
                      </div>
                      {chatMessages.length >= 150 && <p className="text-xs text-slate-500">Showing the 150 most recent project messages.</p>}
                    </section>
                  )}

                {recordTab === "decisions" && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Methodological decisions</h3>
                        <p className="text-sm text-slate-500">Record the rationale behind important changes to the research plan.</p>
                      </div>
                      {auth?.canMakeDecisions && <button onClick={() => setShowDecisionModal(true)} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Log decision</button>}
                    </div>
                    {project.decisions?.length ? (
                      <ol className="space-y-3">
                        {project.decisions.map((decision: ProjectDecisionView) => (
                          <li key={decision.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-primary">Decision #{decision.decisionNumber}</span>
                                <span className={`rounded px-2 py-0.5 text-xs ${decision.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{decision.status}</span>
                              </div>
                              <span className="text-xs text-slate-500">{new Date(decision.date).toLocaleDateString()} · {decision.madeBy?.name || "Research lead"}</span>
                            </div>
                            <p className="mt-3 font-medium text-slate-900 dark:text-white">{decision.decision}</p>
                            {decision.reason && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{decision.reason}</p>}
                            {decision.relatedDoc && <p className="mt-2 text-xs text-slate-500">Reference: {decision.relatedDoc}</p>}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">No methodological decisions recorded yet.</div>
                    )}
                  </section>
                )}

                {recordTab === "outputs" && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Research deliverables</h3>
                        <p className="text-sm text-slate-500">Track papers, abstracts, datasets, and publication status.</p>
                      </div>
                      {auth?.canEditTasks && <button onClick={() => setShowOutputModal(true)} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Add deliverable</button>}
                    </div>
                    {project.outputs?.length ? (
                      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                        {project.outputs.map((output: ProjectOutputView) => {
                          const deliverableUrl = output.linkUrl || output.fileUrl;
                          return (
                            <div key={output.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <h4 className="font-semibold text-slate-900 dark:text-white">{output.title}</h4>
                                <p className="mt-1 text-xs text-slate-500">{output.type.replace(/_/g, " ")}{output.targetJournal ? ` · ${output.targetJournal}` : ""}{output.submissionDeadline ? ` · Due ${new Date(output.submissionDeadline).toLocaleDateString()}` : ""}</p>
                                {deliverableUrl && <a href={deliverableUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Open deliverable</a>}
                              </div>
                              {auth?.canEditTasks ? (
                                <label className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                                  Status
                                  <select value={output.status} onChange={(event) => handleUpdateOutputStatus(output.id, event.target.value)} className="rounded-md border border-input bg-background px-2.5 py-2 text-sm text-foreground">
                                    <option value="DRAFT">Draft</option>
                                    <option value="IN_REVIEW">In review</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="ACCEPTED">Accepted</option>
                                    <option value="PUBLISHED">Published</option>
                                  </select>
                                </label>
                              ) : (
                                <span className="rounded bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground">{output.status.replace(/_/g, " ")}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">No deliverables registered yet.</div>
                    )}
                  </section>
                )}
              </div>
            )}
              <div className={activeTab === "records" ? "hidden" : "flex items-center justify-between"}>
                <div>
                <p className="text-xs text-slate-500">
                  Link live clinical surveys, trials, or questionnaires created on Tinat to automatically track recruitment.
                </p>
              </div>
              {auth?.canManageStudies && (
                <button
                  onClick={() => setShowStudyModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Connect Study
                </button>
              )}
            </div>

            <div className={activeTab === "records" ? "hidden" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
              {project.linkedStudies?.length === 0 ? (
                <div className="col-span-full p-6 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No data-collection studies linked to this project yet. Connect a study to see live participant metrics.
                </div>
              ) : (
                project.linkedStudies?.map((ls: any) => (
                  <div
                    key={ls.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {ls.study.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {ls.study.status}
                      </span>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                      {ls.study.description || "Tinat participant data collection study"}
                    </p>

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center mb-3">
                      <div>
                        <div className="text-base font-bold text-primary dark:text-primary">
                          {ls.study._count?.responses || 0}
                        </div>
                        <span className="text-[10px] text-slate-400">Participant Responses</span>
                      </div>
                      <div>
                        <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                          {ls.study._count?.questions || 0}
                        </div>
                        <span className="text-[10px] text-slate-400">Instrument Questions</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                      <span>Linked by {ls.linkedBy?.name}</span>
                      <Link
                        href={`/researcher/studies`}
                        className="text-primary dark:text-primary font-semibold flex items-center gap-1 hover:underline"
                      >
                        Open In Study Manager <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 10: OUTPUTS & MANUSCRIPT */}
        

        {/* TAB 11: ASK PROJECT AI */}
        {activeTab === "ai" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Project assistant
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask about this project or choose a research task to get started.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  id: "SUMMARIZE_STATUS",
                  label: "Executive Summary",
                  desc: "Current progress & blockers",
                },
                {
                  id: "CHECK_ETHICS_GAPS",
                  label: "Ethics & Compliance Audit",
                  desc: "IRB & STROBE/CONSORT checks",
                },
                {
                  id: "GENERATE_MANUSCRIPT_OUTLINE",
                  label: "IMRAD Manuscript Outline",
                  desc: "Publication draft scaffolding",
                },
                {
                  id: "DRAFT_TASK_BREAKDOWN",
                  label: "Suggest Next Phase Tasks",
                  desc: "Concrete actionable tasks",
                },
              ].map((act) => (
                <button
                  key={act.id}
                  disabled={aiLoading}
                  onClick={() => handleAskAI(undefined, act.id)}
                  title={act.desc}
                  aria-label={`${act.label}: ${act.desc}`}
                  className="rounded-md border border-border bg-card px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <span className="font-medium">{act.label}</span>
                </button>
              ))}
            </div>

            <div className="flex h-[min(58vh,620px)] min-h-[320px] flex-col overflow-hidden rounded-lg border border-border bg-card">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                {aiHistory.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <Sparkles className="mb-2 h-7 w-7 text-primary" />
                    <h4 className="font-semibold text-sm text-foreground">
                      Research, with your project in context
                    </h4>
                    <p className="mt-1 max-w-md text-sm">
                      Ask about project progress, methodology, sample size, or your next steps.
                    </p>
                  </div>
                ) : (
                  aiHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-4 text-sm leading-relaxed ${
                        item.role === "assistant"
                          ? "border-border bg-muted/50 text-foreground"
                          : "ml-8 border-primary/20 bg-primary/5 text-foreground"
                      }`}
                    >
                      <div className="mb-1 text-xs font-semibold text-muted-foreground">
                        {item.role === "assistant" ? "Project AI" : "You"}
                      </div>
                      <div className="whitespace-pre-wrap">{item.content}</div>
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground" role="status">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Reviewing project context...</span>
                  </div>
                )}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleAskAI();
                }}
                className="shrink-0 space-y-2 border-t border-border bg-background p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label htmlFor="project-ai-model" className="text-xs font-medium text-muted-foreground">
                    AI model
                  </label>
                  <select
                    id="project-ai-model"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground sm:w-auto"
                  >
                    <option value="gemini">Google Gemini 3.6 Flash (Recommended)</option>
                    <option value="ling-sante">InclusionAI: Ling Santé MoE (Free)</option>
                    <option value="nemotron">NVIDIA: Nemotron 3 Ultra (Free)</option>
                    <option value="gemma-31b">Google: Gemma 4 31B (Free)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question about this project..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={aiLoading}
                    aria-label="Ask a question about this project"
                    className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </main>

      {actionError && (
        <div role="alert" className="fixed bottom-4 right-4 z-[60] flex max-w-md items-start gap-4 rounded-lg border border-rose-300 bg-white p-4 text-sm text-rose-800 shadow-lg dark:border-rose-900 dark:bg-slate-900 dark:text-rose-200">
          <span className="flex-1">{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="shrink-0 font-semibold underline underline-offset-2">Dismiss</button>
        </div>
      )}

      {/* ===================== MODALS ===================== */}

      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-foreground">Add project milestone</h3>
            <form onSubmit={handleCreateMilestone} className="space-y-4 text-sm">
              <div>
                <label htmlFor="milestone-title" className="mb-1 block font-medium">Title *</label>
                <input id="milestone-title" required value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
              </div>
              <div>
                <label htmlFor="milestone-description" className="mb-1 block font-medium">Description</label>
                <textarea id="milestone-description" rows={3} value={milestoneDesc} onChange={(event) => setMilestoneDesc(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="milestone-phase" className="mb-1 block font-medium">Research phase</label>
                  <select id="milestone-phase" value={milestonePhase} onChange={(event) => setMilestonePhase(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground">
                    {LIFECYCLE_PHASES.map((phase) => <option key={phase} value={phase}>{phase.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="milestone-deadline" className="mb-1 block font-medium">Target date</label>
                  <input id="milestone-deadline" type="date" value={milestoneDeadline} onChange={(event) => setMilestoneDeadline(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="rounded-md border border-border px-3 py-2 font-medium text-foreground">Cancel</button>
                <button type="submit" disabled={!milestoneTitle.trim()} className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50">Save milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Add Research Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct double data-entry check for cohort baseline"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Description / SOP Instructions</label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Ethics / Blocker)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Phase</label>
                  <select
                    value={taskPhase}
                    onChange={(e) => setTaskPhase(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    {LIFECYCLE_PHASES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="">Unassigned</option>
                    {project.members?.map((m: any) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Invite Collaborator to Workspace
            </h3>
            <form onSubmit={handleInviteMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="co-investigator@institution.org"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Research Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <option value="PRINCIPAL_INVESTIGATOR">Co-Principal Investigator (Full Clearance)</option>
                  <option value="RESEARCHER">Co-Investigator / Researcher</option>
                  <option value="DATA_ANALYST">Biostatistician / Data Analyst (PHI Clearance)</option>
                  <option value="RESEARCH_ASSISTANT">Research Assistant / Coordinator</option>
                  <option value="ADVISOR_VIEWER">Academic Advisor / Reviewer (Read Only)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Personal Invitation Message</label>
                <textarea
                  rows={2}
                  placeholder="Please join our study workspace to review the protocol and analysis plan..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Log Methodological Decision
            </h3>
            <form onSubmit={handleCreateDecision} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">Decision Statement *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Switched primary outcome analysis from ANCOVA to linear mixed models due to repeated measurements"
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Scientific Rationale / Literature Citation</label>
                <textarea
                  rows={3}
                  placeholder="Document reason, statistical justification, or committee recommendation..."
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Related Protocol Document / Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Protocol Amendment v2.1 Section 4.2"
                  value={decisionRelatedDoc}
                  onChange={(e) => setDecisionRelatedDoc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold"
                >
                  Record Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Create Research Note
            </h3>
            <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">Note Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meeting Minutes with Biostatistician"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Category</label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <option value="Protocol Decisions">Protocol Decisions</option>
                  <option value="Meeting Notes">Meeting Notes</option>
                  <option value="Literature Notes">Literature Notes</option>
                  <option value="Lab & Field Journal">Lab & Field Journal</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Content (Markdown supported) *</label>
                <textarea
                  rows={6}
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discussion Modal */}
      {showDiscussionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Start Methodological Discussion
            </h3>
            <form onSubmit={handleCreateDiscussion} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">Topic / Question *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handling missing data in follow-up survey: Multiple Imputation vs Complete Case?"
                  value={discTitle}
                  onChange={(e) => setDiscTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Statistical Analysis, Sampling, Protocol"
                  value={discCategory}
                  onChange={(e) => setDiscCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Details & Context *</label>
                <textarea
                  rows={4}
                  required
                  value={discContent}
                  onChange={(e) => setDiscContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDiscussionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold"
                >
                  Post Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Study Modal */}
      {showStudyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Connect Tinat Study
            </h3>
            <form onSubmit={handleLinkStudy} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">Select Study Owned by You *</label>
                {availableStudies.length === 0 ? (
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500">
                    No available studies found. You can create a new data-collection study in the Study Manager.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedStudyToLink}
                    onChange={(e) => setSelectedStudyToLink(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="">Choose a study to connect...</option>
                    {availableStudies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.status} • {s._count?.responses || 0} responses)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1">Purpose / Notes for Team</label>
                <input
                  type="text"
                  placeholder="e.g. Primary questionnaire for Phase 2 urban clinics"
                  value={studyLinkNotes}
                  onChange={(e) => setStudyLinkNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStudyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudyToLink}
                  className="px-5 py-2 rounded-xl bg-primary disabled:opacity-50 text-white font-semibold"
                >
                  Connect Study
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Output Modal */}
      {showOutputModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Add Deliverable / Manuscript
            </h3>
            <form onSubmit={handleCreateOutput} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">Deliverable Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary Clinical Outcomes Manuscript"
                  value={outputTitle}
                  onChange={(e) => setOutputTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Type</label>
                  <select
                    value={outputType}
                    onChange={(e) => setOutputType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="RESEARCH_PAPER">Research Paper</option>
                    <option value="CONFERENCE_ABSTRACT">Conference Abstract</option>
                    <option value="POSTER">Scientific Poster</option>
                    <option value="DATASET">Public Dataset</option>
                    <option value="REPORT">Policy Brief / Report</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Target Journal / Conference</label>
                  <input
                    type="text"
                    placeholder="e.g. The Lancet Global Health"
                    value={outputJournal}
                    onChange={(e) => setOutputJournal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Target Submission Deadline</label>
                <input
                  type="date"
                  value={outputDeadline}
                  onChange={(e) => setOutputDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOutputModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold"
                >
                  Register Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


