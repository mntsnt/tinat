"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  X,
  Send,
  Loader2,
  Sparkles,
  MapPin,
  Check,
} from "lucide-react";
import { Button, ButtonLink } from "../ui/Button";

interface BecomeCollectorButtonProps {
  studyId: string;
  studyTitle: string;
  researcherName?: string;
  category?: string;
  initialStatus?: "PENDING" | "APPROVED" | "DECLINED" | null;
  isAssigned?: boolean;
  className?: string;
}

export function BecomeCollectorButton({
  studyId,
  studyTitle,
  researcherName,
  category,
  initialStatus = null,
  isAssigned = false,
  className,
}: BecomeCollectorButtonProps) {
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "DECLINED" | null>(initialStatus);
  const [assigned, setAssigned] = useState(isAssigned);
  const [modalOpen, setModalOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialStatus !== null || isAssigned) return;
    let active = true;
    fetch(`/api/studies/${studyId}/applications`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (data.isAssigned) setAssigned(true);
        if (data.application) setStatus(data.application.status);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [studyId, initialStatus, isAssigned]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);

      const res = await fetch(`/api/studies/${studyId}/apply-collector`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setStatus("PENDING");
      setSuccessMessage("Application submitted! The researcher has been notified.");
      setTimeout(() => {
        setModalOpen(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  };

  if (assigned) {
    return (
      <ButtonLink
        href="/collector/dashboard"
        variant="outline"
        size="sm"
        className={
          className ||
          "w-full text-xs border-emerald-600/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 gap-1.5 h-8"
        }
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Active Collector
      </ButtonLink>
    );
  }

  if (status === "PENDING") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={
          className ||
          "w-full text-xs border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 gap-1.5 h-8 opacity-90 cursor-default"
        }
      >
        <Clock className="w-3.5 h-3.5" />
        Applied (Pending)
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setModalOpen(true)}
        className={
          className ||
          "w-full text-xs gap-1.5 h-8 border-border hover:border-emerald-500/50 hover:bg-emerald-50/50 hover:text-emerald-700 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-300 transition-colors"
        }
      >
        <ClipboardList className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        Become a Collector
      </Button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Apply as Data Collector
                </h3>
                <p className="text-xs text-muted-foreground">
                  Collect field data for {researcherName ? `Dr. ${researcherName}` : "this study"}
                </p>
              </div>
            </div>

            <div className="my-4 rounded-xl border border-border bg-muted/30 p-3.5 text-xs space-y-1.5">
              <div className="font-semibold text-foreground line-clamp-1">{studyTitle}</div>
              {category && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {category}
                </div>
              )}
              <p className="text-muted-foreground leading-relaxed pt-1">
                Field collectors administer this study&apos;s questionnaire to respondents in clinical, school, or community settings. Once approved by the researcher, you can collect and submit verified responses.
              </p>
            </div>

            {successMessage ? (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center space-y-1.5">
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {successMessage}
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Experience / Notes for Researcher (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Fourth-year medical student in Addis Ababa, fluent in Amharic & Afaan Oromoo, clinical rotation experience..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{errorMessage}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
