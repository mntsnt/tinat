"use client";

import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUp,
  BrainCircuit,
  Check,
  ChevronDown,
  Copy,
  Database,
  History,
  Loader2,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import type { AIChatMessage } from "@/lib/ai/providers";
import { AVAILABLE_MODELS, getAIModel, type AIModelId } from "@/lib/ai/models";
import { ArtifactRenderer } from "./components/ArtifactRenderer";

type ChatMessageItem = {
  id?: string;
  role: AIChatMessage["role"];
  content: string;
};

type ConversationSummary = {
  id: string;
  title: string | null;
  provider: string;
  model: string | null;
  updatedAt: string;
};

type StoredMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type ConversationDetails = ConversationSummary & {
  studyId: string | null;
  messages: StoredMessage[];
};

type StudyOption = {
  id: string;
  title: string;
};

const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;

function errorMessage(data: { error?: string }, fallback: string) {
  return data.error || fallback;
}

function displayTitle(title: string | null) {
  return title?.trim() || "New research session";
}

function formatChatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [studies, setStudies] = useState<StudyOption[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModelId>(DEFAULT_MODEL);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [showDeleteActiveConfirm, setShowDeleteActiveConfirm] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    const response = await fetch("/api/ai/conversations");
    const data = (await response.json()) as {
      conversations?: ConversationSummary[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(errorMessage(data, "Could not load your chat history."));
    }
    setConversations(data.conversations || []);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [conversationResponse, studyResponse] = await Promise.all([
          fetch("/api/ai/conversations"),
          fetch("/api/auth/studies"),
        ]);
        const [conversationData, studyData] = (await Promise.all([
          conversationResponse.json(),
          studyResponse.json(),
        ])) as [
          { conversations?: ConversationSummary[]; error?: string },
          { studies?: StudyOption[]; error?: string },
        ];

        if (!conversationResponse.ok) {
          throw new Error(errorMessage(conversationData, "Could not load your chat history."));
        }
        if (!studyResponse.ok) {
          throw new Error(errorMessage(studyData, "Could not load your studies."));
        }
        if (!isMounted) return;

        setConversations(conversationData.conversations || []);
        const availableStudies = studyData.studies || [];
        setStudies(availableStudies);
        if (availableStudies.length > 0) {
          setSelectedStudyId(availableStudies[0].id);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Could not load Tinat AI.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Smooth auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isGenerating]);

  const startNewChat = useCallback(() => {
    if (isGenerating) return;
    setActiveConversationId("");
    setMessages([]);
    setError("");
    setDeletingConversationId(null);
    setShowDeleteActiveConfirm(false);
    setSidebarOpen(false);
    inputRef.current?.focus();
  }, [isGenerating]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing =
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n" && !isEditing) {
        event.preventDefault();
        startNewChat();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [startNewChat]);

  const openConversation = async (conversationId: string) => {
    if (isGenerating || isLoadingConversation || conversationId === activeConversationId) {
      setSidebarOpen(false);
      return;
    }

    setIsLoadingConversation(true);
    setError("");
    setDeletingConversationId(null);
    setShowDeleteActiveConfirm(false);
    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`);
      const data = (await response.json()) as {
        conversation?: ConversationDetails;
        error?: string;
      };
      if (!response.ok || !data.conversation) {
        throw new Error(errorMessage(data, "Could not open this chat."));
      }

      const conversation = data.conversation;
      setActiveConversationId(conversation.id);
      setMessages(
        conversation.messages
          .filter((message) => message.role === "USER" || message.role === "ASSISTANT")
          .map((message) => ({
            id: message.id,
            role: message.role.toLowerCase() as AIChatMessage["role"],
            content: message.content,
          })),
      );
      setSelectedStudyId(conversation.studyId || "");
      setSelectedModel(getAIModel(conversation.model)?.id || DEFAULT_MODEL);
      setSidebarOpen(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not open this chat.");
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const saveChatSettings = async (studyId: string, model: AIModelId) => {
    if (activeConversationId) {
      setIsSavingSettings(true);
      setError("");
      try {
        const response = await fetch(`/api/ai/conversations/${activeConversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studyId: studyId || null,
            model,
          }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(errorMessage(data, "Could not save chat settings."));
        }
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Could not save chat settings.");
        return;
      } finally {
        setIsSavingSettings(false);
      }
    }
    setSelectedStudyId(studyId);
    setSelectedModel(model);
  };

  const handleSend = async (message = input) => {
    const content = message.trim();
    if (!content || isGenerating || isLoadingConversation || isSavingSettings) return;

    setError("");
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setMessages((previous) => [...previous, { role: "user", content }]);
    setIsGenerating(true);

    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const title = content.length > 56 ? `${content.slice(0, 53).trimEnd()}...` : content;
        const createResponse = await fetch("/api/ai/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            studyId: selectedStudyId || null,
            model: selectedModel,
          }),
        });
        const createData = (await createResponse.json()) as {
          conversation?: ConversationSummary;
          error?: string;
        };
        if (!createResponse.ok || !createData.conversation) {
          throw new Error(errorMessage(createData, "Could not create a new chat."));
        }

        conversationId = createData.conversation.id;
        setActiveConversationId(conversationId);
        setConversations((previous) => [createData.conversation!, ...previous]);
      }

      const response = await fetch(`/api/ai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = (await response.json()) as {
        message?: StoredMessage;
        userMessage?: StoredMessage;
        error?: string;
      };
      if (!response.ok || !data.message) {
        throw new Error(errorMessage(data, "Tinat AI could not respond. Please try again."));
      }

      setMessages((previous) => {
        const updated = [...previous];
        if (data.userMessage && updated.length > 0) {
          const lastIdx = updated.length - 1;
          if (updated[lastIdx].role === "user" && !updated[lastIdx].id) {
            updated[lastIdx] = { ...updated[lastIdx], id: data.userMessage.id };
          }
        }
        return [
          ...updated,
          { id: data.message!.id, role: "assistant", content: data.message!.content },
        ];
      });
      await loadConversations();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Tinat AI could not respond.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (isDeletingConversation) return;

    setIsDeletingConversation(true);
    setError("");

    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok) {
        throw new Error(errorMessage(data, "Could not delete conversation."));
      }

      setConversations((previous) => previous.filter((item) => item.id !== conversationId));
      setDeletingConversationId(null);
      setShowDeleteActiveConfirm(false);

      if (activeConversationId === conversationId) {
        startNewChat();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete conversation.");
    } finally {
      setIsDeletingConversation(false);
    }
  };

  const handleDeleteMessage = async (messageId: string | undefined, index: number) => {
    if (isGenerating || (messageId && deletingMessageId === messageId)) return;

    if (!messageId || !activeConversationId) {
      setMessages((previous) => previous.filter((_, i) => i !== index));
      return;
    }

    setDeletingMessageId(messageId);
    setError("");

    try {
      const response = await fetch(
        `/api/ai/conversations/${activeConversationId}/messages?messageId=${encodeURIComponent(messageId)}`,
        { method: "DELETE" }
      );
      const data = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok) {
        throw new Error(errorMessage(data, "Could not delete message."));
      }

      setMessages((previous) => previous.filter((_, i) => i !== index));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete message.");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const selectedStudyTitle =
    studies.find((study) => study.id === selectedStudyId)?.title || "General / No Study";
  const currentModelInfo = getAIModel(selectedModel) || AVAILABLE_MODELS[0];
  const isBusy = isGenerating || isLoadingConversation || isSavingSettings;

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => (c.title || "").toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background font-sans text-foreground selection:bg-emerald-500/20">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* MOBILE BACKDROP                                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isSidebarOpen && (
        <button
          aria-label="Close chat history"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SIDEBAR: RECENT SESSIONS                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card/95 backdrop-blur-md transition-all duration-200 md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 w-[280px]" : "-translate-x-full md:translate-x-0"
        } ${isDesktopSidebarCollapsed ? "md:w-0 md:border-r-0 md:overflow-hidden" : "md:w-[280px] md:shrink-0"}`}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/80 px-3.5">
          <Link
            href="/researcher"
            className="flex items-center gap-2 group transition-opacity hover:opacity-85"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs shadow-emerald-600/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-foreground">Tinat AI</span>
              <span className="ml-1.5 rounded-sm bg-emerald-500/10 px-1 py-0.2 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                PRO
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsDesktopSidebarCollapsed(true)}
              className="hidden md:flex rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* New Session Button */}
        <div className="p-3">
          <button
            onClick={startNewChat}
            disabled={isGenerating}
            className="group flex w-full items-center justify-between rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-2xs hover:border-emerald-500/40 hover:bg-muted transition-all disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              New Session
            </span>
            <kbd className="hidden sm:inline-block rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              Ctrl+N
            </kbd>
          </button>
        </div>

        {/* Search bar inside sidebar */}
        {conversations.length > 5 && (
          <div className="px-3 pb-2">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-muted/30 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-emerald-500/40 focus:bg-background transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 text-xs">
          {isLoading ? (
            <div className="space-y-1.5 p-2">
              <div className="h-8 animate-pulse rounded-lg bg-muted/60" />
              <div className="h-8 animate-pulse rounded-lg bg-muted/60" />
              <div className="h-8 animate-pulse rounded-lg bg-muted/60" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-[11px]">
              {searchQuery ? "No matching chats found." : "No previous chats yet."}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const isConfirmingDelete = deletingConversationId === conversation.id;

              if (isConfirmingDelete) {
                return (
                  <div
                    key={conversation.id}
                    className="my-1 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs space-y-1.5 animate-in fade-in"
                  >
                    <p className="font-medium text-foreground truncate">Delete this chat?</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingConversationId(null);
                        }}
                        className="rounded px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={(e) => void handleDeleteConversation(conversation.id, e)}
                        className="rounded bg-destructive text-destructive-foreground px-2 py-0.5 text-[11px] font-semibold hover:bg-destructive/90 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={conversation.id}
                  className={`group relative flex items-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-medium"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <button
                    onClick={() => void openConversation(conversation.id)}
                    disabled={isBusy}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left"
                  >
                    <MessageSquare
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/70"
                      }`}
                    />
                    <span className="truncate text-xs flex-1">
                      {displayTitle(conversation.title)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0 font-normal">
                      {formatChatDate(conversation.updatedAt)}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label="Delete chat"
                    title="Delete session"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingConversationId(conversation.id);
                    }}
                    className="absolute right-1.5 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border/80 p-3 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Grounded in Ethiopian Research</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN CHAT STAGE                                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        {/* Compact, Ultra-Sleek Top Bar (Single-Row, Mobile & Desktop Perfect) */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card/60 backdrop-blur-md px-3 sm:px-5 z-20">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Desktop uncollapse button (if collapsed) */}
            {isDesktopSidebarCollapsed && (
              <button
                onClick={() => setIsDesktopSidebarCollapsed(false)}
                className="hidden md:flex rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-1"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}

            {/* Active Session Info */}
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[220px] sm:max-w-md">
                {activeConversationId
                  ? displayTitle(conversations.find((item) => item.id === activeConversationId)?.title || null)
                  : "New research session"}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium truncate">
                  <Database className="h-2.5 w-2.5 shrink-0" />
                  {selectedStudyTitle}
                </span>
                <span>&bull;</span>
                <span className="truncate">{currentModelInfo.name}</span>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile Quick Action for New Session */}
            <button
              type="button"
              onClick={startNewChat}
              className="flex md:hidden items-center justify-center h-8 w-8 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
              title="New Chat"
            >
              <Plus className="h-4 w-4 text-emerald-600" />
            </button>

            {/* Desktop Study Selector Pill */}
            <div className="relative hidden md:block">
              <label className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 text-xs text-foreground hover:border-emerald-500/40 transition-colors cursor-pointer">
                <Database className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <select
                  value={selectedStudyId}
                  disabled={isBusy}
                  onChange={(e) => void saveChatSettings(e.target.value, selectedModel)}
                  className="appearance-none bg-transparent pr-4 text-xs text-foreground outline-none font-medium max-w-[170px] truncate cursor-pointer"
                >
                  <option value="">General Research (No Study)</option>
                  {studies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-muted-foreground" />
              </label>
            </div>

            {/* Desktop Model Selector Pill */}
            <div className="relative hidden md:block">
              <label className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 text-xs text-foreground hover:border-emerald-500/40 transition-colors cursor-pointer">
                <BrainCircuit className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <select
                  value={selectedModel}
                  disabled={isBusy}
                  onChange={(e) => {
                    const m = getAIModel(e.target.value);
                    if (m) void saveChatSettings(selectedStudyId, m.id);
                  }}
                  className="appearance-none bg-transparent pr-4 text-xs text-foreground outline-none font-medium max-w-[150px] truncate cursor-pointer"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-muted-foreground" />
              </label>
            </div>

            {/* Mobile Settings Trigger (Single Clean Modal, Zero Clutter) */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex md:hidden items-center justify-center h-8 w-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Context & Model Settings"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>

            {/* Delete Chat Button (understated) */}
            {activeConversationId && (
              <button
                type="button"
                onClick={() => setShowDeleteActiveConfirm((prev) => !prev)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete this chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* Delete Confirmation Alert Banner */}
        {showDeleteActiveConfirm && activeConversationId && (
          <div className="flex items-center justify-between gap-3 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-foreground animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              <span>Permanently delete this chat history?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDeleteActiveConfirm(false)}
                className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConversation(activeConversationId)}
                className="rounded bg-destructive text-destructive-foreground px-2.5 py-0.5 text-xs font-semibold hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CHAT MESSAGES STREAM                                           */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 md:px-8 overscroll-contain">
          <div className="mx-auto max-w-3xl space-y-6 pb-28">
            {isLoadingConversation ? (
              <div className="flex flex-col items-center justify-center py-20 text-xs text-muted-foreground space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                <span>Loading research session...</span>
              </div>
            ) : messages.length === 0 ? (
              /* Sleek Empty State Hero */
              <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-2 py-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Sparkles className="h-6 w-6 animate-pulse" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Tinat Research Copilot
                </h2>
                <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Analyze clinical study data, draft validated questions, or synthesize epidemiological hypotheses across Ethiopia.
                </p>

                {/* Prompt Suggestions Grid */}
                <div className="mt-6 grid w-full max-w-2xl gap-2.5 sm:grid-cols-2 text-left">
                  {[
                    {
                      label: "Summarize Study Findings",
                      prompt: "Summarize the key descriptive findings and response trends from my active study.",
                    },
                    {
                      label: "Draft Survey Questions",
                      prompt: "Draft 5 Likert-scale questions on treatment adherence and barrier perception.",
                    },
                    {
                      label: "Analyze Demographics",
                      prompt: "Break down sample demographics and evaluate geographic distribution across regions.",
                    },
                    {
                      label: "Ethics & Compliance Review",
                      prompt: "Highlight participant consent and data confidentiality safeguards for this protocol.",
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setInput(item.prompt);
                        inputRef.current?.focus();
                      }}
                      className="group rounded-xl border border-border/80 bg-card/60 p-3 text-left transition-all hover:border-emerald-500/40 hover:bg-muted hover:shadow-xs active:scale-[0.99]"
                    >
                      <p className="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                        {item.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Conversational Messages */
              messages.map((message, index) => {
                const isUser = message.role === "user";

                if (isUser) {
                  return (
                    <div key={index} className="flex justify-end group">
                      <div className="max-w-[88%] sm:max-w-[78%] rounded-2xl rounded-tr-xs bg-emerald-600 text-white px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(message.content, index)}
                            className="p-1 text-white/70 hover:text-white"
                            title="Copy message"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3 w-3 text-emerald-200" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteMessage(message.id, index)}
                            className="p-1 text-white/70 hover:text-red-200"
                            title="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Assistant Message: Sleek, fluid, no clunky nested cards
                return (
                  <div key={index} className="flex gap-3 group">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="text-xs sm:text-sm leading-relaxed text-foreground">
                        <ArtifactRenderer content={message.content} />
                      </div>

                      {/* Quiet Action Toolbar */}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(message.content, index)}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy response</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDeleteMessage(message.id, index)}
                          className="inline-flex items-center gap-1 hover:text-destructive transition-colors"
                          title="Delete response"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Thinking / Generating Indicator */}
            {isGenerating && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground animate-in fade-in">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
                <span>Tinat AI is analyzing your study context...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* COMPOSER / INPUT DOCK                                          */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-border/80 bg-background/95 backdrop-blur-md px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="mx-auto max-w-3xl">
            {error && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs text-destructive animate-in fade-in">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
                <button onClick={() => setError("")} className="shrink-0 p-0.5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Elevated Floating Composer Box */}
            <div className="rounded-2xl border border-border/90 bg-card shadow-sm transition-all focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10">
              <textarea
                ref={inputRef}
                rows={1}
                aria-label="Ask Tinat AI"
                placeholder={
                  selectedStudyId
                    ? `Ask about ${selectedStudyTitle}...`
                    : "Ask Tinat AI a question, explore hypotheses..."
                }
                value={input}
                disabled={isBusy}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                className="max-h-44 min-h-[52px] w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />

              {/* Composer Bottom Row */}
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-border/30">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Context Pill Indicator */}
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground max-w-[200px] sm:max-w-xs truncate"
                    title={selectedStudyTitle}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{selectedStudyTitle}</span>
                  </span>

                  {isSavingSettings && (
                    <span className="text-[10px] text-muted-foreground">Saving...</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-[10px] text-muted-foreground/70">
                    Shift + Enter for new line
                  </span>

                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || isBusy}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
                    aria-label="Send prompt"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/70">
              Tinat AI models clinical hypotheses. Always verify vital medical decisions against primary field data.
            </p>
          </div>
        </div>
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MOBILE CONTEXT & MODEL SETTINGS MODAL                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-foreground">AI Research Context</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Study Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-emerald-500" />
                Target Study Context
              </label>
              <select
                value={selectedStudyId}
                onChange={(e) => void saveChatSettings(e.target.value, selectedModel)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-emerald-500"
              >
                <option value="">General Research (No Study)</option>
                {studies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5 text-emerald-500" />
                Intelligence Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  const m = getAIModel(e.target.value);
                  if (m) void saveChatSettings(selectedStudyId, m.id);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-emerald-500"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} &bull; {m.badge}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
