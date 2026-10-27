"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  Hash,
  LoaderCircle,
  Maximize2,
  MessagesSquare,
  Minimize2,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type ChannelId = "general" | "protocol" | "data" | "manuscript" | "logistics";

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

const channels: Array<{
  id: ChannelId;
  label: string;
  description: string;
  icon: typeof Hash;
}> = [
  {
    id: "general",
    label: "general",
    description: "Introductions, project updates, and syncs across the research team.",
    icon: Hash,
  },
  {
    id: "protocol",
    label: "protocol & ethics",
    description: "Study protocol, ethics IRB compliance, methodology & design.",
    icon: ShieldCheck,
  },
  {
    id: "data",
    label: "data & analysis",
    description: "Data collection progress, statistical models, and findings.",
    icon: Sparkles,
  },
  {
    id: "manuscript",
    label: "publications",
    description: "Manuscript drafting, co-authorship reviews, and journal submission.",
    icon: BookOpen,
  },
  {
    id: "logistics",
    label: "milestones & tasks",
    description: "Timelines, milestones, team meetings, and task coordination.",
    icon: CalendarDays,
  },
];

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatMessageDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function parseChannelAndContent(rawContent: string): { channelId: ChannelId; displayContent: string } {
  const match = rawContent.match(/^\[([a-z0-9_-]+)\]\s*([\s\S]*)$/);
  if (match) {
    const candidate = match[1] as ChannelId;
    if (channels.some((c) => c.id === candidate)) {
      return { channelId: candidate, displayContent: match[2] };
    }
  }
  return { channelId: "general", displayContent: rawContent };
}

export function ProjectTeamChat({
  projectId,
  projectTitle,
  currentUserId,
  lead,
  members,
}: ProjectTeamChatProps) {
  const [activeChannel, setActiveChannel] = useState<ChannelId>("general");
  const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDirectoryOpen, setDirectoryOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [error, setError] = useState("");

  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const shouldFollowMessagesRef = useRef(true);
  const channelsEndRef = useRef<HTMLDivElement>(null);
  const isRequestInFlightRef = useRef(false);

  // Exit fullscreen on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isMaximized) {
        setIsMaximized(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized]);

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannel) || channels[0],
    [activeChannel],
  );

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

  const loadMessages = useCallback(
    async (isInitialLoad = false) => {
      if (isRequestInFlightRef.current) return;
      isRequestInFlightRef.current = true;

      if (isInitialLoad) setIsLoadingMessages(true);
      else setIsRefreshing(true);

      try {
        const response = await fetch(`/api/projects/${projectId}/chat`, {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          messages?: ProjectChatMessage[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "Could not load the project conversation.");
        }

        setMessages((current) => {
          const next = data.messages || [];
          const unchanged =
            current.length === next.length &&
            current.every((message, index) => message.id === next[index]?.id);
          return unchanged ? current : next;
        });
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load the project conversation.");
      } finally {
        isRequestInFlightRef.current = false;
        setIsLoadingMessages(false);
        setIsRefreshing(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => void loadMessages(true), 0);
    const refreshTimer = window.setInterval(() => void loadMessages(), 5000);
    return () => {
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(refreshTimer);
    };
  }, [loadMessages]);

  useEffect(() => {
    if (shouldFollowMessagesRef.current) {
      channelsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, activeChannel]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawContent = draft.trim();
    if (!rawContent || isSending) return;

    // Tag the message with the active channel unless it's general
    const contentToSend = activeChannel === "general" ? rawContent : `[${activeChannel}] ${rawContent}`;

    setIsSending(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSend }),
      });
      const data = (await response.json()) as { message?: ProjectChatMessage; error?: string };
      if (!response.ok || !data.message) {
        throw new Error(data.error || "Could not send this message.");
      }

      setDraft("");
      shouldFollowMessagesRef.current = true;
      setMessages((current) =>
        current.some((message) => message.id === data.message!.id)
          ? current
          : [...current, data.message!].slice(-150),
      );
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send this message.");
    } finally {
      setIsSending(false);
    }
  }

  function handleMessageScroll() {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    shouldFollowMessagesRef.current =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 72;
  }

  const visibleMessages = messages.filter((message) => {
    const { channelId } = parseChannelAndContent(message.content);
    return channelId === activeChannel;
  });

  return (
    <div
      className={
        isMaximized
          ? "fixed inset-0 z-50 flex flex-col bg-background p-3 sm:p-5 shadow-2xl animate-in fade-in duration-150"
          : "flex h-full min-h-0 w-full flex-col overflow-hidden"
      }
    >
      {/* Sleek Unified Channel Bar & Controls */}
      <div className="shrink-0 rounded-xl border border-border bg-card p-2 sm:p-2.5 mb-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Channel Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
            {channels.map((channel) => {
              const Icon = channel.icon;
              const isActive = activeChannel === channel.id;
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => {
                    setActiveChannel(channel.id);
                    shouldFollowMessagesRef.current = true;
                  }}
                  aria-pressed={isActive}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="capitalize">#{channel.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Actions (Directory, Maximize, Auto-refresh) */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              title="Refreshes automatically every 5s"
              className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground pr-1"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isRefreshing ? "animate-pulse bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span className="text-[10px]">Live</span>
            </span>

            {/* Toggle Team Directory */}
            <button
              type="button"
              onClick={() => setDirectoryOpen((open) => !open)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isDirectoryOpen
                  ? "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
              title={isDirectoryOpen ? "Hide Team Directory" : "Show Team Directory"}
            >
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span>Team ({projectMembers.length})</span>
            </button>

            {/* Maximize / Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
              title={isMaximized ? "Exit Fullscreen (Esc)" : "Expand Chat to Fullscreen"}
            >
              {isMaximized ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Expand Chat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="mb-2.5 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 shrink-0"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void loadMessages(true)}
            className="shrink-0 rounded-md border border-rose-300/70 px-2 py-0.5 text-xs font-semibold hover:bg-rose-500/10 dark:border-rose-800"
          >
            Retry
          </button>
          <button
            aria-label="Dismiss error"
            type="button"
            onClick={() => setError("")}
            className="rounded p-1 hover:bg-rose-500/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Chat Workspace + Collapsible Team Directory */}
      <div
        className={`relative grid min-h-0 flex-1 gap-3 overflow-hidden ${
          isDirectoryOpen ? "lg:grid-cols-[1fr_290px]" : "grid-cols-1"
        }`}
      >
        {/* Chat Box (Messages + Typing Bar) */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Active Channel Subheader */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/20 px-4 py-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-foreground capitalize">
                #{selectedChannel.label}
              </span>
              <span className="text-muted-foreground/40 hidden sm:inline">·</span>
              <span className="truncate text-muted-foreground hidden sm:inline">
                {selectedChannel.description}
              </span>
            </div>
            <span
              title="Private project room"
              className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Private room
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={messagesViewportRef}
            onScroll={handleMessageScroll}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
            aria-live="polite"
            aria-label={`${selectedChannel.label} channel messages`}
          >
            {isLoadingMessages ? (
              <div className="flex h-full min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading conversation...
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex h-full min-h-60 flex-col items-center justify-center px-4 text-center">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MessagesSquare className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">Welcome to #{selectedChannel.label}</h3>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                  {selectedChannel.description} Start the conversation with your research team.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleMessages.map((message, index) => {
                  const previous = visibleMessages[index - 1];
                  const showDate =
                    !previous ||
                    new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                  const isOwnMessage = message.senderId === currentUserId;
                  const { displayContent } = parseChannelAndContent(message.content);
                  const memberInfo = projectMembers.find((m) => m.id === message.senderId);
                  const senderRole = memberInfo?.role
                    ? memberInfo.role.replace(/_/g, " ").toLowerCase()
                    : "Collaborator";

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="mb-4 flex items-center gap-3 py-1">
                          <span className="h-px w-6 bg-emerald-600/50" />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {formatMessageDate(message.createdAt)}
                          </span>
                          <span className="h-px flex-1 bg-border" />
                        </div>
                      )}
                      <article className="flex gap-3">
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            isOwnMessage
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                          }`}
                        >
                          {message.sender.name?.trim().charAt(0).toUpperCase() || "R"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-xs font-semibold text-foreground">
                              {isOwnMessage ? "You" : message.sender.name || "Collaborator"}
                            </span>
                            {!isOwnMessage && (
                              <span className="text-[10px] text-muted-foreground capitalize">
                                {senderRole}
                                {message.sender.institution ? ` · ${message.sender.institution}` : ""}
                              </span>
                            )}
                            <time className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                              {formatMessageTime(message.createdAt)}
                            </time>
                          </div>
                          <div
                            className={`whitespace-pre-wrap break-words rounded-xl border px-3.5 py-2.5 text-sm leading-6 max-w-3xl ${
                              isOwnMessage
                                ? "border-emerald-600/20 bg-emerald-50/60 text-foreground dark:bg-emerald-950/20 dark:border-emerald-800/40"
                                : "border-border bg-muted/40 text-foreground"
                            }`}
                          >
                            {displayContent}
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={channelsEndRef} />
          </div>

          {/* Typing Bar / Composer (Always Visible & Pinned to Bottom) */}
          <form
            onSubmit={sendMessage}
            className="shrink-0 sticky bottom-0 z-20 border-t border-border bg-card p-3 sm:px-4 sm:py-3.5"
          >
            <label htmlFor="project-chat-message" className="sr-only">
              Message #{selectedChannel.label}
            </label>
            <div className="flex items-end gap-2 rounded-xl border border-input bg-muted/20 p-2 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15">
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
                placeholder={`Message #${selectedChannel.label}...`}
                className="max-h-36 min-h-[38px] flex-1 resize-none bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                disabled={isSending}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!draft.trim() || isSending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground shadow-sm"
              >
                {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
              <span>Enter to send · Shift + Enter for new line</span>
              <span>{draft.length}/1500</span>
            </div>
          </form>
        </section>

        {/* Right Sidebar: Team Directory (Collapsible) */}
        {isDirectoryOpen && (
          <aside className="min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm hidden lg:flex">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Team Directory ({projectMembers.length})
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close directory"
                onClick={() => setDirectoryOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Directory Search */}
            <div className="shrink-0 border-b border-border p-2.5">
              <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-2.5 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Find a collaborator..."
                  aria-label="Search team members"
                  className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
                {memberSearch && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setMemberSearch("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </label>
            </div>

            {/* Directory Members List */}
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {visibleMembers.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center px-4 text-center">
                  <Users className="mb-2 h-5 w-5 text-muted-foreground/60" />
                  <p className="text-xs font-medium text-foreground">
                    {memberSearch ? "No collaborators found" : "No collaborators yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {visibleMembers.map((member) => {
                    const isCurrent = member.id === currentUserId;
                    const isLead = lead && member.id === lead.id;
                    const displayRole = member.role.replace(/_/g, " ").toLowerCase();

                    return (
                      <div
                        key={member.id}
                        className="flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            isLead ? "bg-emerald-600 text-white" : "bg-sky-600 text-white"
                          }`}
                        >
                          {member.name?.trim().charAt(0).toUpperCase() || "R"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {member.name || "Collaborator"}
                            </p>
                            {isCurrent && (
                              <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
                                You
                              </span>
                            )}
                            {isLead && (
                              <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-medium text-primary">
                                Lead
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[10px] text-muted-foreground capitalize">
                            {displayRole}
                          </p>
                          {member.institution && (
                            <p className="truncate text-[10px] text-muted-foreground">
                              {member.institution}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Privacy guidelines */}
            <div className="shrink-0 border-t border-border bg-emerald-500/[0.04] p-3 text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">Research Ethics:</span> Maintain protocol compliance and participant privacy.
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
