"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { BookOpen, LoaderCircle, Send, Sparkles, X } from "lucide-react";
import { AcademyMarkdown } from "./AcademyMarkdown";

interface AcademyAIAssistantProps {
  moduleSlug: string;
  moduleTitle: string;
  lessonSlug: string;
  lessonTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "Explain the key ideas in this lesson simply",
  "Give me a practical example",
  "What should I remember from this lesson?",
];

export function AcademyAIAssistant({
  moduleSlug,
  moduleTitle,
  lessonSlug,
  lessonTitle,
  isOpen,
  onClose,
}: AcademyAIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  if (!isOpen) return null;

  const askQuestion = async (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending) return;

    setDraft("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: trimmedQuestion }]);
    setIsSending(true);

    try {
      const response = await fetch("/api/academy/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleSlug,
          lessonSlug,
          message: trimmedQuestion,
          history: messages.slice(-10),
        }),
      });
      const payload: unknown = await response.json();
      const result =
        payload && typeof payload === "object"
          ? (payload as { reply?: unknown; error?: unknown })
          : {};

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "The AI assistant could not answer right now. Please try again."
        );
      }

      const reply = result.reply;
      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("The AI assistant returned an empty answer. Please try again.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch (requestError) {
      setMessages((current) => current.slice(0, -1));
      setDraft(trimmedQuestion);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The AI assistant could not answer right now. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void askQuestion(draft);
  };

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="academy-ai-title"
      className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-background shadow-lg sm:w-[26rem]"
    >
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 id="academy-ai-title" className="m-0 truncate text-sm font-bold text-foreground">
              Academy AI Assistant
            </h2>
            <p className="m-0 truncate text-xs text-muted-foreground">{lessonTitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI study assistant"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start gap-2 border-b border-border bg-muted/20 px-5 py-3 text-xs leading-5 text-muted-foreground">
          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="m-0">
            Grounded in <span className="font-medium text-foreground">{moduleTitle}</span> and
            this lesson. Your question and lesson context are processed by the configured AI
            provider; chat is not saved. Don&apos;t include personal or participant data.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Ask for a clarification, an example, a summary, or help connecting this material
                to your research.
              </p>
              <div className="space-y-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={isSending}
                    onClick={() => void askQuestion(question)}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[94%] rounded-xl px-3.5 py-3 ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto border border-border bg-card text-foreground"
                }`}
              >
                {message.role === "assistant" ? (
                  <AcademyMarkdown content={message.content} className="text-sm" />
                ) : (
                  <p className="m-0 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                )}
              </div>
            ))
          )}
          {isSending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-4">
          {error && (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <label htmlFor="academy-ai-question" className="sr-only">
              Ask about this module
            </label>
            <textarea
              id="academy-ai-question"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={2000}
              rows={2}
              placeholder="Ask a question…"
              className="max-h-32 min-h-11 flex-1 resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              aria-label="Send question"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
          <p className="mb-0 mt-2 text-[10px] text-muted-foreground">
            AI can make mistakes. Verify important academic information.
          </p>
        </div>
      </div>
    </aside>
  );
}
