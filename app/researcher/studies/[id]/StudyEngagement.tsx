"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Heart, MessageCircle, Send } from "lucide-react";

type StudyEngagementProps = {
  studyId: string;
  initialLikeCount: number;
  initialCommentCount: number;
  initiallyLiked: boolean;
};

export function StudyEngagement({
  studyId,
  initialLikeCount,
  initialCommentCount,
  initiallyLiked,
}: StudyEngagementProps) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initiallyLiked);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [comment, setComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [error, setError] = useState("");

  async function toggleLike() {
    if (isLiking) return;
    setIsLiking(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/studies/${studyId}/like`, { method: "POST" });
      const data = (await response.json()) as { liked?: boolean; error?: string };
      if (!response.ok || typeof data.liked !== "boolean") {
        throw new Error(data.error || "Could not update your reaction.");
      }
      setLiked(data.liked);
      setLikeCount((current) => Math.max(0, current + (data.liked ? 1 : -1)));
    } catch (likeError) {
      setError(likeError instanceof Error ? likeError.message : "Could not update your reaction.");
    } finally {
      setIsLiking(false);
    }
  }

  async function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = comment.trim();
    if (!text || isCommenting) return;
    setIsCommenting(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/studies/${studyId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not post your comment.");
      setComment("");
      setCommentCount((current) => current + 1);
      router.refresh();
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : "Could not post your comment.");
    } finally {
      setIsCommenting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5" aria-label="Study discussion and reactions">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void toggleLike()}
          disabled={isLiking}
          aria-pressed={liked}
          className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
            liked
              ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {likeCount} {likeCount === 1 ? "reaction" : "reactions"}
        </button>
        <Link
          href={`/researcher/studies/${studyId}?view=discussion#study-discussion`}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </Link>
      </div>

      <form onSubmit={addComment} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="study-quick-comment" className="sr-only">Add a study comment</label>
        <textarea
          id="study-quick-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Add a comment or reply to participant feedback..."
          className="min-h-10 min-w-0 flex-1 resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        />
        <button
          type="submit"
          disabled={!comment.trim() || isCommenting}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-end rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:self-stretch"
        >
          <Send className="h-4 w-4" />
          {isCommenting ? "Posting..." : "Comment"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </section>
  );
}
