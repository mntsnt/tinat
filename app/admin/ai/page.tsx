"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Sparkles,
  Send,
  Users,
  Microscope,
  ClipboardList,
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  Activity,
  Bot,
  User,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AVAILABLE_MODELS, type AIModelId } from "@/lib/ai/models";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface PlatformSummary {
  users: {
    total: number;
    participants: number;
    researchers: number;
    collectors: number;
    signupsThisWeek: number;
    signupsToday: number;
    emailVerified: number;
    faydaVerified: number;
  };
  studies: {
    total: number;
    active: number;
    totalResponses: number;
    responsesToday: number;
    responsesThisWeek: number;
    fieldStudies: number;
  };
  forms: {
    total: number;
    active: number;
    totalResponses: number;
  };
  verifications: {
    pending: number;
    approved: number;
  };
  governance: {
    openModerationReports: number;
    pendingEthicsApprovals: number;
  };
}

const SUGGESTED_PROMPTS = [
  {
    title: "Platform Overview",
    desc: "What's going on across the platform today?",
    prompt: "What's going on across the platform today? Give me an executive overview of users, active studies, and responses.",
    icon: Activity,
  },
  {
    title: "User Demographics",
    desc: "Break down members by role and verification status",
    prompt: "Break down our user base by role, verification status, and recent signup growth.",
    icon: Users,
  },
  {
    title: "Top Studies",
    desc: "Which studies are active and have the most responses?",
    prompt: "Which studies are currently active and collecting the most responses? Include response counts and categories.",
    icon: Microscope,
  },
  {
    title: "Tinat Forms",
    desc: "Status of standalone forms and responses",
    prompt: "Give me a summary of standalone Tinat Forms: how many are created, how many active, and top responses.",
    icon: ClipboardList,
  },
  {
    title: "Action Items & Alerts",
    desc: "Pending researcher verifications and reports",
    prompt: "Are there any pending researcher verifications, ethics reviews, or moderation reports that need admin attention?",
    icon: AlertTriangle,
  },
  {
    title: "Financials & Rewards",
    desc: "TC rewards and field collector ETB payouts",
    prompt: "What is the total Tinat Credits (TC) spent on studies and total ETB paid out to field enumerators?",
    icon: TrendingUp,
  },
];

export default function AdminAIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModelId>("gemini");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showPulseBar, setShowPulseBar] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load live platform telemetry summary
  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai/summary");
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to load telemetry summary:", err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Handle textarea auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isGenerating) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          conversationId: conversationId || undefined,
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.message) {
        throw new Error(data.error || "Failed to receive response.");
      }

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: data.message.id || `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message.content,
        createdAt: data.message.createdAt || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Error communicating with Admin AI:** ${err?.message || "Please try again."}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleClearChat = async () => {
    if (conversationId) {
      try {
        await fetch(`/api/admin/ai/chat?conversationId=${conversationId}`, { method: "DELETE" });
      } catch (e) {
        console.error(e);
      }
    }
    setMessages([]);
    setConversationId("");
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Top Telemetry & Control Bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md shrink-0 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground">Tinat Admin AI</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                  Live Database Grounding
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Operational copilot with full visibility into users, studies, forms, and system health
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Model Selector */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as AIModelId)}
                aria-label="Select AI Model"
                className="h-8 pl-2.5 pr-7 text-xs font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted transition cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Toggle Pulse Bar */}
            <button
              onClick={() => setShowPulseBar(!showPulseBar)}
              className="h-8 px-2.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1.5"
              title="Toggle Telemetry Cards"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{showPulseBar ? "Hide Stats" : "Show Stats"}</span>
            </button>

            {/* Clear Chat */}
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="h-8 px-2.5 text-xs font-medium rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition inline-flex items-center gap-1.5"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Platform Pulse Cards */}
        {showPulseBar && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 mt-3 border-t border-border/60">
            {/* Users Metric */}
            <div className="rounded-xl border border-border/80 bg-background/50 p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Total Users
                </p>
                <p className="text-base font-bold text-foreground">
                  {isLoadingSummary ? "—" : summary?.users.total.toLocaleString()}
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  +{summary?.users.signupsThisWeek ?? 0} this week
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>

            {/* Studies Metric */}
            <div className="rounded-xl border border-border/80 bg-background/50 p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Active Studies
                </p>
                <p className="text-base font-bold text-foreground">
                  {isLoadingSummary ? "—" : summary?.studies.active}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {summary?.studies.totalResponses.toLocaleString() ?? 0} responses
                </p>
              </div>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-400">
                <Microscope className="w-4 h-4" />
              </div>
            </div>

            {/* Forms Metric */}
            <div className="rounded-xl border border-border/80 bg-background/50 p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Tinat Forms
                </p>
                <p className="text-base font-bold text-foreground">
                  {isLoadingSummary ? "—" : summary?.forms.total}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {summary?.forms.totalResponses ?? 0} responses
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>

            {/* Action Items Metric */}
            <div className="rounded-xl border border-border/80 bg-background/50 p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Pending Review
                </p>
                <p className="text-base font-bold text-foreground">
                  {isLoadingSummary
                    ? "—"
                    : (summary?.verifications.pending ?? 0) + (summary?.governance.openModerationReports ?? 0)}
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  {summary?.verifications.pending ?? 0} verifications
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 space-y-5">
        {messages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Welcome to Tinat Admin AI
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Ask questions about users, studies, standalone forms, or platform metrics. Live database context is automatically provided.
              </p>
            </div>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
              {SUGGESTED_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(item.prompt)}
                  disabled={isGenerating}
                  className="group rounded-xl border border-border bg-card p-3.5 hover:border-emerald-500/40 hover:bg-muted/50 transition-all text-left shadow-xs flex items-start gap-3 cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation Stream */
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`relative max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? "bg-emerald-700 text-white dark:bg-emerald-600 rounded-br-xs shadow-xs"
                        : "bg-card border border-border text-foreground rounded-bl-xs shadow-xs"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-border/40 text-[11px] font-semibold text-muted-foreground">
                        <span>Tinat Platform Intelligence</span>
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="hover:text-foreground inline-flex items-center gap-1 transition"
                          title="Copy response"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>p]:my-2 [&>ul]:my-2 [&>ol]:my-2 [&>h3]:mt-3 [&>h3]:mb-1 [&>h3]:text-sm [&>h3]:font-bold [&>h4]:mt-2 [&>h4]:mb-1 [&>h4]:text-xs [&>h4]:font-semibold [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:p-1.5 [&_th]:bg-muted/50 [&_th]:text-xs [&_td]:border [&_td]:border-border [&_td]:p-1.5 [&_td]:text-xs">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-foreground/10 text-foreground flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Generating / Thinking indicator */}
            {isGenerating && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-xs p-3.5 shadow-xs flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Querying platform telemetry &amp; synthesizing analysis...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Sticky Input Dock */}
      <footer className="border-t border-border bg-card/80 backdrop-blur-md p-3 sm:p-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Quick chip suggestions when chat is active */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              <span className="text-muted-foreground whitespace-nowrap font-medium">Ask next:</span>
              {[
                "Who signed up today?",
                "Active studies with responses",
                "Any pending verifications?",
                "Tinat Forms metrics",
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 rounded-full border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground whitespace-nowrap transition cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-xs focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder="Ask anything about platform users, studies, forms, or system health..."
              rows={1}
              className="flex-1 max-h-44 resize-none bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isGenerating}
              aria-label="Send Message"
              className="h-9 w-9 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-700 flex items-center justify-center shrink-0 transition shadow-xs dark:bg-emerald-600 dark:hover:bg-emerald-700 cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span>Press <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to send, <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> for newline</span>
            <span>Grounded in live database state</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
