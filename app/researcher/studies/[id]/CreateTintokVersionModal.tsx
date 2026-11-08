"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  ExternalLink,
  Coins,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface QuestionItem {
  questionId: string;
  order: number;
  text: string;
  type: string;
  eligible: boolean;
  reason?: string;
  optionCount?: number;
}

interface CreateTintokVersionModalProps {
  studyId: string;
  parentTitle: string;
  parentStatus: string;
  parentFormat: string;
  parentFundingType: string;
  parentRewardCredits: number;
  involvesMinors: boolean;
  containsSensitiveTopics: boolean;
  existingTintokVersion?: {
    id: string;
    title: string;
    status: string;
    responsesCount: number;
  } | null;
}

export function CreateTintokVersionModal({
  studyId,
  parentTitle,
  parentStatus,
  parentFormat,
  parentFundingType,
  parentRewardCredits,
  involvesMinors,
  containsSensitiveTopics,
  existingTintokVersion,
}: CreateTintokVersionModalProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data from preview API
  const [canCreate, setCanCreate] = useState(true);
  const [blockingReason, setBlockingReason] = useState<string | null>(null);
  const [eligibleQuestions, setEligibleQuestions] = useState<QuestionItem[]>([]);
  const [skippedQuestions, setSkippedQuestions] = useState<QuestionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [teaserEnabled, setTeaserEnabled] = useState(parentStatus === "ACTIVE");
  const [fundingChoice, setFundingChoice] = useState<"FREE" | "FUNDED">("FREE");
  const [rewardCredits, setRewardCredits] = useState(parentRewardCredits || 5);
  const [maxCards, setMaxCards] = useState(10);
  const [showSkipped, setShowSkipped] = useState(false);

  // Check static eligibility
  const isStaticIneligible =
    involvesMinors ||
    containsSensitiveTopics ||
    parentFormat !== "STANDARD" ||
    Boolean(existingTintokVersion);

  const staticReason = involvesMinors
    ? "Studies involving minors cannot be converted to card format. Tintok is strictly adult-only (18+)."
    : containsSensitiveTopics
    ? "Studies containing sensitive topics cannot be converted to Tintok card format."
    : parentFormat !== "STANDARD"
    ? "Only standard studies can generate a Tintok version."
    : existingTintokVersion
    ? `This study already has an active Tintok version: "${existingTintokVersion.title}".`
    : null;

  async function loadPreview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/studies/${studyId}/tintok-version`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load Tintok preview");
      }
      setCanCreate(data.canCreate);
      setBlockingReason(data.blockingReason);
      setEligibleQuestions(data.eligibleQuestions || []);
      setSkippedQuestions(data.skippedQuestions || []);
      setSelectedIds(data.proposedQuestionIds || []);
      setMaxCards(data.maxCards || 10);
      setTeaserEnabled(Boolean(data.defaultTeaserLink));
    } catch (err: any) {
      setError(err.message || "Failed to fetch study details");
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    if (isStaticIneligible) return;
    setIsOpen(true);
    loadPreview();
  }

  function toggleQuestion(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= maxCards) return prev; // Limit max cards
        return [...prev, id];
      }
    });
  }

  async function handleCreate() {
    if (selectedIds.length === 0) {
      setError("Please select at least 1 question for the Tintok version.");
      return;
    }
    if (selectedIds.length > maxCards) {
      setError(`You can select at most ${maxCards} questions.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/studies/${studyId}/tintok-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedQuestionIds: selectedIds,
          teaserLinkEnabled: teaserEnabled,
          fundingType: fundingChoice,
          rewardCredits: fundingChoice === "FUNDED" ? Number(rewardCredits) : 0,
          creditBudget: fundingChoice === "FUNDED" ? Number(rewardCredits) * 50 : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Tintok version");
      }

      setIsOpen(false);
      // Redirect to the newly created study
      router.push(`/researcher/studies/${data.studyId}`);
    } catch (err: any) {
      setError(err.message || "Creation failed");
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Trigger Button ── */}
      <div className="flex flex-col items-start gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpen}
          disabled={isStaticIneligible}
          className="gap-2 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium transition-colors"
          title={staticReason || "Create a quick card-style version for phones and computers"}
          data-testid="create-tintok-version-btn"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Create a Tintok version</span>
        </Button>
        <span className="text-[11px] text-muted-foreground leading-tight max-w-xs">
          {staticReason ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">{staticReason}</span>
          ) : (
            "A quick card-style version for phones and computers, with its own approval and data."
          )}
        </span>
      </div>

      {/* ── Review Dialog / Modal ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tintok-modal-title"
          data-testid="tintok-review-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-background/80 backdrop-blur-sm overflow-hidden"
        >
          {/* Backdrop click */}
          <div className="fixed inset-0" onClick={() => !submitting && setIsOpen(false)} />

          {/* Modal Container: Fullscreen on mobile, modal on desktop */}
          <div className="relative z-10 flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl bg-card border border-border md:rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="tintok-modal-title" className="text-base font-bold text-foreground truncate">
                    Create a Tintok Version
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    Parent: <span className="font-semibold text-foreground">{parentTitle}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={submitting}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">Analyzing parent study questions for card format...</span>
                </div>
              ) : (
                <>
                  {/* Informational Guidance Notice */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-muted-foreground space-y-1.5">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Info className="w-4 h-4 shrink-0" />
                      Independent Micro-Study Notice
                    </p>
                    <p className="leading-relaxed">
                      The Tintok version is a completely separate study with its own independent consent, separate ethics approval, and distinct dataset. Responses are never merged or cross-linked automatically.
                    </p>
                  </div>

                  {/* Blocking reason banner if API detected issue */}
                  {!canCreate && blockingReason && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Cannot Create Tintok Version
                      </p>
                      <p>{blockingReason}</p>
                    </div>
                  )}

                  {/* Section 1: Questions Checklist */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Select Cards ({selectedIds.length} of max {maxCards})
                      </label>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {selectedIds.length}/{maxCards} Selected
                      </span>
                    </div>

                    {eligibleQuestions.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No eligible questions found. Questions must be single-select, multi-select, rating, number, or short text.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {eligibleQuestions.map((q) => {
                          const isChecked = selectedIds.includes(q.questionId);
                          return (
                            <label
                              key={q.questionId}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? "border-primary bg-primary/5 text-foreground"
                                  : "border-border hover:bg-muted/40 text-muted-foreground"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleQuestion(q.questionId)}
                                className="mt-0.5 rounded border-input text-primary focus:ring-primary"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-foreground">
                                    {q.type.replace(/_/g, " ")}
                                  </span>
                                  {q.optionCount !== undefined && q.optionCount > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {q.optionCount} options
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-foreground leading-snug break-words">
                                  {q.text}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Skipped Questions Accordion */}
                  {skippedQuestions.length > 0 && (
                    <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowSkipped((prev) => !prev)}
                        className="w-full flex items-center justify-between p-3 text-xs font-semibold text-muted-foreground hover:text-foreground text-left transition-colors"
                      >
                        <span>Skipped Questions ({skippedQuestions.length})</span>
                        <span>{showSkipped ? "▲ Hide" : "▼ Show reasons"}</span>
                      </button>

                      {showSkipped && (
                        <div className="p-3 pt-0 space-y-2 border-t border-border/60">
                          {skippedQuestions.map((sq) => (
                            <div key={sq.questionId} className="p-2.5 rounded-lg bg-background border border-border/80 text-xs">
                              <p className="font-medium text-foreground truncate">{sq.text}</p>
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {sq.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section 3: Funding Choice */}
                  <div className="space-y-2 rounded-xl border border-border p-3.5 bg-card">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Tintok Funding Model
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFundingChoice("FREE")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          fundingChoice === "FREE"
                            ? "border-primary bg-primary/10 text-foreground font-semibold"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <p className="text-xs font-bold">Voluntary (Free)</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">No credits awarded</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFundingChoice("FUNDED")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          fundingChoice === "FUNDED"
                            ? "border-primary bg-primary/10 text-foreground font-semibold"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <p className="text-xs font-bold">Funded Study</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Reward Tinat Credits</p>
                      </button>
                    </div>

                    {fundingChoice === "FUNDED" && (
                      <div className="pt-2 space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          Credits per Tintok completion:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={rewardCredits}
                            onChange={(e) => setRewardCredits(Number(e.target.value))}
                            className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                          />
                          <span className="text-xs text-muted-foreground">TC (Integer tokens)</span>
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground italic">
                      Tinat Credits have strictly no cash value and cannot be exchanged for money.
                    </p>
                  </div>

                  {/* Section 4: Final Teaser Card Switch */}
                  <div className="rounded-xl border border-border p-3.5 bg-card flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="teaser-toggle"
                      checked={teaserEnabled}
                      onChange={(e) => setTeaserEnabled(e.target.checked)}
                      className="mt-0.5 rounded border-input text-primary focus:ring-primary"
                    />
                    <label htmlFor="teaser-toggle" className="cursor-pointer">
                      <p className="text-xs font-semibold text-foreground">
                        Add a final card inviting participants to the full study
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        When enabled and the parent study is ACTIVE, participants who complete all Tintok cards are shown a calm invitation with estimated time and reward details to optionally take the comprehensive study.
                      </p>
                    </label>
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-3.5 border-t border-border bg-muted/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreate}
                disabled={submitting || !canCreate || selectedIds.length === 0}
                isLoading={submitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                data-testid="confirm-tintok-creation-btn"
              >
                <span>Create Tintok Study</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
