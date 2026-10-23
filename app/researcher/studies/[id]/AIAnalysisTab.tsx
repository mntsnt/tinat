"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AVAILABLE_MODELS, AIModelId } from "@/lib/ai/models";
import { ResearchReportRenderer } from "./ResearchReportRenderer";
import {
  Sparkles,
  Send,
  LoaderCircle,
  Copy,
  Check,
  ChevronDown,
  Trash2,
  Cpu,
  Info,
  ShieldCheck,
  ArrowDown,
  FileText,
  Users,
  Activity,
  GitCompare,
  AlertTriangle,
  BookOpen,
  MessageSquare,
} from "lucide-react";

interface AIAnalysisTabProps {
  studyId: string;
  studyTitle: string;
  responsesCount: number;
  participantTarget?: number;
  category?: string | null;
  studyType?: string;
  questionCount?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
}

const QUICK_ACTIONS = [
  { id: "summarize_findings", label: "Summarize Findings", icon: FileText, prompt: "Summarize the key findings and descriptive statistics from this study." },
  { id: "analyze_demographics", label: "Analyze Demographics", icon: Users, prompt: "Analyze the participant demographics, cohort breakdown, and sample representation." },
  { id: "identify_patterns", label: "Identify Patterns", icon: Activity, prompt: "Identify the most prominent patterns, clusters, and response variances in this dataset." },
  { id: "compare_groups", label: "Compare Groups", icon: GitCompare, prompt: "Compare responses across participant subgroups and highlight differences." },
  { id: "analyze_missing_data", label: "Missing Data Audit", icon: AlertTriangle, prompt: "Audit non-response rates, drop-offs, and data quality across questions." },
  { id: "generate_abstract", label: "Draft Abstract", icon: BookOpen, prompt: "Draft a structured scientific abstract (Background, Methods, Results, Conclusion) from this study data." },
  { id: "generate_discussion", label: "Discussion Points", icon: MessageSquare, prompt: "Draft clinical and public health discussion points and implications." },
];

export function AIAnalysisTab({
  studyId,
  studyTitle,
  responsesCount,
  participantTarget = 0,
  category,
  studyType,
  questionCount = 0,
}: AIAnalysisTabProps) {
  const [selectedModel, setSelectedModel] = useState<AIModelId>("gemini");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);

  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setHasNewMessagesBelow(false);
    }
  }, []);

  const handleScroll = useCallback(() => {
    const el = messagesViewportRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceToBottom < 80;
    if (distanceToBottom < 80) {
      setHasNewMessagesBelow(false);
    }
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(chatMessages.length <= 1 ? "auto" : "smooth");
    }
  }, [chatMessages, chatLoading, scrollToBottom]);

  // Send message
  async function handleSendMessage(customPrompt?: string) {
    const textToSend = (customPrompt || chatInput).trim();
    if (!textToSend || chatLoading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyId,
          message: textToSend,
          history: newHistory.map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to receive reply from AI Assistant.");
      }

      const assistantMsg: ChatMessage = {
        id: "a_" + Date.now(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed,
      };

      setChatMessages([...newHistory, assistantMsg]);
    } catch (err: any) {
      setError(err?.message || "Could not complete request with AI Assistant.");
    } finally {
      setChatLoading(false);
    }
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (responsesCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">No Empirical Data to Analyze Yet</h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground leading-relaxed">
          The AI Research Assistant analyzes verified participant submissions. As soon as participants submit responses, you can chat with the dataset to generate findings, demographic profiles, and cross-tabulations.
        </p>
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <Info className="h-4 w-4" />
          Study currently has 0 recorded participant submissions.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[540px] max-h-[820px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* ── Fixed Chat Room Header ───────────────────────────── */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-foreground">Study AI Assistant</h3>
              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {responsesCount} responses
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              {studyTitle}
            </p>
          </div>
        </div>

        {/* Model Selection Dropdown & Clear Chat Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Cpu className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as AIModelId)}
              disabled={chatLoading}
              aria-label="Select AI Model"
              className="h-8 appearance-none rounded-md border border-input bg-background pl-8 pr-7 text-xs font-medium text-foreground transition-colors hover:bg-muted focus:border-primary/50 focus:outline-none disabled:opacity-50"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
          </div>

          {chatMessages.length > 0 && (
            <button
              type="button"
              onClick={() => setChatMessages([])}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex shrink-0 items-center justify-between border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          <span className="truncate">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold underline hover:no-underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Chat Messages Scroll Area ────────────────────────── */}
      <div
        ref={messagesViewportRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6 bg-background/40"
      >
        {chatMessages.length === 0 ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center p-4">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="text-base font-semibold text-foreground">
              What would you like to analyze?
            </h4>
            <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
              Ask about participant responses, cross-tabulations, drop-offs, or select a starter prompt below.
            </p>

            <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
              {QUICK_ACTIONS.slice(0, 4).map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleSendMessage(action.prompt)}
                    className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-left transition-all hover:bg-muted hover:border-primary/40 text-xs font-medium text-foreground shadow-2xs"
                  >
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground border border-border"
                  }`}
                >
                  {isUser ? "You" : "AI"}
                </span>

                <div
                  className={`min-w-0 max-w-[90%] sm:max-w-[85%] ${
                    isUser ? "items-end text-right" : "items-start text-left"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {isUser ? "You" : "Study AI Assistant"}
                    </span>
                    {!isUser && msg.modelUsed && (
                      <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-medium lowercase">
                        {msg.modelUsed}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`relative rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm whitespace-pre-wrap text-left"
                        : "bg-card border border-border text-foreground rounded-tl-none shadow-sm text-left"
                    }`}
                  >
                    {!isUser && (
                      <div className="absolute top-2.5 right-2.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {isUser ? (
                      msg.content
                    ) : (
                      <ResearchReportRenderer content={msg.content} compact />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {chatLoading && (
          <div className="flex gap-3 items-center text-muted-foreground text-xs py-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-xs font-semibold text-primary">
              <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
            </span>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-2xs">
              <span className="animate-pulse">Analyzing study dataset...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Jump to bottom button when scrolled up */}
      {hasNewMessagesBelow && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="self-center -mb-8 z-10 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105"
        >
          <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
          <span>New response below</span>
        </button>
      )}

      {/* ── Quick Prompts Scrollable Row ─────────────────────── */}
      <div className="shrink-0 border-t border-border/60 bg-muted/30 px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 px-1">
          Quick Ask:
        </span>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleSendMessage(action.prompt)}
            disabled={chatLoading}
            className="shrink-0 text-[11px] bg-background hover:bg-muted text-foreground px-2.5 py-1 rounded-full border border-border transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* ── Fixed Chat Input Bar at Bottom ───────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="shrink-0 border-t border-border bg-card p-3 sm:p-4"
      >
        <div className="flex items-end gap-2 rounded-lg border border-input bg-background p-1.5 transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask about this study's responses, outcomes, or subgroups (Enter to send, Shift+Enter for newline)..."
            rows={1}
            disabled={chatLoading}
            className="max-h-28 min-h-9 flex-1 resize-y bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || chatLoading}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {chatLoading ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            Grounded strictly on this study's data &bull; Participant PII is never transmitted
          </span>
          <span className="hidden sm:inline">Enter to send &bull; Shift+Enter for newline</span>
        </div>
      </form>
    </div>
  );
}
