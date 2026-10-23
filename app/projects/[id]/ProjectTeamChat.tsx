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
  MessagesSquare,
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
  const [error, setError] = useState("");

  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const shouldFollowMessagesRef = useRef(true);
  const channelsEndRef = useRef<HTMLDivElement>(null);
  const isRequestInFlightRef = useRef(false);

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
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-col overflow-hidden px-1 py-2 sm:px-3 sm:py-3">
      {/* Header */}
      <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">
              Tinat · Research Collaboration
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Operations room
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span
            className={`h-2 w-2 rounded-full ${
              isRefreshing ? "animate-pulse bg-amber-500" : "bg-emerald-500"
            }`}
          />
          {isRefreshing ? "Checking for updates..." : "Refreshes automatically"}
          <button
            type="button"
            onClick={() => setDirectoryOpen((open) => !open)}
            className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted lg:hidden"
          >
            <Users className="h-3.5 w-3.5" />
            Directory ({projectMembers.length})
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void loadMessages(true)}
            className="shrink-0 rounded-md border border-rose-300/70 px-2.5 py-1 font-semibold hover:bg-rose-500/10 dark:border-rose-800"
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

      {/* Horizontal Channel Tabs */}
      <nav
        aria-label="Operations channels"
        className="mb-3 grid shrink-0 grid-cols-2 gap-2 rounded-xl border border-border bg-card p-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        {channels.map((channel, index) => {
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
              className={`flex min-h-12 items-center gap-2.5 rounded-lg border px-3 text-left transition-colors ${
                isActive
                  ? "border-emerald-700/20 bg-emerald-700 text-white shadow-sm dark:border-emerald-500/30 dark:bg-emerald-600"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  isActive ? "bg-white/15" : "bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold capitalize">{channel.label}</span>
                <span
                  className={`block text-[10px] ${isActive ? "text-white/75" : "text-muted-foreground"}`}
                >
                  {String(index + 1).padStart(2, "0")} / room
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Chat Pane + Team Directory Grid */}
      <div className="relative grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_310px]">
        {/* Main Chat Box */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-emerald-700/15 bg-card shadow-sm">
          {/* Active Channel Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white dark:bg-emerald-600">
              <selectedChannel.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                Operations room
              </p>
              <h2 className="text-sm font-semibold capitalize text-foreground">{selectedChannel.label}</h2>
              <p className="truncate text-xs text-muted-foreground">{selectedChannel.description}</p>
            </div>
            <span
              title="Private project room"
              className="hidden items-center gap-1.5 rounded-md bg-muted/70 px-2.5 py-1.5 text-[10px] text-muted-foreground sm:flex"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Private project room
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
              <div className="space-y-5">
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
                        <div className="mb-5 flex items-center gap-3 py-1">
                          <span className="h-px w-6 bg-emerald-600/50" />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {formatMessageDate(message.createdAt)}
                          </span>
                          <span className="h-px flex-1 bg-border" />
                        </div>
                      )}
                      <article className="flex gap-3">
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                            isOwnMessage
                              ? "bg-emerald-700 text-white dark:bg-emerald-600"
                              : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                          }`}
                        >
                          {message.sender.name?.trim().charAt(0).toUpperCase() || "R"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
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
                            className={`whitespace-pre-wrap break-words rounded-r-lg border-l-2 px-3.5 py-2.5 text-sm leading-6 ${
                              isOwnMessage
                                ? "border-emerald-700 bg-emerald-500/5 text-foreground dark:border-emerald-400"
                                : "border-border bg-muted/35 text-foreground"
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

          {/* Dedicated Typing Tab Composer */}
          <form onSubmit={sendMessage} className="shrink-0 border-t border-border p-3 sm:px-4 sm:py-3.5">
            <label htmlFor="project-chat-message" className="sr-only">
              Message #{selectedChannel.label}
            </label>
            <div className="flex items-end gap-2 rounded-lg border border-input bg-muted/30 p-2 transition focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10">
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
                placeholder={`Message #${selectedChannel.label}`}
                className="max-h-32 min-h-9 flex-1 resize-y bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                disabled={isSending}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!draft.trim() || isSending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
              <span>Enter to send · Shift + Enter for a new line</span>
              <span>{draft.length}/1500</span>
            </div>
          </form>
        </section>

        {/* Right Sidebar: Team Directory */}
        <aside
          className={`${
            isDirectoryOpen ? "flex" : "hidden"
          } absolute inset-0 z-10 min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl lg:relative lg:inset-auto lg:z-auto lg:flex lg:shadow-none`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Team directory</h2>
                <p className="text-[11px] text-muted-foreground">{projectMembers.length} collaborators</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close directory"
              onClick={() => setDirectoryOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
            <span
              title="Private research project"
              className="hidden h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 lg:flex"
            >
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>

          {/* Directory Search */}
          <div className="shrink-0 border-b border-border p-3">
            <label className="flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Find a collaborator"
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
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {memberSearch ? "Try a different name or role." : "Team members will appear here."}
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
                      className="flex items-start gap-2.5 rounded-lg px-2.5 py-3 transition-colors hover:bg-muted/50"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          isLead
                            ? "bg-emerald-600 text-white"
                            : "bg-sky-600 text-white"
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
                            <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
                              You
                            </span>
                          )}
                          {isLead && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                              Lead
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground capitalize">
                          {displayRole}
                        </p>
                        {member.institution && (
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {member.institution}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {isLead ? "Project Lead" : "Research collaborator"} · Active
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Guidelines footer card */}
          <div className="shrink-0 border-t border-border bg-emerald-500/[0.04] p-3.5">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-foreground">Team collaboration guidelines</p>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                  Keep conversations constructive. Maintain research integrity, ethics protocols, and participant
                  privacy.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Footer Indicator */}
      <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <Check className="h-3 w-3 text-emerald-600" />
        Private to project collaborators · Messages refresh every 5 seconds
      </p>
    </div>
  );
}
