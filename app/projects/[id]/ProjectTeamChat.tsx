"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  ArrowDown,
  Check,
  LoaderCircle,
  MessageSquare,
  MessagesSquare,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";

type ProjectChatMessage = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    institution: string | null;
  };
};

type ProjectChatMember = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  institution?: string | null;
  role: string;
};

type ProjectMemberRecord = {
  role: string;
  user: Omit<ProjectChatMember, "role">;
};

type ProjectTeamChatProps = {
  projectId: string;
  projectTitle: string;
  currentUserId: string;
  lead: ProjectChatMember | null;
  members: ProjectMemberRecord[];
};

function formatMessageDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function ProjectTeamChat({
  projectId,
  projectTitle,
  currentUserId,
  lead,
  members,
}: ProjectTeamChatProps) {
  const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [showMobileTeam, setShowMobileTeam] = useState(false);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);

  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const isRequestInFlightRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  const projectMembers = useMemo(() => {
    const uniqueMembers = new Map<string, ProjectChatMember>();
    if (lead) uniqueMembers.set(lead.id, lead);
    for (const membership of members) {
      const member = { ...membership.user, role: membership.role };
      if (!uniqueMembers.has(member.id)) uniqueMembers.set(member.id, member);
    }
    return [...uniqueMembers.values()];
  }, [lead, members]);

  const visibleMembers = useMemo(() => {
    const query = memberSearch.trim().toLocaleLowerCase();
    if (!query) return projectMembers;
    return projectMembers.filter((member) =>
      `${member.name || ""} ${member.institution || ""} ${member.role}`.toLocaleLowerCase().includes(query),
    );
  }, [memberSearch, projectMembers]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setHasNewMessagesBelow(false);
    }
  }, []);

  const handleMessageScroll = useCallback(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    const distanceToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    isNearBottomRef.current = distanceToBottom < 80;
    if (distanceToBottom < 80) {
      setHasNewMessagesBelow(false);
    }
  }, []);

  const loadMessages = useCallback(async (signal?: AbortSignal) => {
    if (isRequestInFlightRef.current) return;
    isRequestInFlightRef.current = true;

    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        cache: "no-store",
        signal,
      });
      const data = (await response.json()) as {
        messages?: ProjectChatMessage[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Could not load the project conversation.");

      const nextMessages = data.messages || [];

      setMessages((current) => {
        const unchanged =
          current.length === nextMessages.length &&
          current.every((message, index) => message.id === nextMessages[index]?.id);
        if (unchanged) return current;

        // If messages changed
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          window.requestAnimationFrame(() => scrollToBottom("auto"));
        } else if (nextMessages.length > prevMessagesLengthRef.current) {
          if (isNearBottomRef.current) {
            window.requestAnimationFrame(() => scrollToBottom("smooth"));
          } else {
            setHasNewMessagesBelow(true);
          }
        }

        prevMessagesLengthRef.current = nextMessages.length;
        return nextMessages;
      });
      setError("");
    } catch (loadError) {
      if (!(loadError instanceof DOMException && loadError.name === "AbortError")) {
        setError(loadError instanceof Error ? loadError.message : "Could not load the project conversation.");
      }
    } finally {
      isRequestInFlightRef.current = false;
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [projectId, scrollToBottom]);

  useEffect(() => {
    const controller = new AbortController();
    const initialLoadTimer = window.setTimeout(() => void loadMessages(controller.signal), 0);
    const refreshTimer = window.setInterval(() => void loadMessages(controller.signal), 5000);
    return () => {
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(refreshTimer);
      controller.abort();
    };
  }, [loadMessages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = (await response.json()) as {
        message?: ProjectChatMessage;
        error?: string;
      };
      if (!response.ok || !data.message) {
        throw new Error(data.error || "Could not send your message.");
      }

      setDraft("");
      setMessages((current) => {
        if (current.some((m) => m.id === data.message!.id)) return current;
        return [...current, data.message!];
      });
      window.requestAnimationFrame(() => scrollToBottom("smooth"));
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send your message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label="Project team chat">
      {/* Chat Pinned Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessagesSquare className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-foreground">{projectTitle}</h2>
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              Research team chat · {projectMembers.length} collaborators
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Teammates Toggle */}
          <button
            type="button"
            onClick={() => setShowMobileTeam((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted lg:hidden"
            title="Toggle team list"
          >
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Team ({projectMembers.length})</span>
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex shrink-0 items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{error}</span>
          <button
            type="button"
            onClick={() => void loadMessages()}
            className="shrink-0 rounded border border-rose-300 px-2 py-0.5 font-semibold hover:bg-rose-500/10 dark:border-rose-800"
          >
            Retry
          </button>
          <button type="button" aria-label="Dismiss error" onClick={() => setError("")} className="rounded p-0.5 hover:bg-rose-500/10">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Chat Split: Messages Column + Teammates Column */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Messages Column (With permanently anchored Typing Tab at the bottom) */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background/50">
          {/* Messages Scroll Area */}
          <div
            ref={messagesViewportRef}
            onScroll={handleMessageScroll}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5"
            aria-live="polite"
            aria-label="Project team messages"
          >
            {isLoading ? (
              <div className="flex h-full min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center px-4 text-center">
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">Start the discussion</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Coordinate methodology, review findings, or ask questions with your research team.
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const previous = messages[index - 1];
                const showDate =
                  !previous ||
                  new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                const isOwnMessage = message.senderId === currentUserId;

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="my-3 flex items-center gap-3">
                        <span className="h-px flex-1 bg-border" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {formatMessageDate(message.createdAt)}
                        </span>
                        <span className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    <article className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground border border-border"
                      }`}>
                        {message.sender.name?.trim().charAt(0).toUpperCase() || "R"}
                      </span>
                      <div className={`max-w-[85%] sm:max-w-[75%] ${isOwnMessage ? "items-end text-right" : "items-start text-left"}`}>
                        <div className="mb-1 flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {isOwnMessage ? "You" : message.sender.name || "Team member"}
                          </span>
                          {!isOwnMessage && message.sender.institution && (
                            <span className="hidden sm:inline truncate text-[10px] text-muted-foreground">
                              ({message.sender.institution})
                            </span>
                          )}
                          <time className="text-[10px] tabular-nums text-muted-foreground">
                            {new Date(message.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </time>
                        </div>
                        <div className={`whitespace-pre-wrap break-words rounded-xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed text-left ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                            : "bg-card border border-border text-foreground rounded-tl-none shadow-sm"
                        }`}>
                          {message.content}
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Jump to bottom button when scrolled up */}
          {hasNewMessagesBelow && (
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105"
            >
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
              <span>New messages below</span>
            </button>
          )}

          {/* Dedicated Typing Tab Composer - ALWAYS Fixed at Bottom of Chat */}
          <form
            onSubmit={sendMessage}
            className="shrink-0 border-t border-border bg-card p-2.5 sm:p-3"
          >
            <label htmlFor="project-chat-message" className="sr-only">
              Type your message
            </label>
            <div className="flex items-end gap-2 rounded-lg border border-input bg-background p-1.5 transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
              <textarea
                id="project-chat-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={1500}
                rows={1}
                placeholder="Type a message to project team (Enter to send, Shift+Enter for new line)..."
                className="max-h-28 min-h-9 flex-1 resize-y bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <div className="flex shrink-0 items-center gap-1.5 pb-0.5">
                <span className="text-[10px] tabular-nums text-muted-foreground hidden sm:inline">
                  {draft.length}/1500
                </span>
                <button
                  type="submit"
                  disabled={!draft.trim() || isSending}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                >
                  {isSending ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-600" />
                Visible to all collaborators
              </span>
              <span className="hidden sm:inline">Enter to send · Shift+Enter for newline</span>
            </div>
          </form>
        </div>

        {/* Teammates Sidebar (Desktop pinned right, Mobile slide-over drawer) */}
        <aside
          className={`flex min-h-0 flex-col border-l border-border bg-card/60 transition-all ${
            showMobileTeam
              ? "absolute inset-y-0 right-0 z-30 w-72 max-w-[85vw] bg-card shadow-2xl"
              : "hidden lg:flex w-64 shrink-0"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground">Project Team</h3>
              <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                {projectMembers.length}
              </span>
            </div>
            {showMobileTeam && (
              <button
                type="button"
                onClick={() => setShowMobileTeam(false)}
                className="rounded p-1 hover:bg-muted lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Search teammates..."
                className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2.5 text-xs text-foreground outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
            {visibleMembers.length ? (
              visibleMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted/60">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {member.name?.trim().charAt(0).toUpperCase() || "R"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {member.id === currentUserId ? `${member.name || "Team member"} (you)` : member.name || "Team member"}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground capitalize">
                      {member.role.replace(/_/g, " ").toLowerCase()}
                      {member.institution ? ` · ${member.institution}` : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">No teammates match search.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
