"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button, getButtonClasses } from "../../../components/ui/Button";
import {
  HEALTH_CATEGORIES,
  STUDY_TYPES,
  MEDICAL_DISCLAIMER,
  HealthCategory,
} from "@/lib/healthCategories";
import {
  Coins,
  ClipboardCheck,
  Stethoscope,
  Clock,
  Users,
  Target,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

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

  const [studyType, setStudyType] = useState<"FUNDED" | "FREE_DATA_COLLECTION">("FUNDED");
  const [category, setCategory] = useState<HealthCategory>("Public Health");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [targetPopulation, setTargetPopulation] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);

  const [rewardCredits, setRewardCredits] = useState(5);
  const [participantTarget, setParticipantTarget] = useState(25);
  const [publishImmediately, setPublishImmediately] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([
    { text: "", type: "SHORT_TEXT", required: true, options: [] },
  ]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const budgetCredits = studyType === "FREE_DATA_COLLECTION" ? 0 : rewardCredits * participantTarget;

  function addQuestion() {
    setQuestions([...questions, { text: "", type: "SHORT_TEXT", required: true, options: [] }]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
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
        updated[index].scaleMinLabel = "Low / Strongly Disagree";
        updated[index].scaleMaxLabel = "High / Strongly Agree";
      }
      if (
        (type === "MULTIPLE_CHOICE_GRID" || type === "CHECKBOX_GRID") &&
        (!updated[index].rows || updated[index].rows.length === 0)
      ) {
        updated[index].rows = ["Item 1"];
        if (updated[index].options.length === 0) {
          updated[index].options = ["Option 1"];
        }
      }
      if (
        (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" || type === "DROPDOWN") &&
        updated[index].options.length === 0
      ) {
        updated[index].options = ["Option 1"];
      }
    }

    setQuestions(updated);
  }

  async function handleSubmit() {
    setError("");

    if (!title.trim()) return setError("Please enter a study title.");
    if (!category) return setError("Please select a health research category.");
    if (studyType === "FUNDED" && rewardCredits < 1) {
      return setError("Funded studies require a reward of at least 1 TC per participant.");
    }
    if (participantTarget <= 0) {
      return setError("Participant target must be at least 1.");
    }
    if (questions.some((q) => !q.text.trim())) {
      return setError("Every question must contain question text.");
    }

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
        if (typeof q.scaleMin !== "number" || typeof q.scaleMax !== "number" || q.scaleMin >= q.scaleMax) {
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
          title,
          description,
          studyType,
          category,
          objective,
          targetPopulation,
          estimatedMinutes,
          rewardCredits: studyType === "FREE_DATA_COLLECTION" ? 0 : rewardCredits,
          participantTarget,
          budgetCredits,
          questions,
          publishImmediately: studyType === "FREE_DATA_COLLECTION" ? publishImmediately : false,
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
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Medical & Health Research
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Health Study</h1>
        <p className="text-muted-foreground mt-1">
          Design your clinical questionnaire or health survey and define participant criteria.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 mb-8 text-destructive text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Study Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Choose Study Type <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Funded Research Card */}
            <div
              onClick={() => setStudyType("FUNDED")}
              className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all ${
                studyType === "FUNDED"
                  ? "border-emerald-600 bg-emerald-500/5 shadow-md"
                  : "border-border bg-card hover:border-emerald-500/40"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${
                      studyType === "FUNDED"
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">Funded Research</h3>
                    <span className="inline-block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-0.5">
                      Participant Reward Enabled
                    </span>
                  </div>
                </div>
                {studyType === "FUNDED" && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Formal academic, clinical, or grant-backed health research. Participants earn Tinat Credits (TC) upon completion.
              </p>
            </div>

            {/* Free Data Collection Card */}
            <div
              onClick={() => setStudyType("FREE_DATA_COLLECTION")}
              className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all ${
                studyType === "FREE_DATA_COLLECTION"
                  ? "border-emerald-600 bg-emerald-500/5 shadow-md"
                  : "border-border bg-card hover:border-emerald-500/40"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${
                      studyType === "FREE_DATA_COLLECTION"
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">Free Data Collection</h3>
                    <span className="inline-block text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full mt-0.5">
                      No Funding Needed • Free to Publish
                    </span>
                  </div>
                </div>
                {studyType === "FREE_DATA_COLLECTION" && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Ideal for medical student assignments, NGO health assessments, pilot questionnaires, and general community health surveys.
              </p>
            </div>
          </div>
        </div>

        {/* Study Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              Study & Health Profile
            </CardTitle>
            <CardDescription>
              Categorize your health study to reach the right participants and medical cohorts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium text-foreground">
                  Study Title <span className="text-destructive">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Assessment of Sleep Quality and Cognitive Fatigue in Medical Interns"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Health Research Category <span className="text-destructive">*</span>
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HealthCategory)}
                >
                  {HEALTH_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Estimated Completion Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Math.max(1, Number(e.target.value)))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
                <Target className="w-4 h-4 text-muted-foreground" />
                Research Objective / Hypothesis
              </label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                rows={2}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="E.g., To determine the correlation between night shifts and self-reported burnout metrics among clinical trainees."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                Target Population & Eligibility
              </label>
              <Input
                value={targetPopulation}
                onChange={(e) => setTargetPopulation(e.target.value)}
                placeholder="E.g., Medical interns, nurses, or adult patients aged 18-65"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Detailed Description & Methodology
              </label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the study background, ethical compliance, and what participants will experience."
              />
            </div>
          </CardContent>
        </Card>

        {/* Study Funding & Capacity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {studyType === "FUNDED" ? (
                <Coins className="w-5 h-5 text-emerald-600" />
              ) : (
                <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              )}
              {studyType === "FUNDED" ? "Study Funding & Capacity" : "Participant Target & Publishing"}
            </CardTitle>
            <CardDescription>
              {studyType === "FUNDED"
                ? "Allocate Tinat Credits to reward each verified participant."
                : "Free data collection requires no financial deposit or participant incentives."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {studyType === "FUNDED" ? (
              <div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Reward per participant (TC) <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                        value={rewardCredits}
                        onChange={(e) => setRewardCredits(Math.max(1, Number(e.target.value)))}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-xs font-bold text-muted-foreground">TC</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum 1 TC. Higher rewards increase participant engagement.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Participant Target Cap <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                      value={participantTarget}
                      onChange={(e) => setParticipantTarget(Math.max(1, Number(e.target.value)))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of participant responses to accept.
                    </p>
                  </div>
                </div>

                <div className="mt-6 bg-muted/50 rounded-xl p-4 border border-border flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Total Required Budget</p>
                    <p className="text-xs text-muted-foreground">
                      {participantTarget} participants × {rewardCredits} TC reward
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {budgetCredits} <span className="text-sm font-normal text-muted-foreground">TC</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Zero-Cost Publishing
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground leading-relaxed">
                    This study will be published as an open volunteer health study. Participants will not receive Tinat Credits, and you do not need to fund a wallet balance.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Desired Participant Target
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                      value={participantTarget}
                      onChange={(e) => setParticipantTarget(Math.max(1, Number(e.target.value)))}
                    />
                    <p className="text-xs text-muted-foreground">
                      The study automatically closes once this target is reached.
                    </p>
                  </div>

                  <div className="flex flex-col justify-center space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={publishImmediately}
                        onChange={(e) => setPublishImmediately(e.target.checked)}
                        className="rounded border-input text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="text-sm font-medium text-foreground">
                        Publish Immediately as Active
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground pl-6">
                      If unchecked, the study is saved as a Draft so you can review before activating.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Questions & Questionnaire</h2>
              <p className="text-sm text-muted-foreground">Add survey questions, rating scales, or checklists.</p>
            </div>
            <Button variant="outline" size="sm" onClick={addQuestion}>
              + Add Question
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    Question {idx + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase">
                        Question Text
                      </label>
                      <Input
                        value={q.text}
                        onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                        placeholder="E.g., How many hours of uninterrupted sleep do you average per night?"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase">
                        Response Type
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                        value={q.type}
                        onChange={(e) => updateQuestion(idx, "type", e.target.value)}
                      >
                        <option value="SHORT_TEXT">Short Text</option>
                        <option value="LONG_TEXT">Long Text / Paragraph</option>
                        <option value="SINGLE_CHOICE">Single Choice (Radio)</option>
                        <option value="MULTIPLE_CHOICE">Multiple Choice (Checkboxes)</option>
                        <option value="DROPDOWN">Dropdown</option>
                        <option value="NUMBER">Number</option>
                        <option value="YES_NO">Yes / No</option>
                        <option value="LINEAR_SCALE">Linear Rating Scale</option>
                        <option value="DATE">Date</option>
                        <option value="TIME">Time</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`req-${idx}`}
                      checked={q.required}
                      onChange={(e) => updateQuestion(idx, "required", e.target.checked)}
                      className="rounded border-input text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label htmlFor={`req-${idx}`} className="text-xs font-medium text-foreground cursor-pointer">
                      Required question
                    </label>
                  </div>

                  {/* Options editor for choice types */}
                  {["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type) && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase">
                        Choices / Options
                      </label>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2 items-center">
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const opts = [...q.options];
                              opts[optIdx] = e.target.value;
                              updateQuestion(idx, "options", opts);
                            }}
                            placeholder={`Option ${optIdx + 1}`}
                          />
                          {q.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const opts = q.options.filter((_, i) => i !== optIdx);
                                updateQuestion(idx, "options", opts);
                              }}
                              className="text-xs text-destructive hover:underline px-2"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuestion(idx, "options", [...q.options, ""])}
                      >
                        + Add Option
                      </Button>
                    </div>
                  )}

                  {/* Linear Scale Editor */}
                  {q.type === "LINEAR_SCALE" && (
                    <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Min Label (1)</label>
                        <Input
                          value={q.scaleMinLabel || ""}
                          onChange={(e) => updateQuestion(idx, "scaleMinLabel", e.target.value)}
                          placeholder="e.g., Strongly Disagree"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Max Label (5)</label>
                        <Input
                          value={q.scaleMaxLabel || ""}
                          onChange={(e) => updateQuestion(idx, "scaleMaxLabel", e.target.value)}
                          placeholder="e.g., Strongly Agree"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Medical Research Disclaimer */}
        <div className="rounded-xl p-4 bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">Health Research Protocol Notice: </span>
            {MEDICAL_DISCLAIMER} Please ensure your questionnaire respects participant privacy and ethical guidelines for human subjects data collection.
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-border">
          <Button size="lg" onClick={handleSubmit} isLoading={loading} className="px-8">
            {studyType === "FREE_DATA_COLLECTION" && publishImmediately
              ? "Publish Health Study"
              : "Create Study"}
          </Button>
        </div>
      </div>
    </div>
  );
}
