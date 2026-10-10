"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CircleHelp,
  Hash,
  Lightbulb,
  LoaderCircle,
  MessageSquare,
  MessagesSquare,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type ChannelId = "general" | "events" | "ideas" | "help" | "support";

type ChatMessage = {
  id: string;
  channel: ChannelId;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
    institution: string | null;
  };
};

type AdminMember = {
  id: string;
  name: string;
  avatarUrl: string | null;
  institution: string | null;
  fieldOfStudy: string | null;
  createdAt: string;
};

const channels: Array<{
  id: ChannelId;
  label: string;
  description: string;
  icon: typeof Hash;
}> = [
  { id: "general", label: "general", description: "Introductions, updates, and conversations across the admin team.", icon: Hash },
  { id: "events", label: "events", description: "Coordinate launches, reviews, and upcoming platform events.", icon: CalendarDays },
  { id: "ideas", label: "ideas", description: "Share product ideas and improvements for Tinat.", icon: Lightbulb },
  { id: "help", label: "help", description: "Ask operational questions and help fellow administrators.", icon: CircleHelp },
  { id: "support", label: "support", description: "Discuss escalations and member support coordination.", icon: MessageSquare },
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

export default function AdminCommunityPage() {
  const [activeChannel, setActiveChannel] = useState<ChannelId>("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDirectoryOpen, setDirectoryOpen] = useState(false);
  const [error, setError] = useState("");
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const shouldFollowMessagesRef = useRef(true);
  const channelsEndRef = useRef<HTMLDivElement>(null);

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannel) || channels[0],
    [activeChannel],
  );

  const loadMessages = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoadingMessages(true);
    else setIsRefreshing(true);

    try {
      const response = await fetch(`/api/admin/chat/messages?channel=${activeChannel}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        messages?: ChatMessage[];
        currentAdminId?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Could not load this conversation.");
      }

      setMessages((current) => {
        const next = data.messages || [];
        const unchanged =
          current.length === next.length &&
          current.every((message, index) => message.id === next[index]?.id);
        return unchanged ? current : next;
      });
      if (data.currentAdminId) setCurrentAdminId(data.currentAdminId);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load this conversation.");
    } finally {
      setIsLoadingMessages(false);
      setIsRefreshing(false);
    }
  }, [activeChannel]);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => void loadMessages(true), 0);
    const refreshTimer = window.setInterval(() => void loadMessages(), 5000);
    return () => {
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(refreshTimer);
    };
  }, [loadMessages]);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();
    const search = memberSearch.trim();
    const timer = window.setTimeout(async () => {
      setIsLoadingMembers(true);
      try {
        const response = await fetch(`/api/admin/chat/members?q=${encodeURIComponent(search)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          members?: AdminMember[];
          total?: number;
          currentAdminId?: string;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "Could not load the admin directory.");
        }
        if (!isCurrent) return;
        setMembers(data.members || []);
        setMemberCount(data.total || 0);
        if (data.currentAdminId) setCurrentAdminId(data.currentAdminId);
      } catch (loadError) {
        if (isCurrent && !(loadError instanceof DOMException && loadError.name === "AbortError")) {
          setError(loadError instanceof Error ? loadError.message : "Could not load the admin directory.");
        }
      } finally {
        if (isCurrent) setIsLoadingMembers(false);
      }
    }, search ? 250 : 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [memberSearch]);

  useEffect(() => {
    if (shouldFollowMessagesRef.current) {
      channelsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: activeChannel, content }),
      });
      const data = (await response.json()) as { message?: ChatMessage; error?: string };
      if (!response.ok || !data.message) {
        throw new Error(data.error || "Could not send this message.");
      }

      setDraft("");
      shouldFollowMessagesRef.current = true;
      setMessages((current) =>
        current.some((message) => message.id === data.message!.id)
          ? current
          : [...current, data.message!].slice(-100),
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

  const visibleMessages = messages.filter((message) => message.channel === activeChannel);

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-[1500px] flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
      <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">Tinat · Internal operations</p>
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Operations room</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${isRefreshing ? "animate-pulse bg-amber-500" : "bg-emerald-500"}`} />
          {isRefreshing ? "Checking for updates..." : "Refreshes automatically"}
          <button
            type="button"
            onClick={() => setDirectoryOpen((open) => !open)}
            className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted lg:hidden"
          >
            <Users className="h-3.5 w-3.5" />
            Directory
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void loadMessages(true)}
            className="shrink-0 rounded-md border border-rose-300/70 px-2.5 py-1 font-semibold hover:bg-rose-500/10 dark:border-rose-800"
          >
            Retry
          </button>
          <button aria-label="Dismiss error" type="button" onClick={() => setError("")} className="rounded p-1 hover:bg-rose-500/10"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <nav aria-label="Operations channels" className="mb-3 grid shrink-0 grid-cols-2 gap-2 rounded-xl border border-border bg-card p-2 sm:grid-cols-3 lg:grid-cols-5">
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
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isActive ? "bg-white/15" : "bg-muted"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold capitalize">{channel.label}</span>
                <span className={`block text-[10px] ${isActive ? "text-white/75" : "text-muted-foreground"}`}>
                  {String(index + 1).padStart(2, "0")} / room
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="relative grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_310px]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-emerald-700/15 bg-card shadow-sm">
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white dark:bg-emerald-600">
              <selectedChannel.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">Operations room</p>
              <h2 className="text-sm font-semibold capitalize text-foreground">{selectedChannel.label}</h2>
              <p className="truncate text-xs text-muted-foreground">{selectedChannel.description}</p>
            </div>
            <span title="Messages refresh automatically" className="hidden items-center gap-1.5 rounded-md bg-muted/70 px-2.5 py-1.5 text-[10px] text-muted-foreground sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Private admin room
            </span>
          </div>

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
                  {selectedChannel.description} Start the conversation with your admin team.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {visibleMessages.map((message, index) => {
                  const previous = visibleMessages[index - 1];
                  const showDate =
                    !previous ||
                    new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                  const isOwnMessage = message.sender.id === currentAdminId;

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
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                          isOwnMessage ? "bg-emerald-700 text-white dark:bg-emerald-600" : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                        }`}>
                          {message.sender.name.trim().charAt(0).toUpperCase() || "A"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-xs font-semibold text-foreground">{isOwnMessage ? "You" : message.sender.name}</span>
                            {!isOwnMessage && <span className="text-[10px] text-muted-foreground">{message.sender.institution || "Tinat Admin"}</span>}
                            <time className="ml-auto text-[10px] tabular-nums text-muted-foreground">{formatMessageTime(message.createdAt)}</time>
                          </div>
                          <div className={`whitespace-pre-wrap break-words rounded-r-lg border-l-2 px-3.5 py-2.5 text-sm leading-6 ${
                            isOwnMessage
                              ? "border-emerald-700 bg-emerald-500/5 text-foreground dark:border-emerald-400"
                              : "border-border bg-muted/35 text-foreground"
                          }`}>
                            {message.content}
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

          <form onSubmit={sendMessage} className="shrink-0 border-t border-border p-3 sm:px-4 sm:py-3.5">
            <label htmlFor="admin-chat-message" className="sr-only">Message #{selectedChannel.label}</label>
            <div className="flex items-end gap-2 rounded-lg border border-input bg-muted/30 p-2 transition focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10">
              <textarea
                id="admin-chat-message"
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

        <aside className={`${isDirectoryOpen ? "flex" : "hidden"} absolute inset-0 z-10 min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl lg:relative lg:inset-auto lg:z-auto lg:flex lg:shadow-none`}>
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Users className="h-4 w-4" /></span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Admin directory</h2>
                <p className="text-[11px] text-muted-foreground">{memberCount} administrators</p>
              </div>
            </div>
            <button type="button" aria-label="Close directory" onClick={() => setDirectoryOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"><X className="h-4 w-4" /></button>
            <span title="Private admin community" className="hidden h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 lg:flex"><ShieldCheck className="h-4 w-4" /></span>
          </div>

          <div className="shrink-0 border-b border-border p-3">
            <label className="flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Find an administrator"
                aria-label="Search administrators"
                className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
              {memberSearch && <button type="button" aria-label="Clear search" onClick={() => setMemberSearch("")} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>}
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {isLoadingMembers ? (
              <div className="flex h-24 items-center justify-center text-xs text-muted-foreground"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading administrators...</div>
            ) : members.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center px-4 text-center">
                <Users className="mb-2 h-5 w-5 text-muted-foreground/60" />
                <p className="text-xs font-medium text-foreground">{memberSearch ? "No administrators found" : "No administrators yet"}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{memberSearch ? "Try a different name or institution." : "Admin accounts will appear here."}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {members.map((member) => {
                  const isCurrent = member.id === currentAdminId;
                  return (
                    <div key={member.id} className="flex items-start gap-2.5 rounded-lg px-2.5 py-3 transition-colors hover:bg-muted/50">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
                        {member.name.trim().charAt(0).toUpperCase() || "A"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-semibold text-foreground">{member.name}</p>
                          {isCurrent && <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">You</span>}
                        </div>
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">{member.institution || "Tinat administrator"}</p>
                        {member.fieldOfStudy && <p className="mt-1 truncate text-[10px] text-muted-foreground">{member.fieldOfStudy}</p>}
                        <p className="mt-1.5 text-[10px] text-muted-foreground">Admin · Joined {new Date(member.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  );
                })}
                {memberCount > members.length && (
                  <p className="px-3 py-2 text-center text-[10px] text-muted-foreground">
                    Showing {members.length} of {memberCount}. Search to find others.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-emerald-500/[0.04] p-3.5">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-foreground">Admin community guidelines</p>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Keep conversations constructive. Don’t share passwords, access tokens, or private participant data.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <Check className="h-3 w-3 text-emerald-600" />
        Private to Tinat administrators · Messages refresh every 5 seconds
      </p>
    </div>
  );
}
