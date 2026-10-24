"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Check,
  MoveUp,
  MoveDown,
  Sparkles,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ChevronDown,
  SlidersHorizontal,
  Calendar,
  Binary,
  Hash,
  ExternalLink,
  Share2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

type QuestionTypeOption = {
  type: string;
  label: string;
  icon: any;
  hasOptions?: boolean;
  hasScale?: boolean;
};

const QUESTION_TYPES: QuestionTypeOption[] = [
  { type: "SHORT_TEXT", label: "Short Answer", icon: AlignLeft },
  { type: "LONG_TEXT", label: "Paragraph", icon: AlignLeft },
  { type: "SINGLE_CHOICE", label: "Multiple Choice", icon: CircleDot, hasOptions: true },
  { type: "MULTIPLE_CHOICE", label: "Checkboxes", icon: CheckSquare, hasOptions: true },
  { type: "DROPDOWN", label: "Dropdown", icon: ChevronDown, hasOptions: true },
  { type: "LINEAR_SCALE", label: "Linear Scale (1-5)", icon: SlidersHorizontal, hasScale: true },
  { type: "YES_NO", label: "Yes / No", icon: Binary },
  { type: "DATE", label: "Date", icon: Calendar },
  { type: "NUMBER", label: "Number", icon: Hash },
];

interface FormQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

export default function NewFormPage() {
  const router = useRouter();

  const [title, setTitle] = useState("Untitled Form");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      id: "q_1",
      text: "",
      type: "SINGLE_CHOICE",
      required: true,
      options: ["Option 1", "Option 2"],
    },
  ]);

  const [activeQuestionId, setActiveQuestionId] = useState<string>("q_1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  function addQuestion() {
    const newId = `q_${Date.now()}`;
    const newQ: FormQuestion = {
      id: newId,
      text: "",
      type: "SINGLE_CHOICE",
      required: false,
      options: ["Option 1"],
    };
    setQuestions((prev) => [...prev, newQ]);
    setActiveQuestionId(newId);
  }

  function updateQuestion(id: string, updates: Partial<FormQuestion>) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  }

  function duplicateQuestion(index: number) {
    const source = questions[index];
    const newQ: FormQuestion = {
      ...source,
      id: `q_${Date.now()}`,
      options: [...source.options],
    };
    const nextQuestions = [...questions];
    nextQuestions.splice(index + 1, 0, newQ);
    setQuestions(nextQuestions);
    setActiveQuestionId(newQ.id);
  }

  function deleteQuestion(id: string) {
    if (questions.length <= 1) {
      alert("A form must have at least one question.");
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function moveQuestion(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const copy = [...questions];
    const [removed] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, removed);
    setQuestions(copy);
  }

  function addOption(questionId: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          options: [...q.options, `Option ${q.options.length + 1}`],
        };
      })
    );
  }

  function updateOption(questionId: string, optIndex: number, text: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const newOpts = [...q.options];
        newOpts[optIndex] = text;
        return { ...q, options: newOpts };
      })
    );
  }

  function removeOption(questionId: string, optIndex: number) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        if (q.options.length <= 1) return q;
        return {
          ...q,
          options: q.options.filter((_, i) => i !== optIndex),
        };
      })
    );
  }

  async function handlePublish() {
    setError(null);

    if (!title.trim()) {
      setError("Please provide a title for your form.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setError(`Question #${i + 1} is empty. Please enter question text.`);
        setActiveQuestionId(questions[i].id);
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          type: q.type,
          required: q.required,
          options: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type)
            ? q.options.map((opt) => opt.trim()).filter(Boolean)
            : [],
          scaleMin: q.type === "LINEAR_SCALE" ? q.scaleMin || 1 : undefined,
          scaleMax: q.type === "LINEAR_SCALE" ? q.scaleMax || 5 : undefined,
          scaleMinLabel: q.type === "LINEAR_SCALE" ? q.scaleMinLabel || "Poor" : undefined,
          scaleMaxLabel: q.type === "LINEAR_SCALE" ? q.scaleMaxLabel || "Excellent" : undefined,
        })),
      };

      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create form");
      }

      setCreatedFormId(data.form.id);
    } catch (err: any) {
      setError(err.message || "Failed to publish form.");
    } finally {
      setSaving(false);
    }
  }

  function handleCopyShareLink() {
    if (!createdFormId) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/f/${createdFormId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 md:px-7 md:py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/forms"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Tinat Forms
        </Link>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePublish}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            {saving ? "Publishing..." : "Publish & Share"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      {/* Form Header Card (Google Forms Style) */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden relative">
        <div className="h-3 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="p-6 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Form Title"
            className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none transition-colors pb-1"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Form description or instructions for respondents (optional)"
            rows={2}
            className="w-full text-sm sm:text-base text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none resize-none transition-colors"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, qIndex) => {
          const isActive = activeQuestionId === question.id;
          const currentTypeConfig =
            QUESTION_TYPES.find((t) => t.type === question.type) || QUESTION_TYPES[0];

          return (
            <div
              key={question.id}
              onClick={() => setActiveQuestionId(question.id)}
              className={`rounded-xl border bg-card shadow-sm transition-all overflow-hidden relative ${
                isActive
                  ? "border-emerald-500 ring-1 ring-emerald-500/30"
                  : "hover:border-border"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
              )}

              <div className="p-6 space-y-5 pl-7">
                {/* Question title & type row */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(question.id, { text: e.target.value })
                      }
                      placeholder={`Question ${qIndex + 1}`}
                      className="w-full text-base font-medium bg-muted/20 border rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* Type Selector */}
                  <div className="sm:w-56">
                    <select
                      value={question.type}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          type: e.target.value,
                          options: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(
                            e.target.value
                          )
                            ? question.options.length > 0
                              ? question.options
                              : ["Option 1"]
                            : [],
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2.5 bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Question Type Body */}
                <div className="pt-2">
                  {/* Short Answer Preview */}
                  {question.type === "SHORT_TEXT" && (
                    <div className="border-b border-dashed border-border/80 pb-2 text-muted-foreground text-sm italic w-full max-w-xs">
                      Short-answer text
                    </div>
                  )}

                  {/* Long Answer Preview */}
                  {question.type === "LONG_TEXT" && (
                    <div className="border-b border-dashed border-border/80 pb-6 text-muted-foreground text-sm italic w-full max-w-md">
                      Long-answer paragraph text
                    </div>
                  )}

                  {/* Yes / No Preview */}
                  {question.type === "YES_NO" && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="px-4 py-1.5 rounded-full border bg-muted/30">Yes</span>
                      <span className="px-4 py-1.5 rounded-full border bg-muted/30">No</span>
                    </div>
                  )}

                  {/* Date Preview */}
                  {question.type === "DATE" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-3 py-2 w-max bg-muted/20">
                      <Calendar className="h-4 w-4" />
                      <span>Month, day, year</span>
                    </div>
                  )}

                  {/* Number Preview */}
                  {question.type === "NUMBER" && (
                    <div className="border-b border-dashed border-border/80 pb-2 text-muted-foreground text-sm italic w-full max-w-xs">
                      Number input
                    </div>
                  )}

                  {/* Options List (Single, Multiple, Dropdown) */}
                  {currentTypeConfig.hasOptions && (
                    <div className="space-y-2.5">
                      {question.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          {question.type === "SINGLE_CHOICE" && (
                            <CircleDot className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          {question.type === "MULTIPLE_CHOICE" && (
                            <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          {question.type === "DROPDOWN" && (
                            <span className="text-xs font-semibold text-muted-foreground w-4 text-center">
                              {optIndex + 1}.
                            </span>
                          )}

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              updateOption(question.id, optIndex, e.target.value)
                            }
                            placeholder={`Option ${optIndex + 1}`}
                            className="flex-1 text-sm bg-transparent border-b border-border hover:border-emerald-500/50 focus:border-emerald-500 focus:outline-none py-1"
                          />

                          {question.options.length > 1 && (
                            <button
                              onClick={() => removeOption(question.id, optIndex)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                              title="Remove option"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => addOption(question.id)}
                        className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 pt-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add option
                      </button>
                    </div>
                  )}

                  {/* Linear Scale Config */}
                  {question.type === "LINEAR_SCALE" && (
                    <div className="space-y-3 bg-muted/20 p-4 rounded-lg">
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span>1 to 5 scale</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-muted-foreground">Label for 1 (optional)</label>
                          <input
                            type="text"
                            value={question.scaleMinLabel || ""}
                            onChange={(e) =>
                              updateQuestion(question.id, {
                                scaleMinLabel: e.target.value,
                              })
                            }
                            placeholder="e.g. Strongly Disagree"
                            className="w-full mt-1 border rounded px-2.5 py-1.5 bg-background text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground">Label for 5 (optional)</label>
                          <input
                            type="text"
                            value={question.scaleMaxLabel || ""}
                            onChange={(e) =>
                              updateQuestion(question.id, {
                                scaleMaxLabel: e.target.value,
                              })
                            }
                            placeholder="e.g. Strongly Agree"
                            className="w-full mt-1 border rounded px-2.5 py-1.5 bg-background text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Card Bottom Toolbar */}
                <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveQuestion(qIndex, "up")}
                      disabled={qIndex === 0}
                      className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                      title="Move up"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveQuestion(qIndex, "down")}
                      disabled={qIndex === questions.length - 1}
                      className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                      title="Move down"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => duplicateQuestion(qIndex)}
                      className="hover:text-foreground p-1.5 rounded transition-colors"
                      title="Duplicate question"
                    >
                      <Copy className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => deleteQuestion(question.id)}
                      className="hover:text-destructive p-1.5 rounded transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="h-4 w-[1px] bg-border" />

                    {/* Required Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span>Required</span>
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) =>
                          updateQuestion(question.id, { required: e.target.checked })
                        }
                        className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Question Button */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={addQuestion}
          variant="outline"
          className="rounded-full border-dashed border-2 hover:border-emerald-500 hover:text-emerald-600 px-6 py-5 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Question</span>
        </Button>
      </div>

      {/* Post-Publish Success Modal */}
      {createdFormId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-600">
              <Sparkles className="h-10 w-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold">Your Tinat Form is Live!</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Anyone with this public link can fill and submit your form without signing in.
              </p>
            </div>

            {/* Share Link Box */}
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/f/${createdFormId}`}
                className="flex-1 bg-transparent text-xs font-mono px-2 outline-none select-all"
              />
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs"
                onClick={handleCopyShareLink}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                  </>
                )}
              </Button>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href={`/f/${createdFormId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="outline" className="w-full text-xs">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View Form
                </Button>
              </Link>

              <Link href="/forms" className="w-full">
                <Button className="w-full bg-foreground text-background text-xs">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
