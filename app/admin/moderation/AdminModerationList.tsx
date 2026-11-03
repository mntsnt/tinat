"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface Report {
  id: string;
  reporterId?: string | null;
  reporter?: { name: string; email: string } | null;
  studyId?: string | null;
  study?: { id: string; title: string; status: string } | null;
  resourceType: string;
  resourceId: string;
  reason: string;
  details: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
  resolutionNotes?: string | null;
  deadline: string | Date;
  createdAt: string | Date;
}

export function AdminModerationList({ initialReports }: { initialReports: Report[] }) {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [takeDownStudy, setTakeDownStudy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAction = async (status: "RESOLVED" | "DISMISSED" | "INVESTIGATING") => {
    if (!activeReportId) return;
    setError("");

    if (["RESOLVED", "DISMISSED"].includes(status) && !resolutionNotes.trim()) {
      return setError("Resolution notes explaining the outcome are mandatory.");
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/moderation/${activeReportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resolutionNotes: resolutionNotes.trim(),
          actionTaken: takeDownStudy ? "TAKEDOWN_STUDY" : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update report.");
      } else {
        setActiveReportId(null);
        setResolutionNotes("");
        setTakeDownStudy(false);
        router.refresh();
      }
    } catch {
      setError("Network error updating report.");
    } finally {
      setSubmitting(false);
    }
  };

  const now = new Date();

  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <div className="p-8 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
          No moderation reports currently recorded.
        </div>
      ) : (
        reports.map((report) => {
          const deadlineDate = new Date(report.deadline);
          const isOverdue =
            (report.status === "OPEN" || report.status === "INVESTIGATING") &&
            deadlineDate < now;

          const isActionOpen = activeReportId === report.id;

          return (
            <div
              key={report.id}
              className={`rounded-2xl border p-5 transition-all space-y-4 ${
                isOverdue
                  ? "border-destructive/40 bg-destructive/5"
                  : report.status === "RESOLVED"
                  ? "border-border bg-card/60 opacity-80"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      report.status === "OPEN"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : report.status === "INVESTIGATING"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : report.status === "RESOLVED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {report.status}
                  </span>

                  <span className="text-xs font-medium text-muted-foreground">
                    Type: <strong className="text-foreground">{report.resourceType}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Clock className={`w-3.5 h-3.5 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`} />
                  <span className={isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}>
                    SLA Deadline: {deadlineDate.toLocaleDateString()}
                    {isOverdue && " (OVERDUE)"}
                  </span>
                </div>
              </div>

              {/* Details & Target */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2 space-y-2">
                  <div>
                    <span className="font-semibold text-foreground block text-sm">
                      {report.reason}
                    </span>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                      {report.details}
                    </p>
                  </div>

                  {report.resolutionNotes && (
                    <div className="p-3 rounded-lg border border-border bg-muted/30 text-xs">
                      <strong className="text-foreground block mb-0.5">Resolution Notes:</strong>
                      <p className="text-muted-foreground">{report.resolutionNotes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/20 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Reporter:</span>
                    <span className="font-medium text-foreground">
                      {report.reporter?.name || "Unauthenticated Reporter"}
                    </span>
                    {report.reporter?.email && (
                      <span className="block text-muted-foreground text-xs">{report.reporter.email}</span>
                    )}
                  </div>

                  {report.study && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground block">Reported Study:</span>
                      <Link
                        href={`/admin/studies/${report.study.id}`}
                        className="font-medium text-primary hover:underline flex items-center gap-1 mt-0.5"
                      >
                        {report.study.title} <ExternalLink className="w-3 h-3" />
                      </Link>
                      <span className="text-muted-foreground block text-xs">
                        Study Status: {report.study.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Trigger */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Submitted: {new Date(report.createdAt).toLocaleString()}
                </span>

                {report.status !== "RESOLVED" && report.status !== "DISMISSED" && (
                  <Button
                    size="sm"
                    variant={isActionOpen ? "secondary" : "outline"}
                    onClick={() => {
                      setActiveReportId(isActionOpen ? null : report.id);
                      setError("");
                    }}
                    className="text-xs"
                  >
                    {isActionOpen ? "Close Review Panel" : "Review & Take Action"}
                  </Button>
                )}
              </div>

              {/* Action Sub-Panel */}
              {isActionOpen && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 mt-3">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Moderation Triage & Decision
                  </h4>

                  {error && (
                    <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <textarea
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                    rows={2}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter formal administrative resolution notes (required)..."
                  />

                  {report.studyId && (
                    <label className="flex items-center gap-2 text-xs cursor-pointer text-destructive">
                      <input
                        type="checkbox"
                        checked={takeDownStudy}
                        onChange={(e) => setTakeDownStudy(e.target.checked)}
                        className="rounded border-destructive text-destructive"
                      />
                      <span className="font-semibold">Take Down Study (Auto-pause study immediately)</span>
                    </label>
                  )}

                  <div className="flex flex-wrap items-center gap-2 justify-end pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction("INVESTIGATING")}
                      disabled={submitting}
                      className="text-xs"
                    >
                      Mark In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction("DISMISSED")}
                      disabled={submitting}
                      className="text-xs text-muted-foreground"
                    >
                      Dismiss Report
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAction("RESOLVED")}
                      disabled={submitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Resolve & Document
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
