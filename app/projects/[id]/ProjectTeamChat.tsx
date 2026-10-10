"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
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
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const shouldFollowMessagesRef = useRef(true);
  const isRequestInFlightRef = useRef(false);

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

      setMessages((current) => {
        const next = data.messages || [];
        const unchanged =
          current.length === next.length &&
          current.every((message, index) => message.id === next[index]?.id);
        return unchanged ? current : next;
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
  }, [projectId]);

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

  useEffect(() => {
    if (shouldFollowMessagesRef.current) {
      messagesViewportRef.current?.scrollTo({
        top: messagesViewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  function handleMessageScroll() {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    shouldFollowMessagesRef.current =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 72;
  }

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
      shouldFollowMessagesRef.current = true;
      setMessages((current) =>
        current.some((message) => message.id === data.message!.id)
          ? current
          : [...current, data.message!].slice(-150),
      );
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send your message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden" aria-label="Project team chat">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MessagesSquare className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">Research log</p>
            <h2 className="text-base font-semibold text-foreground">{projectTitle}</h2>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/70 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Shared with project collaborators
        </span>
      </header>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void loadMessages()}
            className="shrink-0 rounded-md border border-rose-300/70 px-2.5 py-1 font-semibold hover:bg-rose-500/10 dark:border-rose-800"
          >
            Retry
          </button>
          <button type="button" aria-label="Dismiss error" onClick={() => setError("")} className="rounded p-1 hover:bg-rose-500/10">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(6rem,0.3fr)] gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_280px] lg:grid-rows-1">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div
            ref={messagesViewportRef}
            onScroll={handleMessageScroll}
            className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6"
            aria-live="polite"
            aria-label="Project team messages"
          >
            {isLoading ? (
              <div className="flex h-full min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full min-h-60 flex-col items-center justify-center px-4 text-center">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">Start your project conversation</h3>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                  Share a quick update or coordinate the next step with your research team.
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
                      <div className="mb-5 flex items-center gap-3 py-1">
                        <span className="h-px w-6 bg-primary/50" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {formatMessageDate(message.createdAt)}
                        </span>
                        <span className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    <article className="flex gap-3">
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                        isOwnMessage ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      }`}>
                        {message.sender.name?.trim().charAt(0).toUpperCase() || "R"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-xs font-semibold text-foreground">
                            {isOwnMessage ? "You" : message.sender.name || "Team member"}
                          </span>
                          {!isOwnMessage && message.sender.institution && (
                            <span className="truncate text-[10px] text-muted-foreground">{message.sender.institution}</span>
                          )}
                          <time className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
                            {new Date(message.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </time>
                        </div>
                        <div className={`whitespace-pre-wrap break-words rounded-r-lg border-l-2 px-3.5 py-2.5 text-sm leading-6 ${
                          isOwnMessage
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-muted/35 text-foreground"
                        }`}>
                          {message.content}
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })
            )}
          </div>

        </div>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Project team
              </h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{projectMembers.length}</span>
            </div>
            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Find a teammate"
                aria-label="Search project team members"
                className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground outline-none focus:border-primary/50"
              />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {visibleMembers.length ? visibleMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {member.name?.trim().charAt(0).toUpperCase() || "R"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {member.id === currentUserId ? `${member.name || "Team member"} (you)` : member.name || "Team member"}
                  </p>
                  <p className="truncate text-[10px] capitalize text-muted-foreground">
                    {member.role.replace(/_/g, " ").toLowerCase()}
                    {member.institution ? ` · ${member.institution}` : ""}
                  </p>
                </div>
              </div>
            )) : (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">No teammates match that search.</p>
            )}
          </div>
        </aside>
      </div>

      <form
        onSubmit={sendMessage}
        className="shrink-0 rounded-xl border border-border bg-card p-3 sm:p-4"
      >
        <label htmlFor="project-chat-message" className="sr-only">
          Message the project team
        </label>
        <div className="flex items-end gap-2 rounded-lg border border-input bg-background p-2 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
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
            placeholder="Write a message to your project team..."
            className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[10px] text-muted-foreground">{draft.length}/1500</span>
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send message
            </button>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Check className="h-3 w-3 text-emerald-600" />
          Visible to authorized project collaborators
        </p>
      </form>
    </section>
  );
}
