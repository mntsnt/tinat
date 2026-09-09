"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button, getButtonClasses } from "../../../components/ui/Button";

type Question = {
  text: string;
  type: string;
  required: boolean;
  options: string[];
  rows?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
};

export default function CreateStudyPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardCredits, setRewardCredits] = useState(5);
  const [participantTarget, setParticipantTarget] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", type: "SHORT_TEXT", required: true, options: [] },
  ]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const budgetCredits = rewardCredits * participantTarget;

  function addQuestion() {
    setQuestions([...questions, { text: "", type: "SHORT_TEXT", required: true, options: [] }]);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, field: keyof Question, value: any) {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-setup defaults when switching types
    if (field === "type") {
      const type = value as string;
      if (type === "LINEAR_SCALE" && updated[index].scaleMin === undefined) {
        updated[index].scaleMin = 1;
        updated[index].scaleMax = 5;
        updated[index].scaleMinLabel = "";
        updated[index].scaleMaxLabel = "";
      }
      if ((type === "MULTIPLE_CHOICE_GRID" || type === "CHECKBOX_GRID") && (!updated[index].rows || updated[index].rows.length === 0)) {
        updated[index].rows = [""];
        if (updated[index].options.length === 0) {
          updated[index].options = [""];
        }
      }
      if ((type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" || type === "DROPDOWN") && updated[index].options.length === 0) {
        updated[index].options = [""];
      }
    }
    
    setQuestions(updated);
  }

  async function handleSubmit() {
    setError("");

    if (!title.trim()) return setError("Please enter a study title.");
    if (rewardCredits < 0) return setError("Reward cannot be negative.");
    if (participantTarget <= 0) return setError("Participant target must be greater than 0.");
    if (questions.some((q) => !q.text.trim())) return setError("Every question needs text.");

    for (const q of questions) {
      if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN", "MULTIPLE_CHOICE_GRID", "CHECKBOX_GRID"].includes(q.type)) {
        if (q.options.length === 0 || q.options.some((o) => !o.trim())) {
          return setError(`Please add valid options/columns for "${q.text}".`);
        }
      }
      if (["MULTIPLE_CHOICE_GRID", "CHECKBOX_GRID"].includes(q.type)) {
        if (!q.rows || q.rows.length === 0 || q.rows.some((r) => !r.trim())) {
          return setError(`Please add valid rows for "${q.text}".`);
        }
      }
      if (q.type === "LINEAR_SCALE") {
        if (typeof q.scaleMin !== 'number' || typeof q.scaleMax !== 'number' || q.scaleMin >= q.scaleMax) {
          return setError(`Please set a valid scale (min < max) for "${q.text}".`);
        }
      }
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, rewardCredits, participantTarget, budgetCredits, questions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create study.");
        return;
      }

      router.push(`/researcher/studies/${data.study.id}`);
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
      <div className="mb-8">
        <Link href="/researcher" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Research Study</h1>
        <p className="text-muted-foreground mt-2">Design your questionnaire and set participant requirements.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-8">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Study Details</CardTitle>
            <CardDescription>Basic information about your research.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Study Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., The Impact of Sleep on Memory"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground">Description</label>
              <textarea
                className="flex w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your research goals and what participants will do."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Funding</CardTitle>
            <CardDescription>Set the reward and target number of participants.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">Reward per participant (TC)</label>
                <div className="relative">
                  <input
                    type="number" min="0"
                    className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                    value={rewardCredits}
                    onChange={(e) => setRewardCredits(Number(e.target.value))}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-muted-foreground sm:text-sm">TC</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Set to 0 to publish an unpaid volunteer study.</p>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">Number of participants</label>
                <input
                  type="number" min="1"
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  value={participantTarget}
                  onChange={(e) => setParticipantTarget(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-6 bg-muted/50 rounded-lg p-4 border border-border flex justify-between items-center">
              <div>
                <p className="font-medium text-foreground">Total Budget</p>
                <p className="text-sm text-muted-foreground">{participantTarget} participants × {rewardCredits} TC</p>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {budgetCredits} <span className="text-lg text-muted-foreground font-normal">TC</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Questions</h2>
            <Button variant="outline" size="sm" onClick={addQuestion}>+ Add Question</Button>
          </div>
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                  {questions.length > 1 && (
                    <Button variant="ghost" size="sm" className="text-red-500 h-8 px-2" onClick={() => removeQuestion(idx)}>Remove</Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Question Text"
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                    placeholder="E.g., How many hours of sleep do you get on average?"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-foreground">Answer Type</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                        value={q.type}
                        onChange={(e) => updateQuestion(idx, "type", e.target.value)}
                      >
                        <option value="SHORT_TEXT">Short answer</option>
                        <option value="LONG_TEXT">Paragraph</option>
                        <option value="SINGLE_CHOICE">Multiple choice (Radio)</option>
                        <option value="MULTIPLE_CHOICE">Checkboxes</option>
                        <option value="DROPDOWN">Drop-down</option>
                        <option value="FILE_UPLOAD">File upload</option>
                        <option value="LINEAR_SCALE">Linear scale</option>
                        <option value="MULTIPLE_CHOICE_GRID">Multiple-choice grid</option>
                        <option value="CHECKBOX_GRID">Checkbox grid</option>
                        <option value="NUMBER">Number</option>
                        <option value="YES_NO">Yes / No</option>
                        <option value="DATE">Date</option>
                        <option value="TIME">Time</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-foreground border-border focus:ring-slate-900"
                          checked={q.required}
                          onChange={(e) => updateQuestion(idx, "required", e.target.checked)}
                        />
                        <span className="text-sm font-medium text-foreground">Required</span>
                      </label>
                    </div>
                  </div>

                  {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE" || q.type === "DROPDOWN") && (
                    <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
                      <label className="block text-sm font-medium text-foreground">Options</label>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2">
                          <Input
                            className="flex-1"
                            value={opt}
                            onChange={(e) => {
                              const opts = [...q.options];
                              opts[optIdx] = e.target.value;
                              updateQuestion(idx, "options", opts);
                            }}
                            placeholder={`Option ${optIdx + 1}`}
                          />
                          <Button variant="ghost" size="sm" className="text-muted-foreground mt-1" onClick={() => {
                            const opts = q.options.filter((_, i) => i !== optIdx);
                            updateQuestion(idx, "options", opts);
                          }}>Remove</Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                        updateQuestion(idx, "options", [...q.options, ""]);
                      }}>+ Add Option</Button>
                    </div>
                  )}

                  {q.type === "LINEAR_SCALE" && (
                    <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium">Minimum Value</label>
                          <input type="number" value={q.scaleMin} onChange={e => updateQuestion(idx, "scaleMin", Number(e.target.value))} className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium">Maximum Value</label>
                          <input type="number" value={q.scaleMax} onChange={e => updateQuestion(idx, "scaleMax", Number(e.target.value))} className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium">Minimum Label (Optional)</label>
                          <input type="text" value={q.scaleMinLabel || ""} onChange={e => updateQuestion(idx, "scaleMinLabel", e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="e.g. Strongly Disagree" />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium">Maximum Label (Optional)</label>
                          <input type="text" value={q.scaleMaxLabel || ""} onChange={e => updateQuestion(idx, "scaleMaxLabel", e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="e.g. Strongly Agree" />
                        </div>
                      </div>
                    </div>
                  )}

                  {(q.type === "MULTIPLE_CHOICE_GRID" || q.type === "CHECKBOX_GRID") && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
                        <label className="block text-sm font-medium text-foreground">Rows</label>
                        {(q.rows || []).map((row, rowIdx) => (
                          <div key={rowIdx} className="flex gap-2">
                            <Input
                              className="flex-1"
                              value={row}
                              onChange={(e) => {
                                const rows = [...(q.rows || [])];
                                rows[rowIdx] = e.target.value;
                                updateQuestion(idx, "rows", rows);
                              }}
                              placeholder={`Row ${rowIdx + 1}`}
                            />
                            <Button variant="ghost" size="sm" className="text-muted-foreground mt-1" onClick={() => {
                              const rows = (q.rows || []).filter((_, i) => i !== rowIdx);
                              updateQuestion(idx, "rows", rows);
                            }}>Remove</Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                          updateQuestion(idx, "rows", [...(q.rows || []), ""]);
                        }}>+ Add Row</Button>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
                        <label className="block text-sm font-medium text-foreground">Columns</label>
                        {q.options.map((col, colIdx) => (
                          <div key={colIdx} className="flex gap-2">
                            <Input
                              className="flex-1"
                              value={col}
                              onChange={(e) => {
                                const opts = [...q.options];
                                opts[colIdx] = e.target.value;
                                updateQuestion(idx, "options", opts);
                              }}
                              placeholder={`Column ${colIdx + 1}`}
                            />
                            <Button variant="ghost" size="sm" className="text-muted-foreground mt-1" onClick={() => {
                              const opts = q.options.filter((_, i) => i !== colIdx);
                              updateQuestion(idx, "options", opts);
                            }}>Remove</Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                          updateQuestion(idx, "options", [...q.options, ""]);
                        }}>+ Add Column</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-border">
          <Button size="lg" onClick={handleSubmit} isLoading={loading}>
            Create Study
          </Button>
        </div>
      </div>
    </div>
  );
}
