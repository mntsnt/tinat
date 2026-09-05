"use client";

import { useState } from "react";
import { Button } from "../../components/ui/Button";

export function RatingForm({ studyId, initialRating, initialFeedback }: { studyId: string, initialRating?: number, initialFeedback?: string }) {
  const [rating, setRating] = useState(initialRating || 0);
  const [feedback, setFeedback] = useState(initialFeedback || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(!!initialRating);

  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/studies/" + studyId + "/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback }),
      });
      if (res.ok) setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-success/10 p-3 text-sm text-success font-medium border border-success/20">
        You rated this study {rating}/5 stars.
      </div>
    );
  }

  return (
    <form onSubmit={submitRating} className="space-y-3 mt-4 border-t border-border pt-4">
      <p className="text-sm font-medium text-foreground">Rate your experience</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`h-8 w-8 rounded-full ${rating >= star ? 'bg-amber-400 text-foreground' : 'bg-muted text-muted-foreground'} transition-colors hover:scale-105`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        placeholder="Optional feedback..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full text-sm p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        rows={2}
      />
      <Button type="submit" disabled={rating === 0 || loading} isLoading={loading} size="sm">
        Submit Rating
      </Button>
    </form>
  );
}
