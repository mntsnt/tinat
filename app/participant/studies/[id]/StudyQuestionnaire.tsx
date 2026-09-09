"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Heart, MessageSquare, Copy, Send } from "lucide-react";

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
  user: { name: string; avatarUrl: string | null };
};

type Study = {
  id: string;
  title: string;
  description: string | null;
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

export default function StudyQuestionnaire({ study, currentUserId }: { study: Study; currentUserId: string }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [hasLiked, setHasLiked] = useState(study.likes.some(l => l.userId === currentUserId));
  const [likeCount, setLikeCount] = useState(study.likes.length);
  const [comments, setComments] = useState<StudyComment[]>(study.comments || []);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleToggleLike() {
    setHasLiked(!hasLiked);
    setLikeCount(hasLiked ? likeCount - 1 : likeCount + 1);
    try {
      await fetch(`/api/auth/studies/${study.id}/like`, { method: "POST" });
    } catch (err) {
      // Revert if error
      setHasLiked(hasLiked);
      setLikeCount(likeCount);
    }
  }

  async function handlePostComment() {
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const res = await fetch(`/api/auth/studies/${study.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments([data.comment, ...comments]);
        setNewComment("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommenting(false);
    }
  }

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
      setSuccess(`Research completed successfully! You earned ${data.creditsEarned ?? study.rewardCredits} Tinat Credits.`);

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
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{study.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">By {study.researcher.name}</Badge>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-success-foreground">
              Reward: {study.rewardCredits} TC
            </Badge>
          </div>
        </div>
        {study.description && (
          <p className="mt-6 text-muted-foreground bg-muted/50 p-4 rounded-lg border border-border leading-relaxed whitespace-pre-wrap">
            {study.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 pt-4 border-t border-border text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`gap-2 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 ${hasLiked ? 'text-red-500' : ''}`}
            onClick={handleToggleLike}
          >
            <Heart className={`w-[18px] h-[18px] ${hasLiked ? 'fill-current text-red-500' : ''}`} />
            <span className="text-sm font-medium">{likeCount > 0 ? likeCount : 'Like'}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50" 
            onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <MessageSquare className="w-[18px] h-[18px]" />
            <span className="text-sm font-medium">{comments.length > 0 ? comments.length : 'Comment'}</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 rounded-full hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 ml-auto" 
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <span className="text-success text-xs font-medium mr-1">Copied!</span>
                <Copy className="w-[18px] h-[18px] text-success" />
              </>
            ) : (
              <>
                <Copy className="w-[18px] h-[18px]" />
                <span className="text-sm font-medium hidden sm:inline-block">Copy Link</span>
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

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Submitting..." : `Submit Responses & Earn ${study.rewardCredits} TC`}
            </Button>
          </div>
        </form>
      )}

      {/* Comments Section */}
      <div id="comments-section" className="mt-12 pt-8 border-t border-border">
        <h3 className="text-xl font-bold mb-6">Discussion</h3>
        
        <div className="flex gap-3 mb-8">
          <Input 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or ask the researcher..."
            className="flex-1 bg-card"
            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
          />
          <Button onClick={handlePostComment} disabled={!newComment.trim() || commenting} className="gap-2">
            <Send className="w-4 h-4" />
            Post
          </Button>
        </div>

        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">No comments yet. Be the first to start the discussion!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  {comment.user.avatarUrl ? (
                    <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="font-semibold text-primary">{comment.user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 bg-card rounded-2xl rounded-tl-none p-4 border border-border shadow-sm">
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <span className="font-semibold text-sm">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
