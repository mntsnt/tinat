"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Copy } from "lucide-react";
import { StudyBanner } from "../../../components/studies/StudyBanner";

type Option = {
  id: string;
  text: string;
  value: string;
  order: number;
};

type Row = {
  id: string;
  text: string;
  value: string;
  order: number;
};

type Question = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options: Option[];
  rows: Row[];
  scaleMin: number | null;
  scaleMax: number | null;
  scaleMinLabel: string | null;
  scaleMaxLabel: string | null;
};

type StudyComment = {
  id: string;
  text: string;
  createdAt: Date;
  parentId?: string | null;
  user: { name: string; avatarUrl: string | null; role?: string };
  replies?: StudyComment[];
};

type Study = {
  id: string;
  title: string;
  bannerTheme?: string;
  description: string | null;
  studyType?: string;
  category?: string | null;
  objective?: string | null;
  targetPopulation?: string | null;
  estimatedMinutes?: number | null;
  rewardCredits: number;
  researcher: { name: string };
  questions: Question[];
  likes: { userId: string }[];
  comments: StudyComment[];
};

type SubmitResponse = {
  message?: string;
  error?: string;
  creditsEarned?: number;
  newBalance?: number;
};

export default function StudyQuestionnaire({
  study,
  currentUserId,
  initialHasLiked,
  initialLikeCount,
}: {
  study: Study;
  currentUserId: string;
  initialHasLiked?: boolean;
  initialLikeCount?: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  function handleCopyLink() {
    // Determine base URL dynamically (works on client-side)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/studies/${study.id}`; // Wait, public studies page isn't implemented? We'll just use current URL
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }


  function updateAnswer(questionId: string, value: any) {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  }

  function handleMultipleChoice(questionId: string, optionValue: string) {
    setAnswers((previous) => {
      const current = Array.isArray(previous[questionId]) ? previous[questionId] : [];
      if (current.includes(optionValue)) {
        return { ...previous, [questionId]: current.filter((v: string) => v !== optionValue) };
      }
      return { ...previous, [questionId]: [...current, optionValue] };
    });
  }

  function handleGridMultipleChoice(questionId: string, rowValue: string, optionValue: string) {
    setAnswers((previous) => {
      const currentGrid = previous[questionId] || {};
      return { ...previous, [questionId]: { ...currentGrid, [rowValue]: optionValue } };
    });
  }

  function handleGridCheckbox(questionId: string, rowValue: string, optionValue: string) {
    setAnswers((previous) => {
      const currentGrid = previous[questionId] || {};
      const currentRow = Array.isArray(currentGrid[rowValue]) ? currentGrid[rowValue] : [];
      if (currentRow.includes(optionValue)) {
        return { ...previous, [questionId]: { ...currentGrid, [rowValue]: currentRow.filter((v: string) => v !== optionValue) } };
      }
      return { ...previous, [questionId]: { ...currentGrid, [rowValue]: [...currentRow, optionValue] } };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || submitted) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/studies/${study.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = (await response.json()) as SubmitResponse;

      if (!response.ok) {
        setError(data.error || "Failed to submit your response.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setSubmitted(true);
      if (study.rewardCredits > 0) {
        setSuccess(`Research completed successfully! You earned ${data.creditsEarned ?? study.rewardCredits} Tinat Credits.`);
      } else {
        setSuccess("Thank you! Your health data collection response was recorded successfully.");
      }

      setTimeout(() => {
        router.push("/participant");
        router.refresh();
      }, 1800);
    } catch (caughtError) {
      console.error("Study submission error:", caughtError);
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong while submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  function renderQuestion(question: Question) {
    const value = answers[question.id];

    switch (question.type) {
      case "LONG_TEXT":
        return (
          <textarea
            className="flex w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            rows={4}
            disabled={loading || submitted}
          />
        );
      case "NUMBER":
        return (
          <Input
            type="number"
            value={typeof value === "string" || typeof value === "number" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={loading || submitted}
          />
        );
      case "DATE":
        return (
          <Input
            type="date"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={loading || submitted}
          />
        );
      case "TIME":
        return (
          <Input
            type="time"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={loading || submitted}
          />
        );
      case "YES_NO":
        return (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="Yes"
                className="w-4 h-4 text-foreground border-border focus:ring-slate-900"
                checked={value === "Yes"}
                onChange={(e) => updateAnswer(question.id, e.target.value)}
                disabled={loading || submitted}
              />
              <span className="text-sm font-medium">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="No"
                className="w-4 h-4 text-foreground border-border focus:ring-slate-900"
                checked={value === "No"}
                onChange={(e) => updateAnswer(question.id, e.target.value)}
                disabled={loading || submitted}
              />
              <span className="text-sm font-medium">No</span>
            </label>
          </div>
        );
      case "SINGLE_CHOICE":
        return (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  className="w-4 h-4 text-foreground border-border focus:ring-slate-900"
                  checked={value === option.value}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  disabled={loading || submitted}
                />
                <span className="text-sm font-medium">{option.text}</span>
              </label>
            ))}
          </div>
        );
      case "MULTIPLE_CHOICE":
        return (
          <div className="space-y-2">
            {question.options.map((option) => {
              const selected = Array.isArray(value) ? value : [];
              return (
                <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-foreground border-border focus:ring-slate-900"
                    checked={selected.includes(option.value)}
                    onChange={() => handleMultipleChoice(question.id, option.value)}
                    disabled={loading || submitted}
                  />
                  <span className="text-sm font-medium">{option.text}</span>
                </label>
              );
            })}
          </div>
        );
      case "DROPDOWN":
        return (
          <select
            className="flex h-10 w-full md:w-1/2 rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={loading || submitted}
          >
            <option value="" disabled>Select an option</option>
            {question.options.map(opt => (
              <option key={opt.id} value={opt.value}>{opt.text}</option>
            ))}
          </select>
        );
      case "FILE_UPLOAD":
        return (
          <div className="space-y-2">
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // MOCK: We store a fake URL in textValue for now as requested.
                  // TODO: Connect this to S3/Supabase upload SDK.
                  updateAnswer(question.id, `pending_upload_url/${file.name}`);
                }
              }}
              disabled={loading || submitted}
            />
            <p className="text-xs text-muted-foreground">Note: File upload is simulated. An S3 bucket or similar storage provider should be connected here.</p>
          </div>
        );
      case "LINEAR_SCALE":
        const min = question.scaleMin || 1;
        const max = question.scaleMax || 5;
        const scaleOptions = [];
        for (let i = min; i <= max; i++) scaleOptions.push(i);
        
        return (
          <div className="flex flex-col gap-4 overflow-x-auto pb-2">
            <div className="flex justify-between w-full min-w-[300px] max-w-[600px] text-sm text-muted-foreground">
              <span>{question.scaleMinLabel}</span>
              <span>{question.scaleMaxLabel}</span>
            </div>
            <div className="flex justify-between w-full min-w-[300px] max-w-[600px]">
              {scaleOptions.map(opt => (
                <label key={opt} className="flex flex-col items-center gap-2 cursor-pointer">
                  <span className="text-sm font-medium">{opt}</span>
                  <input
                    type="radio"
                    name={question.id}
                    value={opt}
                    className="w-5 h-5 text-foreground border-border focus:ring-slate-900"
                    checked={Number(value) === opt}
                    onChange={(e) => updateAnswer(question.id, Number(e.target.value))}
                    disabled={loading || submitted}
                  />
                </label>
              ))}
            </div>
          </div>
        );
      case "MULTIPLE_CHOICE_GRID":
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium"></th>
                  {question.options.map(opt => (
                    <th key={opt.id} className="px-4 py-3 font-medium text-center">{opt.text}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.rows?.map(row => (
                  <tr key={row.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{row.text}</td>
                    {question.options.map(opt => (
                      <td key={opt.id} className="px-4 py-3 text-center">
                        <input
                          type="radio"
                          name={`${question.id}_${row.id}`}
                          value={opt.value}
                          className="w-4 h-4 cursor-pointer"
                          checked={value?.[row.value] === opt.value}
                          onChange={(e) => handleGridMultipleChoice(question.id, row.value, e.target.value)}
                          disabled={loading || submitted}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "CHECKBOX_GRID":
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium"></th>
                  {question.options.map(opt => (
                    <th key={opt.id} className="px-4 py-3 font-medium text-center">{opt.text}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.rows?.map(row => {
                  const currentRowSelected = Array.isArray(value?.[row.value]) ? value[row.value] : [];
                  return (
                    <tr key={row.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{row.text}</td>
                      {question.options.map(opt => (
                        <td key={opt.id} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            value={opt.value}
                            className="w-4 h-4 cursor-pointer rounded"
                            checked={currentRowSelected.includes(opt.value)}
                            onChange={() => handleGridCheckbox(question.id, row.value, opt.value)}
                            disabled={loading || submitted}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      case "SHORT_TEXT":
      default:
        return (
          <Input
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={loading || submitted}
          />
        );
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-3xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/participant")} disabled={loading} className="mb-4 -ml-4">
          &larr; Back to Dashboard
        </Button>
        <StudyBanner theme={study.bannerTheme} className="mb-5 h-32 rounded-xl sm:h-40" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {study.category && (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                {study.category}
              </Badge>
            )}
            <Badge variant="secondary">By {study.researcher.name}</Badge>
            {study.rewardCredits > 0 ? (
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold">
                Reward: {study.rewardCredits} TC
              </Badge>
            ) : (
              <Badge variant="outline" className="border-blue-300 bg-primary/5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-medium">
                Open Data Collection &bull; Volunteer
              </Badge>
            )}
            {study.estimatedMinutes && (
              <span className="text-xs text-muted-foreground">
                ~{study.estimatedMinutes} mins
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{study.title}</h1>
        </div>

        {study.objective && (
          <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border text-sm">
            <span className="font-semibold text-foreground text-xs uppercase tracking-wider block mb-1">
              Research Objective
            </span>
            <p className="text-muted-foreground italic">"{study.objective}"</p>
          </div>
        )}

        {study.targetPopulation && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Target Cohort:</span> {study.targetPopulation}
          </div>
        )}

        {study.description && (
          <p className="mt-4 text-muted-foreground bg-card p-4 rounded-lg border border-border leading-relaxed whitespace-pre-wrap text-sm">
            {study.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Active Survey · Responses are anonymous and secure
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-md hover:bg-muted text-xs h-8 text-muted-foreground hover:text-foreground"
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <span className="text-emerald-600 font-medium">Link Copied!</span>
                <Copy className="w-3.5 h-3.5 text-emerald-600" />
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Share Form</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-success">Submission Successful</h3>
          <p className="mt-2 text-sm text-success-foreground">{success}</p>
          <p className="mt-1 text-xs text-success">Redirecting to dashboard...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {!submitted && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {study.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader className="pb-3 border-b border-border bg-muted/50/50 rounded-t-xl">
                <CardTitle className="text-base font-semibold leading-snug">
                  {index + 1}. {question.text}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 overflow-hidden">
                {renderQuestion(question)}
              </CardContent>
            </Card>
          ))}

          <div className="pt-4 space-y-3">
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={loading} className="px-8">
                {loading
                  ? "Submitting..."
                  : study.rewardCredits > 0
                  ? `Submit Responses & Earn ${study.rewardCredits} TC`
                  : "Submit Health Responses"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Health Research Protocol &bull; Responses are submitted securely for academic & community health research.
            </p>
          </div>
        </form>
      )}

    </div>
  );
}
