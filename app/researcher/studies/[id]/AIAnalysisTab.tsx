"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { ResearchReportRenderer } from "./ResearchReportRenderer";
import {
  Sparkles,
  FileText,
  Users,
  Activity,
  GitCompare,
  AlertTriangle,
  HelpCircle,
  Send,
  Copy,
  Check,
  RefreshCw,
  Info,
  ShieldCheck,
  MessageSquare,
  BookOpen,
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
}

const ACTION_BUTTONS = [
  {
    id: "summarize_findings",
    label: "Summarize Findings",
    icon: FileText,
    description: "Executive empirical overview with key percentages and outcomes",
  },
  {
    id: "analyze_demographics",
    label: "Analyze Demographics",
    icon: Users,
    description: "Cohort composition, age/sex breakdown, and sample representation",
  },
  {
    id: "identify_patterns",
    label: "Identify Patterns",
    icon: Activity,
    description: "Prominent trends, response clusters, and variance across variables",
  },
  {
    id: "compare_groups",
    label: "Compare Groups",
    icon: GitCompare,
    description: "Subgroup comparisons and cross-tabulated percentage differences",
  },
  {
    id: "analyze_missing_data",
    label: "Analyze Missing Data",
    icon: AlertTriangle,
    description: "Question non-response rates, drop-off patterns, and data quality",
  },
  {
    id: "identify_limitations",
    label: "Identify Limitations",
    icon: HelpCircle,
    description: "Cross-sectional constraints, selection bias, and measurement factors",
  },
  {
    id: "generate_abstract",
    label: "Draft Academic Abstract",
    icon: BookOpen,
    description: "Structured scientific abstract (Background, Methods, Results, Conclusion)",
  },
  {
    id: "generate_discussion",
    label: "Draft Discussion Points",
    icon: MessageSquare,
    description: "Clinical and public health implications and future research directions",
  },
] as const;

export function AIAnalysisTab({
  studyId,
  studyTitle,
  responsesCount,
  participantTarget = 0,
  category,
  studyType,
  questionCount = 0,
}: AIAnalysisTabProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [actionLabel, setActionLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "What are the most significant findings in this study?",
    "Summarize the participant demographics and cohort representation.",
    "Which questions had the highest response variance or divergence?",
    "What potential confounding factors or limitations should be acknowledged?",
    "Draft key clinical or public health discussion points.",
  ]);

  const completionRate =
    participantTarget > 0 ? Math.min(100, Math.round((responsesCount / participantTarget) * 1000) / 10) : null;

  // Execute One-Click Analysis Action
  async function runAction(actionId: string, label: string) {
    setError(null);
    setLoadingAction(actionId);
    setActiveAction(actionId);
    setActionLabel(label);

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyId, action: actionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate AI analysis.");
      }

      setAnalysisResult(data.analysis);
      if (Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions);
      }
    } catch (err: any) {
      setError(err?.message || "AI Analysis is temporarily unavailable.");
    } finally {
      setLoadingAction(null);
    }
  }

  // Send Chat Message to Research Assistant
  async function handleSendMessage(messageText?: string) {
    const textToSend = (messageText || chatInput).trim();
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to receive reply from Research Assistant.");
      }

      const assistantMsg: ChatMessage = {
        id: "a_" + Date.now(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages([...newHistory, assistantMsg]);
    } catch (err: any) {
      setError(err?.message || "Could not complete message with AI Assistant.");
    } finally {
      setChatLoading(false);
    }
  }

  function handleCopyResult() {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (responsesCount === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Empirical Data to Analyze Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
            AI Research Analysis evaluates verified participant submissions. As soon as participants submit responses to
            this study, you can generate demographic summaries, cross-tabulations, abstract drafts, and pattern analyses.
          </p>
          <div className="flex gap-2 items-center text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border border-border">
            <Info className="w-4 h-4" />
            Study currently has 0 recorded submissions.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Cohort & Study Context Banner ─────────────────────── */}
      <Card className="border-primary/20 bg-gradient-to-r from-card via-card to-primary/5">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-black text-white font-bold text-xs shadow-sm">
                  T
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  AI Research Analysis
                </span>
                {category && (
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {category}
                  </Badge>
                )}
                {studyType && (
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {studyType === "FUNDED" ? "Funded Study" : "Open Research"}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {studyTitle}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Statistical interpretation, pattern detection, and medical research synthesis powered by Google Gemini.
              </CardDescription>
            </div>

            <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-xl border border-border shrink-0">
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-foreground">{responsesCount}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Participants
                </div>
              </div>
              {participantTarget > 0 && (
                <>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center px-2">
                    <div className="text-2xl font-bold text-foreground">{participantTarget}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Target
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center px-2">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {completionRate}%
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Completion
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Error Banner if any ─────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Analysis Error</p>
            <p className="text-destructive/90 mt-0.5">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* ── One-Click Research Actions ──────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">Structured Analysis Actions</h3>
            <p className="text-xs text-muted-foreground">
              Select an empirical analysis action to synthesize findings using pre-calculated descriptive statistics.
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            PII Stripped &bull; Data Grounded
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ACTION_BUTTONS.map((action) => {
            const Icon = action.icon;
            const isLoading = loadingAction === action.id;
            const isCurrent = activeAction === action.id && !isLoading;

            return (
              <button
                key={action.id}
                onClick={() => runAction(action.id, action.label)}
                disabled={Boolean(loadingAction) || chatLoading}
                className={`group relative flex flex-col text-left p-4 rounded-xl border transition-all duration-200 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card hover:bg-muted/50 border-border hover:border-primary/40 text-foreground"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                      isCurrent
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
                </div>
                <div className="font-semibold text-sm leading-tight mb-1">{action.label}</div>
                <div
                  className={`text-[11px] leading-relaxed line-clamp-2 ${
                    isCurrent ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {action.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Analysis Output Display ──────────────────────── */}
      {loadingAction && (
        <Card className="border-primary/30">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="relative mb-4 flex items-center justify-center">
              <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xl shadow-lg animate-pulse">
                T
              </div>
              <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-bounce" />
            </div>
            <h4 className="text-base font-semibold text-foreground mb-1">
              Processing Deterministic Statistics & Synthesizing Findings...
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Calculating exact frequencies, response distributions, and querying Google Gemini for medical research insights.
            </p>
          </CardContent>
        </Card>
      )}

      {analysisResult && !loadingAction && (
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="border-b border-border bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-primary text-primary-foreground text-xs">{actionLabel}</Badge>
                  <span className="text-xs text-muted-foreground">Study ID: {studyId.slice(0, 10)}...</span>
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Analysis Results</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyResult}
                  className="h-8 gap-1.5 text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Output"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAnalysisResult(null)}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResearchReportRenderer content={analysisResult} />

            <div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="italic">
                AI-generated research draft — verify with a statistician or research supervisor before publication.
              </span>
              <span>Based on {responsesCount} verified participant responses</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Conversational Research Assistant ───────────────────── */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs shadow-sm">
                T
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Ask the AI Research Assistant
                </CardTitle>
                <CardDescription className="text-xs">
                  Ask specific questions about patterns, groups, or metrics in this study dataset.
                </CardDescription>
              </div>
            </div>
            {chatMessages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatMessages([])}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Chat
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Suggested Prompt Pills */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Suggested Questions for this Study:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={chatLoading}
                  className="text-xs bg-muted/60 hover:bg-muted text-foreground/90 hover:text-foreground px-3 py-1.5 rounded-full border border-border transition-all text-left disabled:opacity-50"
                >
                  &bull; {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Transcript Area */}
          {chatMessages.length > 0 && (
            <div className="space-y-4 max-h-[480px] overflow-y-auto p-4 rounded-xl bg-muted/20 border border-border">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded bg-black text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-1 shadow-sm">
                      T
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm whitespace-pre-wrap"
                        : "bg-card border border-border text-foreground rounded-tl-none shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-border/40">
                      <span className="text-[10px] font-semibold uppercase opacity-70">
                        {msg.role === "user" ? "Researcher" : "Tinat Research Assistant"}
                      </span>
                      <span className="text-[10px] opacity-50">{msg.timestamp}</span>
                    </div>
                    {msg.role === "user" ? (
                      <div>{msg.content}</div>
                    ) : (
                      <ResearchReportRenderer content={msg.content} compact />
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3 items-center text-muted-foreground text-xs py-2">
                  <div className="h-6 w-6 rounded bg-black text-white flex items-center justify-center font-bold text-[9px]">
                    T
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing empirical dataset...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about this study's responses, variables, or outcomes..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="rounded-xl px-4 gap-2"
            >
              {chatLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Analyze</span>
            </Button>
          </form>

          <p className="text-[10px] text-muted-foreground/70 text-center">
            The assistant analyzes only verified data from this specific study. Participant PII is never transmitted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
