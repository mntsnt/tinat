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
    | "milestones"
    | "team"
    | "files"
    | "notes"
    | "discussions"
    | "decisions"
    | "studies"
    | "outputs"
    | "ai"
  >("overview");

  // Tab sub-states
  const [taskView, setTaskView] = useState<"kanban" | "list">("kanban");
  const [fileFolderFilter, setFileFolderFilter] = useState("ALL");
  const [notesCategoryFilter, setNotesCategoryFilter] = useState("ALL");
  const [discussionTab, setDiscussionTab] = useState<"threads" | "chat">("threads");

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
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");

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

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  async function fetchProject() {
    setLoading(true);
    setError(null);
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
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Load chat messages when opening discussions / chat tab
  useEffect(() => {
    if (activeTab === "discussions" && discussionTab === "chat") {
      fetchChatMessages();
    }
  }, [activeTab, discussionTab]);

  async function fetchChatMessages() {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
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
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPhase: newPhase }),
      });
      if (res.ok) {
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Task creation
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim() || null,
          priority: taskPriority,
          phase: taskPhase,
          assigneeId: taskAssignee || null,
          dueDate: taskDueDate || null,
        }),
      });
      if (res.ok) {
        setShowTaskModal(false);
        setTaskTitle("");
        setTaskDesc("");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Task status toggle
  async function handleTaskStatusChange(taskId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Milestone toggle
  async function handleToggleMilestone(milestoneId: string, currentVal: boolean) {
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentVal }),
      });
      if (res.ok) {
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Add Milestone
  async function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: milestoneTitle.trim(),
          description: milestoneDesc.trim() || null,
          phase: milestonePhase,
          deadline: milestoneDeadline || null,
        }),
      });
      if (res.ok) {
        setShowMilestoneModal(false);
        setMilestoneTitle("");
        setMilestoneDesc("");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Send Invitation
  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          message: inviteMessage.trim() || null,
        }),
      });
      if (res.ok) {
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteMessage("");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Log Methodological Decision
  async function handleCreateDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!decisionText.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decisionText.trim(),
          reason: decisionReason.trim() || null,
          relatedDoc: decisionRelatedDoc.trim() || null,
        }),
      });
      if (res.ok) {
        setShowDecisionModal(false);
        setDecisionText("");
        setDecisionReason("");
        setDecisionRelatedDoc("");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Create Note
  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle.trim(),
          content: noteContent.trim(),
          category: noteCategory,
        }),
      });
      if (res.ok) {
        setShowNoteModal(false);
        setNoteTitle("");
        setNoteContent("");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Create Discussion Thread
  async function handleCreateDiscussion(e: React.FormEvent) {
    e.preventDefault();
    if (!discTitle.trim() || !discContent.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: discTitle.trim(),
          content: discContent.trim(),
          category: discCategory,
        }),
      });
      if (res.ok) {
        setShowDiscussionModal(false);
        setDiscTitle("");
        setDiscContent("");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Reply to Discussion
  async function handleReplyDiscussion(discussionId: string) {
    if (!replyContent.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/discussions/${discussionId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      if (res.ok) {
        setReplyContent("");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Send Chat message
  async function handleSendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: chatInput.trim() }),
      });
      if (res.ok) {
        setChatInput("");
        fetchChatMessages();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Link Study
  async function handleLinkStudy(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudyToLink) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/studies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyId: selectedStudyToLink,
          notes: studyLinkNotes.trim() || null,
        }),
      });
      if (res.ok) {
        setShowStudyModal(false);
        setSelectedStudyToLink("");
        setStudyLinkNotes("");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Add Output
  async function handleCreateOutput(e: React.FormEvent) {
    e.preventDefault();
    if (!outputTitle.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/outputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: outputTitle.trim(),
          type: outputType,
          targetJournal: outputJournal.trim() || null,
          submissionDeadline: outputDeadline || null,
        }),
      });
      if (res.ok) {
        setShowOutputModal(false);
        setOutputTitle("");
        setOutputJournal("");
        setOutputDeadline("");
        fetchProject();
      }
    } catch (e) {
      console.error(e);
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
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
        <div className="max-w-md w-full p-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 text-center">
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

  const { progress } = project;
  const currentPhaseIndex = LIFECYCLE_PHASES.indexOf(project.currentPhase);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Workspace Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/projects" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5" />
                Projects
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                {project.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {project.title}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {project.studyDesign || project.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lead: <span className="font-semibold text-slate-700 dark:text-slate-300">{project.lead?.name}</span>
                {project.institution ? ` • ${project.institution}` : ""}
                {project.category ? ` • ${project.category}` : ""}
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab("ai")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask Project AI
              </button>

              {auth?.canEditTasks && (
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Task
                </button>
              )}

              {auth?.canManageTeam && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  Invite
                </button>
              )}
            </div>
          </div>

          {/* Research Lifecycle Stepper */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Research Lifecycle Phase ({currentPhaseIndex + 1}/{LIFECYCLE_PHASES.length})
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {project.currentPhase.replace(/_/g, " ")}
              </span>
            </div>

            {/* Stepper Dots/Bar */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {LIFECYCLE_PHASES.map((phase, idx) => {
                const isPast = idx < currentPhaseIndex;
                const isCurrent = idx === currentPhaseIndex;
                return (
                  <button
                    key={phase}
                    disabled={!auth?.canManageProject}
                    onClick={() => handlePhaseChange(phase)}
                    title={`Phase ${idx + 1}: ${phase.replace(/_/g, " ")}`}
                    className={`h-2 rounded-full transition-all ${
                      isCurrent
                        ? "bg-indigo-600 dark:bg-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-800"
                        : isPast
                        ? "bg-emerald-500 dark:bg-emerald-600"
                        : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                    } ${auth?.canManageProject ? "cursor-pointer" : "cursor-default"}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800/60 pt-1">
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "tasks", label: `Tasks (${project.tasks?.length || 0})`, icon: CheckCircle2 },
              { id: "milestones", label: `Milestones (${project.milestones?.length || 0})`, icon: Calendar },
              { id: "team", label: `Team (${project.members?.length || 0})`, icon: Users },
              { id: "files", label: `Files & Data (${project.files?.length || 0})`, icon: FileText },
              { id: "notes", label: `Notes (${project.notes?.length || 0})`, icon: BookOpen },
              { id: "discussions", label: "Discussions & Chat", icon: MessageSquare },
              { id: "decisions", label: `Decisions (${project.decisions?.length || 0})`, icon: Scale },
              { id: "studies", label: `Linked Studies (${project.linkedStudies?.length || 0})`, icon: Activity },
              { id: "outputs", label: `Outputs (${project.outputs?.length || 0})`, icon: FileCode },
              { id: "ai", label: "Project AI", icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Tab Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Progress Card */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold uppercase tracking-wider">Project Progress</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {progress.percentage}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
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
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wider">
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
              <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Key Milestones
                  </h3>
                  <button
                    onClick={() => setActiveTab("milestones")}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View All Timeline
                  </button>
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
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
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
                  { id: "IN_PROGRESS", label: "In Progress", bg: "bg-blue-50/50 dark:bg-blue-950/20" },
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
        {activeTab === "milestones" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Research Milestones Roadmap
                </h3>
                <p className="text-xs text-slate-500">
                  Target deadlines aligned with study phases and institutional deliverable gates.
                </p>
              </div>
              {auth?.canEditTasks && (
                <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Milestone
                </button>
              )}
            </div>

            <div className="space-y-3">
              {project.milestones?.map((m: any, idx: number) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition-all text-xs flex items-center justify-between gap-4 ${
                    m.isCompleted
                      ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleMilestone(m.id, m.isCompleted)}
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        m.isCompleted
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {m.isCompleted && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {m.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {m.phase}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{m.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {m.deadline ? new Date(m.deadline).toLocaleDateString() : "Flexible Deadline"}
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        m.isCompleted ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {m.isCompleted ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
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
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm uppercase">
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
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
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
                      ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
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
                <div className="p-8 text-center text-slate-400">
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
                        <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium text-xs"
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
        {activeTab === "notes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Research Notebook & Scientific Wiki
                </h3>
                <p className="text-xs text-slate-500">
                  Shared documentation for literature notes, lab logs, and protocol amendments.
                </p>
              </div>
              <button
                onClick={() => setShowNoteModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                New Note
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.notes?.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No notes recorded yet. Add your first protocol note or literature synthesis.
                </div>
              ) : (
                project.notes?.map((n: any) => (
                  <div
                    key={n.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {n.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                        {n.title}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-6 leading-relaxed">
                        {n.content}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                      Author: {n.author?.name || "Team Member"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: DISCUSSIONS & CHAT */}
        {activeTab === "discussions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setDiscussionTab("threads")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    discussionTab === "threads"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Methodological Threads
                </button>
                <button
                  onClick={() => setDiscussionTab("chat")}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    discussionTab === "chat"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Live Team Chat
                </button>
              </div>

              {discussionTab === "threads" && (
                <button
                  onClick={() => setShowDiscussionModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Start Discussion
                </button>
              )}
            </div>

            {discussionTab === "threads" ? (
              <div className="space-y-4">
                {project.discussions?.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    No discussions started yet. Create a thread to debate statistical models or sample sizing.
                  </div>
                ) : (
                  project.discussions?.map((disc: any) => (
                    <div
                      key={disc.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {disc.title}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {disc.category}
                          </span>
                        </div>
                        {disc.isResolved ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Resolved
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            Active Debate
                          </span>
                        )}
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                        {disc.content}
                      </p>

                      <div className="text-[10px] text-slate-400 mb-3">
                        Posted by {disc.author?.name} • {new Date(disc.createdAt).toLocaleDateString()}
                      </div>

                      {/* Replies */}
                      {disc.replies?.length > 0 && (
                        <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-900 space-y-2 mb-3">
                          {disc.replies.map((rep: any) => (
                            <div key={rep.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {rep.author?.name}:
                              </span>{" "}
                              <span className="text-slate-700 dark:text-slate-300">{rep.content}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Box */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <input
                          type="text"
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                        />
                        <button
                          onClick={() => handleReplyDiscussion(disc.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Live Chat */
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[500px]">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No team messages yet. Say hello to your co-investigators!
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[10px] text-slate-400 mb-0.5">
                            {msg.sender?.name || "Investigator"}
                          </span>
                          <div
                            className={`p-3 rounded-2xl max-w-sm text-xs ${
                              isMe
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type team message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: DECISION LOG */}
        {activeTab === "decisions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Methodological Decision Register
                </h3>
                <p className="text-xs text-slate-500">
                  Sequential, audit-trailed log of protocol, sampling, statistical, and operational decisions.
                </p>
              </div>
              {auth?.canMakeDecisions && (
                <button
                  onClick={() => setShowDecisionModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Decision
                </button>
              )}
            </div>

            <div className="space-y-3">
              {project.decisions?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No methodological decisions logged yet. Document changes to sample size or analysis plans.
                </div>
              ) : (
                project.decisions?.map((dec: any) => (
                  <div
                    key={dec.id}
                    className={`p-5 rounded-2xl border text-xs ${
                      dec.status === "ACTIVE"
                        ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          #{dec.decisionNumber}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {dec.decision}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          dec.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {dec.status}
                      </span>
                    </div>

                    {dec.reason && (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Rationale:</span>{" "}
                        {dec.reason}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Recorded by {dec.madeBy?.name}</span>
                      <span>{new Date(dec.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 9: LINKED STUDIES */}
        {activeTab === "studies" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Connected Tinat Data-Collection Studies
                </h3>
                <p className="text-xs text-slate-500">
                  Link live clinical surveys, trials, or questionnaires created on Tinat to automatically track recruitment.
                </p>
              </div>
              {auth?.canManageStudies && (
                <button
                  onClick={() => setShowStudyModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Connect Study
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.linkedStudies?.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {ls.study.status}
                      </span>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                      {ls.study.description || "Tinat participant data collection study"}
                    </p>

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center mb-3">
                      <div>
                        <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
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
                        className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
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
        {activeTab === "outputs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Research Deliverables & Manuscript Pipeline
                </h3>
                <p className="text-xs text-slate-500">
                  Track papers, conference abstracts, posters, and target journal submission deadlines.
                </p>
              </div>
              {auth?.canEditTasks && (
                <button
                  onClick={() => setShowOutputModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Deliverable
                </button>
              )}
            </div>

            <div className="space-y-4">
              {project.outputs?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No deliverables registered yet. Track target manuscripts, conference posters, or policy briefs.
                </div>
              ) : (
                project.outputs?.map((out: any) => (
                  <div
                    key={out.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {out.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                          {out.type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {out.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400">Target Journal:</span>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {out.targetJournal || "Not specified"}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Submission Deadline:</span>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {out.submissionDeadline
                            ? new Date(out.submissionDeadline).toLocaleDateString()
                            : "Open"}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Contributors:</span>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {out.contributors?.length > 0 ? out.contributors.join(", ") : "All co-investigators"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 11: ASK PROJECT AI */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Grounded Clinical Research AI
                </h3>
                <p className="text-xs text-slate-500">
                  Synthesize project status, conduct ethical gap checks, outline manuscripts, and query methodology.
                </p>
              </div>

              {/* Model Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Model:</span>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="gemini">Google Gemini 3.6 Flash (Recommended)</option>
                  <option value="ling-sante">InclusionAI: Ling Santé MoE (Free)</option>
                  <option value="nemotron">NVIDIA: Nemotron 3 Ultra (Free)</option>
                  <option value="gemma-31b">Google: Gemma 4 31B (Free)</option>
                </select>
              </div>
            </div>

            {/* Quick Action Prompt Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 text-left hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-xs"
                >
                  <div className="font-bold text-indigo-900 dark:text-indigo-300">{act.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{act.desc}</div>
                </button>
              ))}
            </div>

            {/* Chat Response Stream */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col min-h-[450px]">
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {aiHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <Sparkles className="w-8 h-8 text-indigo-400 mb-2" />
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Project AI Research Assistant
                    </h4>
                    <p className="text-xs max-w-md mt-1">
                      Ask any question regarding this project’s timeline, statistical methodology, sample size, or select a preset prompt above.
                    </p>
                  </div>
                ) : (
                  aiHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl text-xs leading-relaxed ${
                        item.role === "assistant"
                          ? "bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800"
                          : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium ml-8"
                      }`}
                    >
                      <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                        {item.role === "assistant" ? "Project AI" : "You"}
                      </div>
                      <div className="whitespace-pre-wrap">{item.content}</div>
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2 text-xs text-indigo-600">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing project state and synthesizing clinical context...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about this project, methodology, or analysis..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAskAI()}
                  disabled={aiLoading}
                  className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
                <button
                  onClick={() => handleAskAI()}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===================== MODALS ===================== */}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 disabled:opacity-50 text-white font-semibold"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
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
