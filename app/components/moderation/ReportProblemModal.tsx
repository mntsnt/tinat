"use client";

import React, { useState } from "react";
import { Flag, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "../ui/Button";

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyId?: string;
  resourceType: "STUDY" | "CHAT" | "RESPONSE";
  resourceId: string;
}

const REPORT_REASONS = [
  "Inappropriate or offensive content",
  "Misleading study description or deceptive terms",
  "Coercive or deceptive compensation claims (e.g. false cash promises)",
  "Privacy concern or sensitive data risk",
  "Technical bug preventing participation",
  "Other governance concern",
];

export function ReportProblemModal({
  isOpen,
  onClose,
  studyId,
  resourceType,
  resourceId,
}: ReportProblemModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!details.trim()) {
      return setError("Please provide a short explanation of the problem.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyId,
          resourceType,
          resourceId,
          reason,
          details: details.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit report.");
      } else {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setDetails("");
        }, 2000);
      }
    } catch {
      setError("Network error submitting report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Report a Problem</h3>
            <p className="text-xs text-muted-foreground">
              Submitted reports are investigated by Tinat moderators under strict SLAs.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-semibold text-foreground text-sm">Thank You for Your Report</h4>
            <p className="text-xs text-muted-foreground">
              Our moderation team will review this report within our 7-day governance SLA.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block font-semibold text-foreground">
                Primary Reason <span className="text-destructive">*</span>
              </label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-ring"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-foreground">
                Details & Description <span className="text-destructive">*</span>
              </label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what occurred, including any specific questions or misleading statements..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-primary text-primary-foreground text-xs gap-1.5"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
