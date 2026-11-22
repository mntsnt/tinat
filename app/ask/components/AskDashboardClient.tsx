"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircleQuestion,
  Inbox,
  CheckCircle2,
  Archive,
  Trash2,
  Settings,
  Send,
  Eye,
  EyeOff,
  Palette,
  Power,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  RotateCcw,
  SlidersHorizontal,
  X,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { QuestionDeckModal, DeckTheme } from "./QuestionDeckModal";
import { useConfirm } from "../../components/ui/ConfirmDialog";

interface AskProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  theme: string | null;
  isEnabled: boolean;
  allowPublicAnswers: boolean;
}

interface QuestionItem {
  id: string;
  questionText: string;
  status: "UNANSWERED" | "ANSWERED" | "ARCHIVED" | "DELETED";
  answerText: string | null;
  answeredAt: string | null;
  isPublic: boolean;
  deckConfig: any;
  createdAt: string;
}

interface Stats {
  total: number;
  unanswered: number;
  answered: number;
  archived: number;
  public: number;
}

interface AskDashboardClientProps {
  initialProfile: AskProfile | null;
  initialStats: Stats;
  user: {
    name: string;
    username?: string | null;
    email: string;
    role: string;
  };
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function AskDashboardClient({
  initialProfile,
  initialStats,
  user,
}: AskDashboardClientProps) {
  const { confirm, alert } = useConfirm();
  const [profile, setProfile] = useState<AskProfile | null>(initialProfile);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [tab, setTab] = useState<"unanswered" | "answered" | "archived">("unanswered");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Setup Profile State (for initial creation)
  const defaultSlug = (user.username || user.name || user.email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);

  const [setupUsername, setSetupUsername] = useState(defaultSlug);
  const [setupDisplayName, setSetupDisplayName] = useState(user.name || "Tinat Researcher");
  const [setupBio, setSetupBio] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSavingSetup, setIsSavingSetup] = useState(false);

  // Profile Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(profile?.displayName || "");
  const [editBio, setEditBio] = useState(profile?.bio || "");
  const [editTheme, setEditTheme] = useState<DeckTheme>((profile?.theme as DeckTheme) || "tinat");
  const [editAllowPublic, setEditAllowPublic] = useState(profile?.allowPublicAnswers ?? true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Answering State
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);

  // Question Deck Modal State
  const [deckModalQuestion, setDeckModalQuestion] = useState<QuestionItem | null>(null);

  // Link copy state
  const [copiedLink, setCopiedLink] = useState(false);

  const profileId = profile?.id;

  useEffect(() => {
    if (profileId) {
      fetchQuestions(tab);
    }
  }, [profileId, tab]);

  async function fetchQuestions(currentTab: "unanswered" | "answered" | "archived") {
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/ask/questions?tab=${currentTab}`);
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!setupUsername.trim()) return;

    setIsSavingSetup(true);
    setSetupError(null);

    try {
      const res = await fetch("/api/ask/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: setupUsername.trim().toLowerCase(),
          displayName: setupDisplayName.trim(),
          bio: setupBio.trim(),
          theme: "tinat",
          isEnabled: true,
          allowPublicAnswers: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Ask profile.");
      }

      setProfile(data.profile);
    } catch (err: any) {
      setSetupError(err.message || "Failed to create Ask profile.");
    } finally {
      setIsSavingSetup(false);
    }
  }

  async function handleToggleStatus() {
    if (!profile) return;
    try {
      const newStatus = !profile.isEnabled;
      const res = await fetch("/api/ask/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          displayName: profile.displayName || profile.username,
          bio: profile.bio,
          isEnabled: newStatus,
          allowPublicAnswers: profile.allowPublicAnswers,
        }),
      });
      if (res.ok) {
        setProfile({ ...profile, isEnabled: newStatus });
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  }

  async function handleSaveProfileEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/ask/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          displayName: editDisplayName.trim(),
          bio: editBio.trim(),
          theme: editTheme,
          isEnabled: profile.isEnabled,
          allowPublicAnswers: editAllowPublic,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error("Profile update error:", err);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSaveAnswer(questionId: string, openDeckAfter = false) {
    if (!answerDraft.trim()) return;
    setIsSavingAnswer(true);

    try {
      const res = await fetch(`/api/ask/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answerText: answerDraft.trim(),
          status: "ANSWERED",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAnsweringId(null);
        setAnswerDraft("");
        fetchQuestions(tab);

        if (openDeckAfter) {
          setDeckModalQuestion(data.question);
        }
      }
    } catch (err) {
      console.error("Error saving answer:", err);
    } finally {
      setIsSavingAnswer(false);
    }
  }

  async function handleTogglePublic(questionId: string, currentPublic: boolean) {
    try {
      const res = await fetch(`/api/ask/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !currentPublic }),
      });
      if (res.ok) {
        fetchQuestions(tab);
      }
    } catch (err) {
      console.error("Toggle public error:", err);
    }
  }

  async function handleArchive(questionId: string, targetStatus: "ARCHIVED" | "UNANSWERED") {
    try {
      const res = await fetch(`/api/ask/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (res.ok) {
        fetchQuestions(tab);
      }
    } catch (err) {
      console.error("Archive error:", err);
    }
  }

  async function handleDelete(questionId: string) {
    const ok = await confirm({
      title: "Delete Question",
      message: "Are you sure you want to permanently delete this question? This cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/ask/questions/${questionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete question.");
      }

      await fetchQuestions(tab);
    } catch (err) {
      console.error("Delete error:", err);
      await alert({
        title: "Delete Failed",
        message: err instanceof Error ? err.message : "Failed to delete question.",
        variant: "danger",
      });
    }
  }

  const askUrl =
    profile && typeof window !== "undefined"
      ? `${window.location.origin}/ask/${profile.username}`
      : profile
      ? `tinat.et/ask/${profile.username}`
      : "";

  async function handleCopyLink() {
    if (!askUrl) return;
    await navigator.clipboard.writeText(askUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  }

  // ─────────────────────────────────────────────────────────────
  // SETUP / ONBOARDING SCREEN
  // ─────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-card border border-border/80 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Create Your Tinat Ask Link
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Receive confidential questions from participants, students, or peers, and share your answers as visual decks.
            </p>
          </div>

          <form onSubmit={handleCreateProfile} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Your Link Handle
              </label>
              <div className="flex rounded-xl border border-input overflow-hidden bg-background focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                <span className="bg-muted/60 px-3 py-2 text-xs text-muted-foreground font-mono flex items-center border-r border-border">
                  tinat.et/ask/
                </span>
                <input
                  type="text"
                  value={setupUsername}
                  onChange={(e) =>
                    setSetupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                  }
                  placeholder="your-handle"
                  className="flex-1 px-3 py-2 bg-transparent text-xs sm:text-sm font-mono text-foreground focus:outline-none"
                  required
                  maxLength={30}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Letters, numbers, underscores, and hyphens (3-30 chars).
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={setupDisplayName}
                onChange={(e) => setSetupDisplayName(e.target.value)}
                placeholder="Dr. Mintesnot / Mintesnot L."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Short Bio (Optional)
              </label>
              <textarea
                rows={2}
                value={setupBio}
                onChange={(e) => setSetupBio(e.target.value)}
                placeholder="Ask me about my research, field surveys, or public health topics."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                maxLength={200}
              />
            </div>

            {setupError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
                {setupError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingSetup || setupUsername.length < 3}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingSetup ? (
                <>
                  <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Creating link...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Launch Ask Page
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN DASHBOARD SCREEN
  // ─────────────────────────────────────────────────────────────
  const initials = (profile.displayName || profile.username)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5">
      {/* 1. Sleek Header & Profile Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Profile Identity */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                  {profile.displayName || profile.username}
                </h1>
                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    profile.isEnabled
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  }`}
                >
                  {profile.isEnabled ? "Active" : "Paused"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                @{profile.username}
              </p>
              {profile.bio && (
                <p className="text-xs text-foreground/80 mt-0.5 line-clamp-1 max-w-md">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={() => {
                setEditDisplayName(profile.displayName || profile.username);
                setEditBio(profile.bio || "");
                setEditTheme((profile.theme as DeckTheme) || "tinat");
                setEditAllowPublic(profile.allowPublicAnswers);
                setEditModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              Settings
            </button>

            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                profile.isEnabled
                  ? "border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                  : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {profile.isEnabled ? "Pause" : "Resume"}
            </button>

            <Link
              href={`/ask/${profile.username}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-2xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Public</span> Page
            </Link>
          </div>
        </div>

        {/* Share & Copy Strip */}
        <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Ask Link Copy Pill */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 hidden sm:inline">
              Ask Link:
            </span>
            <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/30 px-3 py-1.5 text-xs font-mono text-foreground min-w-0 max-w-full sm:max-w-md">
              <span className="truncate">{askUrl}</span>
              <button
                onClick={handleCopyLink}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors shrink-0"
                title="Copy link"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {copiedLink && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0 animate-in fade-in">
                Copied!
              </span>
            )}
          </div>

          {/* Social Share Pills */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">Share:</span>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                askUrl
              )}&text=${encodeURIComponent("Ask me anything confidentially on Tinat Ask! 🤫")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-medium text-foreground transition-colors shrink-0"
            >
              Telegram
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Ask me anything confidentially! Send here: ${askUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-medium text-foreground transition-colors shrink-0"
            >
              WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                "Ask me anything confidentially on Tinat Ask! 🤫"
              )}&url=${encodeURIComponent(askUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-medium text-foreground transition-colors shrink-0"
            >
              X / Twitter
            </a>
          </div>
        </div>
      </div>

      {/* 2. Compact 4-Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Inbox (Unanswered)
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.unanswered}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Answered
          </span>
          <div className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            {stats.answered}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Public Showcased
          </span>
          <div className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            {stats.public}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Received
          </span>
          <div className="text-xl sm:text-2xl font-bold text-muted-foreground mt-0.5">
            {stats.total}
          </div>
        </div>
      </div>

      {/* 3. Question Tabs & Question Feed */}
      <div className="space-y-4">
        {/* Modern Segmented Control Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60">
            <button
              onClick={() => setTab("unanswered")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === "unanswered"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Inbox</span>
              {stats.unanswered > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {stats.unanswered}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab("answered")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === "answered"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Answered</span>
              {stats.answered > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                  {stats.answered}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab("archived")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === "archived"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archived</span>
            </button>
          </div>

          <button
            onClick={() => fetchQuestions(tab)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh questions"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Questions Stream */}
        <div className="space-y-3 min-h-[300px]">
          {loadingQuestions ? (
            <div className="py-16 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              Loading questions...
            </div>
          ) : questions.length === 0 ? (
            <div className="py-14 text-center space-y-2.5 rounded-2xl border border-dashed border-border/80 bg-card p-6">
              <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mx-auto">
                <MessageCircleQuestion className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {tab === "unanswered" ? "No new questions in inbox" : "No questions here"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {tab === "unanswered"
                  ? "Share your Ask link on your social channels, stories, or group chats to receive private questions."
                  : "Questions you answer or archive will be neatly organized here."}
              </p>
              {tab === "unanswered" && (
                <button
                  onClick={handleCopyLink}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Ask Link
                </button>
              )}
            </div>
          ) : (
            questions.map((q) => {
              const isAnswering = answeringId === q.id;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3 transition-colors hover:border-emerald-500/30"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-3 h-3" />
                      Private Question
                    </span>
                    <span>{formatRelativeTime(q.createdAt)}</span>
                  </div>

                  {/* Question Body */}
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 text-sm font-medium text-foreground leading-relaxed">
                    &ldquo;{q.questionText}&rdquo;
                  </div>

                  {/* Display Existing Answer (if answered & not editing) */}
                  {q.answerText && !isAnswering && (
                    <div className="pl-3.5 border-l-2 border-emerald-500/80 space-y-1 my-2">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Your Answer:
                      </span>
                      <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {q.answerText}
                      </p>
                    </div>
                  )}

                  {/* Inline Answering Editor */}
                  {isAnswering ? (
                    <div className="space-y-2.5 pt-1">
                      <textarea
                        rows={3}
                        value={answerDraft}
                        onChange={(e) => setAnswerDraft(e.target.value)}
                        placeholder="Write your answer clearly..."
                        className="w-full rounded-xl border border-input p-3 bg-background text-base sm:text-xs leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                        maxLength={1000}
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {answerDraft.length} / 1000 characters
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAnsweringId(null);
                              setAnswerDraft("");
                            }}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveAnswer(q.id, false)}
                            disabled={isSavingAnswer || !answerDraft.trim()}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                          >
                            Save Answer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveAnswer(q.id, true)}
                            disabled={isSavingAnswer || !answerDraft.trim()}
                            className="px-3.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Save &amp; Create Deck
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Question Action Bar */
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {q.status === "UNANSWERED" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAnsweringId(q.id);
                              setAnswerDraft("");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
                          >
                            <Send className="w-3 h-3" />
                            Answer Question
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setAnsweringId(q.id);
                                setAnswerDraft(q.answerText || "");
                              }}
                              className="px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                            >
                              Edit Answer
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeckModalQuestion(q)}
                              className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
                            >
                              <Smartphone className="w-3 h-3" />
                              Create Deck
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePublic(q.id, q.isPublic)}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                                q.isPublic
                                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                                  : "border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {q.isPublic ? (
                                <>
                                  <Eye className="w-3 h-3" /> Showcased
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" /> Hidden from Profile
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {q.status === "ARCHIVED" ? (
                          <button
                            type="button"
                            onClick={() => handleArchive(q.id, "UNANSWERED")}
                            className="px-2.5 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleArchive(q.id, "ARCHIVED")}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Archive question"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Question Deck Visual Generator Modal */}
      {deckModalQuestion && (
        <QuestionDeckModal
          isOpen={Boolean(deckModalQuestion)}
          onClose={() => setDeckModalQuestion(null)}
          question={deckModalQuestion}
          recipient={{
            displayName: profile.displayName || profile.username,
            username: profile.username,
            avatarUrl: profile.avatarUrl,
          }}
        />
      )}

      {/* 5. Profile Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xl space-y-4 animate-in slide-in-from-bottom-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Ask Profile Settings</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileEdit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Bio</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  maxLength={200}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20">
                <div>
                  <p className="text-xs font-semibold text-foreground">Public Answers</p>
                  <p className="text-[11px] text-muted-foreground">
                    Display showcased answers on your public link.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editAllowPublic}
                  onChange={(e) => setEditAllowPublic(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  {isSavingProfile ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
