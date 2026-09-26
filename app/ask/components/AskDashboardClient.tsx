"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { QuestionDeckModal, DeckTheme } from "./QuestionDeckModal";

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
    email: string;
    role: string;
  };
}

export function AskDashboardClient({
  initialProfile,
  initialStats,
  user,
}: AskDashboardClientProps) {
  const [profile, setProfile] = useState<AskProfile | null>(initialProfile);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [tab, setTab] = useState<"unanswered" | "answered" | "archived">("unanswered");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Setup Profile State (for initial creation)
  const defaultSlug = (user.name || user.email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 20);

  const [setupUsername, setSetupUsername] = useState(defaultSlug);
  const [setupDisplayName, setSetupDisplayName] = useState(user.name || "Tinat User");
  const [setupBio, setSetupBio] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSavingSetup, setIsSavingSetup] = useState(false);

  // Profile Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(profile?.displayName || "");
  const [editBio, setEditBio] = useState(profile?.bio || "");
  const [editTheme, setEditTheme] = useState<DeckTheme>((profile?.theme as DeckTheme) || "dark");
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

  useEffect(() => {
    if (profile) {
      fetchQuestions(tab);
    }
  }, [profile, tab]);

  async function fetchQuestions(currentTab: "unanswered" | "answered" | "archived") {
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/ask/questions?tab=${currentTab}`);
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
        if (data.stats) setStats(data.stats);
        if (data.profile) setProfile(data.profile);
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
          theme: "dark",
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
    if (!confirm("Are you sure you want to permanently delete this question?")) return;
    try {
      const res = await fetch(`/api/ask/questions/${questionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchQuestions(tab);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  const askUrl =
    profile && typeof window !== "undefined"
      ? `${window.location.origin}/ask/${profile.username}`
      : profile
      ? `tinat.app/ask/${profile.username}`
      : "";

  async function handleCopyLink() {
    if (!askUrl) return;
    await navigator.clipboard.writeText(askUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  // --- ONBOARDING / PROFILE SETUP SCREEN ---
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create Your Tinat Ask Link
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Get anonymous questions from your community, friends, or participants. Generate sleek visual question decks for your socials!
            </p>
          </div>

          <form onSubmit={handleCreateProfile} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Choose Your Handle / Username
              </label>
              <div className="flex rounded-xl border border-input overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary">
                <span className="bg-muted px-3.5 py-2.5 text-xs text-muted-foreground font-mono flex items-center border-r border-border">
                  tinat.app/ask/
                </span>
                <input
                  type="text"
                  value={setupUsername}
                  onChange={(e) =>
                    setSetupUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
                    )
                  }
                  placeholder="your-name"
                  className="flex-1 px-3 py-2.5 bg-background text-sm focus:outline-none font-mono"
                  required
                  maxLength={30}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Letters, numbers, underscores, and hyphens only (3-30 characters).
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={setupDisplayName}
                onChange={(e) => setSetupDisplayName(e.target.value)}
                placeholder="Dr. Mintesnot / Mintesnot G."
                className="w-full rounded-xl border border-input px-3.5 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Short Bio (Optional)
              </label>
              <textarea
                rows={2}
                value={setupBio}
                onChange={(e) => setSetupBio(e.target.value)}
                placeholder="Ask me anything about my research, career, or life!"
                className="w-full rounded-xl border border-input px-3.5 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
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
              className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingSetup ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating page...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Launch My Tinat Ask Page
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- FULL DASHBOARD SCREEN ---
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner Card */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shrink-0">
              {(profile.displayName || profile.username)
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {profile.displayName || profile.username}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    profile.isEnabled
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  }`}
                >
                  {profile.isEnabled ? "ACTIVE" : "PAUSED"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                @{profile.username}
              </p>
              {profile.bio && (
                <p className="text-xs text-foreground/80 mt-1 line-clamp-1">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => {
                setEditDisplayName(profile.displayName || profile.username);
                setEditBio(profile.bio || "");
                setEditTheme((profile.theme as DeckTheme) || "dark");
                setEditAllowPublic(profile.allowPublicAnswers);
                setEditModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                profile.isEnabled
                  ? "border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                  : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {profile.isEnabled ? "Pause Inbox" : "Resume Inbox"}
            </button>
            <Link
              href={`/ask/${profile.username}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Page
            </Link>
          </div>
        </div>

        {/* Share Bar */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Your Ask Link:
            </span>
            <div className="bg-background border border-border/60 px-3 py-1.5 rounded-lg text-xs font-mono text-foreground font-medium truncate max-w-xs sm:max-w-sm">
              {askUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shrink-0"
              title="Copy link"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Social Share Shortcuts */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">
              Share to:
            </span>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                askUrl
              )}&text=${encodeURIComponent(
                "Ask me anything anonymously on Tinat Ask! 🤫"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-[#229ED9]/10 text-[#229ED9] border border-[#229ED9]/20 hover:bg-[#229ED9]/20 text-xs font-medium transition-colors"
            >
              Telegram
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Ask me anything anonymously! Send your question here: ${askUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20 text-xs font-medium transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                "Ask me anything anonymously on Tinat Ask! 🤫"
              )}&url=${encodeURIComponent(askUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-foreground/5 text-foreground border border-border hover:bg-muted text-xs font-medium transition-colors"
            >
              X / Twitter
            </a>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">
            Inbox / Unanswered
          </span>
          <div className="text-2xl font-black mt-1 text-primary">
            {stats.unanswered}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">
            Answered
          </span>
          <div className="text-2xl font-black mt-1 text-emerald-600">
            {stats.answered}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">
            Public Showcased
          </span>
          <div className="text-2xl font-black mt-1 text-indigo-600">
            {stats.public}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">
            Total Received
          </span>
          <div className="text-2xl font-black mt-1 text-foreground">
            {stats.total}
          </div>
        </div>
      </div>

      {/* Question Management Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("unanswered")}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                tab === "unanswered"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Inbox className="w-4 h-4" />
              Inbox
              {stats.unanswered > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-bold">
                  {stats.unanswered}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("answered")}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                tab === "answered"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Answered
              {stats.answered > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-bold">
                  {stats.answered}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("archived")}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                tab === "archived"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Archive className="w-4 h-4" />
              Archived
            </button>
          </div>

          <button
            onClick={() => fetchQuestions(tab)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Question List */}
        {loadingQuestions ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-card border border-dashed border-border rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
              <MessageCircleQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold">No questions in this tab</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {tab === "unanswered"
                ? "Share your Ask link on your social stories, channels, or statuses to get anonymous questions!"
                : "Questions you manage will appear here."}
            </p>
            {tab === "unanswered" && (
              <button
                onClick={handleCopyLink}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs shadow hover:bg-primary/90 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy My Ask Link
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const isAnswering = answeringId === q.id;

              return (
                <div
                  key={q.id}
                  className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 transition-all"
                >
                  {/* Question header info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-primary/90 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-primary" /> Anonymous Question
                    </span>
                    <span>{new Date(q.createdAt).toLocaleString()}</span>
                  </div>

                  {/* Question text */}
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/40 text-base font-medium text-foreground leading-relaxed">
                    &ldquo;{q.questionText}&rdquo;
                  </div>

                  {/* If already answered, show answer */}
                  {q.answerText && !isAnswering && (
                    <div className="pl-4 border-l-2 border-primary/60 space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Your Answer:
                      </span>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {q.answerText}
                      </p>
                    </div>
                  )}

                  {/* Inline Answer Form */}
                  {isAnswering ? (
                    <div className="space-y-3 pt-2">
                      <textarea
                        rows={3}
                        value={answerDraft}
                        onChange={(e) => setAnswerDraft(e.target.value)}
                        placeholder="Write your answer..."
                        className="w-full rounded-xl border border-input p-3 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
                        maxLength={1000}
                        autoFocus
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveAnswer(q.id, false)}
                            disabled={isSavingAnswer || !answerDraft.trim()}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow hover:bg-primary/95 transition-all disabled:opacity-50"
                          >
                            Save Answer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveAnswer(q.id, true)}
                            disabled={isSavingAnswer || !answerDraft.trim()}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-semibold shadow hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Save & Generate Deck
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setAnsweringId(null);
                            setAnswerDraft("");
                          }}
                          className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Card Actions */
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <div className="flex flex-wrap items-center gap-2">
                        {q.status === "UNANSWERED" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAnsweringId(q.id);
                              setAnswerDraft("");
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow hover:bg-primary/90 transition-all flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Answer
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setAnsweringId(q.id);
                                setAnswerDraft(q.answerText || "");
                              }}
                              className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors"
                            >
                              Edit Answer
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeckModalQuestion(q)}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-semibold shadow hover:opacity-95 transition-all flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Social Deck 🎨
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePublic(q.id, q.isPublic)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                                q.isPublic
                                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                                  : "border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {q.isPublic ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" /> Public on Profile
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" /> Hidden from Profile
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {q.status !== "ARCHIVED" ? (
                          <button
                            type="button"
                            onClick={() => handleArchive(q.id, "ARCHIVED")}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Archive"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleArchive(q.id, "UNANSWERED")}
                            className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(q.id)}
                          className="p-2 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-semibold">Tinat Ask Settings</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfileEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-input px-3.5 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bio
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl border border-input px-3.5 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  maxLength={200}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                <div>
                  <span className="text-xs font-semibold block">
                    Allow Public Answers
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Show questions marked public on your public Ask profile.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editAllowPublic}
                  onChange={(e) => setEditAllowPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow hover:bg-primary/90"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Deck Modal */}
      {deckModalQuestion && (
        <QuestionDeckModal
          isOpen={true}
          onClose={() => setDeckModalQuestion(null)}
          question={deckModalQuestion}
          recipient={{
            displayName: profile.displayName || profile.username,
            username: profile.username,
            avatarUrl: profile.avatarUrl,
          }}
        />
      )}
    </div>
  );
}
