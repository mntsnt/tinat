"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  BrainCircuit,
  Check,
  ChevronDown,
  Database,
  Menu,
  MessageSquare,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import type { AIChatMessage } from "@/lib/ai/providers";
import { AVAILABLE_MODELS } from "@/lib/ai/models";
import { ArtifactRenderer } from "./components/ArtifactRenderer";

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
  return title?.trim() || "New research chat";
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [studies, setStudies] = useState<StudyOption[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isGenerating]);

  const startNewChat = useCallback(() => {
    if (isGenerating) return;
    setActiveConversationId("");
    setMessages([]);
    setError("");
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
            role: message.role.toLowerCase() as AIChatMessage["role"],
            content: message.content,
          })),
      );
      setSelectedStudyId(conversation.studyId || "");
      setSelectedModel(
        AVAILABLE_MODELS.some((model) => model.id === conversation.model)
          ? conversation.model || DEFAULT_MODEL
          : DEFAULT_MODEL,
      );
      setSidebarOpen(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not open this chat.");
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const saveChatSettings = async (studyId: string, model: string) => {
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
        error?: string;
      };
      if (!response.ok || !data.message) {
        throw new Error(errorMessage(data, "Tinat AI could not respond. Please try again."));
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.message!.content },
      ]);
      await loadConversations();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Tinat AI could not respond.");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedStudyTitle =
    studies.find((study) => study.id === selectedStudyId)?.title || "No study context";
  const isBusy = isGenerating || isLoadingConversation || isSavingSettings;

  return (
    <main className="flex h-svh min-h-[520px] overflow-hidden bg-background font-sans text-foreground">
      {isSidebarOpen && (
        <button
          aria-label="Close chat history"
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[280px] shrink-0 flex-col border-r border-border bg-card transition-transform md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[68px] items-center justify-between border-b border-border px-4">
          <a href="/researcher" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-semibold tracking-tight">Tinat AI</span>
          </a>
          <button
            aria-label="Close chat history"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={startNewChat}
            disabled={isGenerating}
            className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-muted disabled:opacity-50"
          >
            <Plus className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            New chat
            <span className="ml-auto text-[11px] text-muted-foreground">Ctrl + N</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          Recent chats
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {isLoading ? (
            <div className="space-y-2 px-2 py-3" aria-label="Loading chat history">
              <div className="h-10 animate-pulse rounded-md bg-muted" />
              <div className="h-10 animate-pulse rounded-md bg-muted" />
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-3 text-xs leading-5 text-muted-foreground">
              Your saved chats will appear here.
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => void openConversation(conversation.id)}
                    disabled={isBusy}
                    className={`group flex w-full items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition disabled:opacity-60 ${
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <MessageSquare
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                        isActive ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">
                        {displayTitle(conversation.title)}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {new Date(conversation.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
          Your research, thoughtfully supported.
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[68px] items-center justify-between gap-3 border-b border-border bg-background px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              aria-label="Open chat history"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {activeConversationId
                  ? displayTitle(conversations.find((item) => item.id === activeConversationId)?.title || null)
                  : "New research chat"}
              </h1>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                Tinat AI Research Assistant
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label className="relative hidden max-w-[220px] items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 sm:flex">
              <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <select
                aria-label="Study context"
                value={selectedStudyId}
                disabled={isBusy}
                onChange={(event) => void saveChatSettings(event.target.value, selectedModel)}
                className="w-full min-w-0 appearance-none bg-transparent pr-4 text-xs text-foreground outline-none disabled:opacity-60"
              >
                <option value="">No study context</option>
                {studies.map((study) => (
                  <option key={study.id} value={study.id}>
                    {study.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
            </label>
            <label className="relative flex max-w-[190px] items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2">
              <BrainCircuit className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
              <select
                aria-label="AI model"
                value={selectedModel}
                disabled={isBusy}
                onChange={(event) => void saveChatSettings(selectedStudyId, event.target.value)}
                className="w-full min-w-0 appearance-none bg-transparent pr-4 text-xs text-foreground outline-none disabled:opacity-60"
              >
                {AVAILABLE_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
            </label>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-8">
            <div className="mx-auto w-full max-w-3xl space-y-7">
              {isLoadingConversation ? (
                <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
                  <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  Loading conversation...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-[min(62vh,560px)] flex-col items-center justify-center px-4 text-center">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    What are you researching?
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Ask a question, explore your study data, or get help shaping your next analysis.
                  </p>
                  <div className="mt-7 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                    {[
                      "Summarize the key findings in my study",
                      "What patterns stand out in the responses?",
                      "Help me refine my research question",
                      "Suggest an analysis plan for this dataset",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                          inputRef.current?.focus();
                        }}
                        className="rounded-lg border border-border bg-card px-3.5 py-3 text-left text-xs leading-5 text-muted-foreground transition-colors hover:border-emerald-600/40 hover:bg-muted hover:text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${activeConversationId}-${index}`}
                    className={`flex gap-3.5 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role !== "user" && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={`min-w-0 ${
                        message.role === "user"
                          ? "max-w-[88%] rounded-2xl rounded-tr-md border border-border bg-muted px-4 py-3 text-sm leading-6 text-foreground sm:max-w-[78%]"
                          : "max-w-full flex-1 pt-1 text-sm leading-7 text-foreground"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <ArtifactRenderer content={message.content} />
                      )}
                    </div>
                  </div>
                ))
              )}
              {isGenerating && (
                <div className="flex items-center gap-3.5 text-sm text-muted-foreground">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  </span>
                  Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-background px-3 pb-3 pt-3 sm:px-6 sm:pb-5">
            <div className="mx-auto max-w-3xl">
              {error && (
                <div
                  role="alert"
                  className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    aria-label="Dismiss error"
                    onClick={() => setError("")}
                    className="rounded p-0.5 text-destructive/70 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="rounded-xl border border-input bg-card shadow-sm transition-colors focus-within:border-emerald-600/50">
                <textarea
                  ref={inputRef}
                  aria-label="Message Tinat AI"
                  className="max-h-48 min-h-[54px] w-full resize-none bg-transparent px-4 pb-2 pt-4 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
                  rows={1}
                  placeholder={`Message Tinat AI${selectedStudyId ? ` about ${selectedStudyTitle}` : ""}...`}
                  value={input}
                  disabled={isBusy}
                  onChange={(event) => {
                    setInput(event.target.value);
                    event.target.style.height = "auto";
                    event.target.style.height = `${Math.min(event.target.scrollHeight, 192)}px`;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <div className="flex items-center justify-between px-2.5 pb-2.5">
                  <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                    <label className="relative flex max-w-[150px] items-center gap-1.5 rounded-md px-2 py-1 sm:hidden">
                      <Database className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <select
                        aria-label="Study context"
                        value={selectedStudyId}
                        disabled={isBusy}
                        onChange={(event) => void saveChatSettings(event.target.value, selectedModel)}
                        className="w-full min-w-0 appearance-none truncate bg-transparent pr-3 text-[11px] text-foreground outline-none disabled:opacity-60"
                      >
                        <option value="">No study context</option>
                        {studies.map((study) => (
                          <option key={study.id} value={study.id}>
                            {study.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0.5 h-3 w-3 text-muted-foreground" />
                    </label>
                    <span className="hidden max-w-[180px] truncate rounded-md px-2 py-1 sm:inline">
                      {selectedStudyTitle}
                    </span>
                    {isSavingSettings && <span>Saving...</span>}
                    {!isSavingSettings && (
                      <span className="hidden items-center gap-1 sm:flex">
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        Chat history saves automatically
                      </span>
                    )}
                  </div>
                  <button
                    aria-label="Send message"
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || isBusy}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                AI can make mistakes. Verify important research findings against your source data.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
