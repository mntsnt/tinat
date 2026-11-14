"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import {
  Copy,
  ShieldCheck,
  Flag,
  PhoneCall,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { StudyConsentGate } from "./StudyConsentGate";
import { ReportProblemModal } from "../../../components/moderation/ReportProblemModal";
import { StudyBanner } from "../../../components/studies/StudyBanner";
import { BecomeCollectorButton } from "../../../components/studies/BecomeCollectorButton";
import { SupportedLocale, getMessage } from "@/lib/i18n";

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
  preferNotToAnswerEnabled?: boolean;
  isSkippable?: boolean;
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
  containsSensitiveTopics?: boolean;
  safetyProtocolText?: string | null;
  researcher: { id?: string; name: string };
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

  // Core state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [consented, setConsented] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Multilingual state
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const [translatedStudy, setTranslatedStudy] = useState<{
    title: string;
    description: string | null;
    safetyProtocolText: string | null;
  } | null>(null);
  const [questionTranslations, setQuestionTranslations] = useState<
    Record<string, { text: string; options?: any }>
  >({});
  const [loadingTranslation, setLoadingTranslation] = useState(false);

  // Low-bandwidth & offline state
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Initialize offline / draft / low-bandwidth settings
  useEffect(() => {
    // 1. Low bandwidth preference
    const savedLowBw = localStorage.getItem("tinat_low_bandwidth_enabled");
    if (savedLowBw === "true") {
      setLowBandwidth(true);
    }

    // 2. Draft restore
    const draftKey = `tinat_study_draft_${study.id}`;
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === "object") {
          setAnswers(parsed);
          setDraftRestored(true);
        }
      }
    } catch {
      // ignore JSON parse errors
    }

    // 3. Network status listeners
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [study.id]);

  // Auto-save draft on every answer change
  useEffect(() => {
    if (Object.keys(answers).length > 0 && !submitted) {
      const draftKey = `tinat_study_draft_${study.id}`;
      try {
        localStorage.setItem(draftKey, JSON.stringify(answers));
      } catch {
        // LocalStorage full or private browsing quota
      }
    }
  }, [answers, study.id, submitted]);

  // Load language translations when locale changes
  const handleLocaleChange = useCallback(
    async (newLocale: SupportedLocale) => {
      setLocale(newLocale);
      if (newLocale === "en") {
        setTranslatedStudy(null);
        setQuestionTranslations({});
        return;
      }

      setLoadingTranslation(true);
      try {
        const res = await fetch(`/api/studies/${study.id}/translations?lang=${newLocale}`);
        if (res.ok) {
          const data = await res.json();
          if (data.study) {
            setTranslatedStudy({
              title: data.study.title || study.title,
              description: data.study.description || study.description,
              safetyProtocolText: data.study.safetyProtocolText || study.safetyProtocolText,
            });
          }
          if (data.questions) {
            setQuestionTranslations(data.questions);
          }
        }
      } catch (err) {
        console.error("Failed to load translation:", err);
      } finally {
        setLoadingTranslation(false);
      }
    },
    [study]
  );

  function toggleLowBandwidth() {
    setLowBandwidth((prev) => {
      const nextVal = !prev;
      localStorage.setItem("tinat_low_bandwidth_enabled", String(nextVal));
      return nextVal;
    });
  }

  function handleCopyLink() {
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
        return {
          ...previous,
          [questionId]: { ...currentGrid, [rowValue]: currentRow.filter((v: string) => v !== optionValue) },
        };
      }
      return { ...previous, [questionId]: { ...currentGrid, [rowValue]: [...currentRow, optionValue] } };
    });
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/studies/${study.id}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: withdrawReason || "Participant voluntary withdrawal" }),
      });
      if (res.ok) {
        localStorage.removeItem(`tinat_study_draft_${study.id}`);
        router.push("/participant");
        router.refresh();
      }
    } catch {
      setError("Failed to withdraw from study. Please try again.");
    } finally {
      setWithdrawing(false);
      setShowWithdrawModal(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || submitted) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`/api/studies/${study.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, language: locale }),
      });

      const data = (await response.json()) as SubmitResponse;

      if (!response.ok) {
        setError(data.error || "Failed to submit your response.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setSubmitted(true);
      localStorage.removeItem(`tinat_study_draft_${study.id}`);

      if (study.rewardCredits > 0) {
        setSuccess(
          `Research completed successfully! You earned ${
            data.creditsEarned ?? study.rewardCredits
          } Tinat Credits.`
        );
      } else {
        setSuccess("Thank you! Your research response was recorded successfully.");
      }

      setTimeout(() => {
        router.push("/participant");
        router.refresh();
      }, 1800);
    } catch (caughtError) {
      console.error("Study submission error:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while submitting. Answers remain saved locally."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  // Active titles and descriptions (translated with fallback)
  const activeTitle = translatedStudy?.title || study.title;
  const activeDescription = translatedStudy?.description || study.description;
  const activeSafetyProtocol = translatedStudy?.safetyProtocolText || study.safetyProtocolText;
  const hasRequiredFileUpload = study.questions.some(
    (question) => question.required && question.type === "FILE_UPLOAD"
  );

  function renderQuestion(question: Question) {
    const value = answers[question.id];
    const trans = questionTranslations[question.id];
    const questionText = trans?.text || question.text;

    if (value === "__PREFER_NOT_TO_ANSWER__") {
      return (
        <div className="p-3 rounded-lg bg-muted/50 border border-muted text-xs text-muted-foreground flex items-center justify-between">
          <span>
            You selected: <strong className="text-foreground">Prefer not to answer</strong>.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => updateAnswer(question.id, undefined)}
            className="text-xs text-primary hover:underline h-7 min-h-[44px]"
            aria-label={`Clear prefer not to answer for question: ${questionText}`}
          >
            Clear & Answer
          </Button>
        </div>
      );
    }

    switch (question.type) {
      case "LONG_TEXT":
        return (
          <textarea
            aria-label={questionText}
            aria-required={question.required}
            className="flex w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
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
            aria-label={questionText}
            aria-required={question.required}
            value={typeof value === "string" || typeof value === "number" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={loading || submitted}
            className="min-h-[44px]"
          />
        );
      case "DATE":
        return (
          <Input
            type="date"
            aria-label={questionText}
            aria-required={question.required}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={loading || submitted}
            className="min-h-[44px]"
          />
        );
      case "TIME":
        return (
          <Input
            type="time"
            aria-label={questionText}
            aria-required={question.required}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={loading || submitted}
            className="min-h-[44px]"
          />
        );
      case "YES_NO":
        return (
          <div
            role="radiogroup"
            aria-label={questionText}
            className="space-y-2.5"
          >
            {["Yes", "No"].map((optionVal) => (
              <label
                key={optionVal}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer min-h-[44px] transition-colors ${
                  value === optionVal
                    ? "border-primary bg-primary/5 text-foreground font-medium"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={optionVal}
                  role="radio"
                  aria-checked={value === optionVal}
                  className="w-4 h-4 text-primary border-border focus-visible:ring-2 focus-visible:ring-primary"
                  checked={value === optionVal}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  disabled={loading || submitted}
                />
                <span className="text-sm">{optionVal}</span>
              </label>
            ))}
          </div>
        );
      case "SINGLE_CHOICE":
        return (
          <div
            role="radiogroup"
            aria-label={questionText}
            className="space-y-2.5"
          >
            {question.options.map((option) => {
              const optionLabel =
                trans?.options && typeof trans.options === "object" && trans.options[option.id]
                  ? trans.options[option.id]
                  : option.text;
              const isSelected = value === option.value;
              return (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer min-h-[44px] transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    role="radio"
                    aria-checked={isSelected}
                    className="w-4 h-4 text-primary border-border focus-visible:ring-2 focus-visible:ring-primary"
                    checked={isSelected}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    disabled={loading || submitted}
                  />
                  <span className="text-sm">{optionLabel}</span>
                </label>
              );
            })}
          </div>
        );
      case "MULTIPLE_CHOICE":
        return (
          <div
            role="group"
            aria-label={questionText}
            className="space-y-2.5"
          >
            {question.options.map((option) => {
              const selected = Array.isArray(value) ? value : [];
              const isChecked = selected.includes(option.value);
              const optionLabel =
                trans?.options && typeof trans.options === "object" && trans.options[option.id]
                  ? trans.options[option.id]
                  : option.text;
              return (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer min-h-[44px] transition-colors ${
                    isChecked
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    role="checkbox"
                    aria-checked={isChecked}
                    className="w-4 h-4 rounded text-primary border-border focus-visible:ring-2 focus-visible:ring-primary"
                    checked={isChecked}
                    onChange={() => handleMultipleChoice(question.id, option.value)}
                    disabled={loading || submitted}
                  />
                  <span className="text-sm">{optionLabel}</span>
                </label>
              );
            })}
          </div>
        );
      case "DROPDOWN":
        return (
          <select
            aria-label={questionText}
            aria-required={question.required}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={loading || submitted}
            className="min-h-[44px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select an option</option>
            {question.options.map((option) => {
              const optionLabel =
                trans?.options && typeof trans.options === "object" && trans.options[option.id]
                  ? trans.options[option.id]
                  : option.text;
              return (
                <option key={option.id} value={option.value}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        );
      case "MULTIPLE_CHOICE_GRID":
        return (
          <div className="space-y-4">
            {question.rows.map((row) => {
              const grid = value && typeof value === "object" ? value : {};
              return (
                <fieldset key={row.id} className="space-y-2 rounded-lg border border-border p-3">
                  <legend className="px-1 text-sm font-semibold text-foreground">{row.text}</legend>
                  {question.options.map((option) => {
                    const optionLabel =
                      trans?.options && typeof trans.options === "object" && trans.options[option.id]
                        ? trans.options[option.id]
                        : option.text;
                    return (
                      <label key={option.id} className="flex min-h-[44px] items-center gap-3 rounded-md px-2 text-sm hover:bg-muted/40">
                        <input
                          type="radio"
                          name={`${question.id}-${row.id}`}
                          checked={grid[row.value] === option.value}
                          onChange={() =>
                            handleGridMultipleChoice(question.id, row.value, option.value)
                          }
                          disabled={loading || submitted}
                          className="h-4 w-4 text-primary"
                        />
                        <span>{optionLabel}</span>
                      </label>
                    );
                  })}
                </fieldset>
              );
            })}
          </div>
        );
      case "CHECKBOX_GRID":
        return (
          <div className="space-y-4">
            {question.rows.map((row) => {
              const grid = value && typeof value === "object" ? value : {};
              const selected: string[] = Array.isArray(grid[row.value]) ? grid[row.value] : [];
              return (
                <fieldset key={row.id} className="space-y-2 rounded-lg border border-border p-3">
                  <legend className="px-1 text-sm font-semibold text-foreground">{row.text}</legend>
                  {question.options.map((option) => {
                    const optionLabel =
                      trans?.options && typeof trans.options === "object" && trans.options[option.id]
                        ? trans.options[option.id]
                        : option.text;
                    return (
                      <label key={option.id} className="flex min-h-[44px] items-center gap-3 rounded-md px-2 text-sm hover:bg-muted/40">
                        <input
                          type="checkbox"
                          checked={selected.includes(option.value)}
                          onChange={() =>
                            handleGridCheckbox(question.id, row.value, option.value)
                          }
                          disabled={loading || submitted}
                          className="h-4 w-4 rounded text-primary"
                        />
                        <span>{optionLabel}</span>
                      </label>
                    );
                  })}
                </fieldset>
              );
            })}
          </div>
        );
      case "LINEAR_SCALE":
      case "RATING_SCALE":
        const min = question.scaleMin ?? 1;
        const max = question.scaleMax ?? 5;
        const scaleValues: number[] = [];
        for (let i = min; i <= max; i++) scaleValues.push(i);

        return (
          <div className="space-y-3">
            <div
              role="radiogroup"
              aria-label={questionText}
              className="flex flex-wrap gap-2 pt-2"
            >
              {scaleValues.map((num) => (
                <button
                  type="button"
                  key={num}
                  role="radio"
                  aria-checked={Number(value) === num}
                  aria-label={`Rating ${num}`}
                  onClick={() => updateAnswer(question.id, num)}
                  disabled={loading || submitted}
                  className={`min-h-[44px] min-w-[44px] rounded-lg border text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                    Number(value) === num
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border hover:bg-muted text-foreground"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            {(question.scaleMinLabel || question.scaleMaxLabel) && (
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>{question.scaleMinLabel}</span>
                <span>{question.scaleMaxLabel}</span>
              </div>
            )}
          </div>
        );
      case "FILE_UPLOAD":
        return (
          <div
            role="status"
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"
          >
            Secure file upload is not available for study responses yet. Contact the researcher before continuing.
          </div>
        );
      default:
        return (
          <Input
            type="text"
            aria-label={questionText}
            aria-required={question.required}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            disabled={loading || submitted}
            className="min-h-[44px]"
          />
        );
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Accessibility live region */}
      <div className="sr-only" aria-live="polite">
        {success || error}
      </div>



      {/* Offline Status Alert */}
      {isOffline && (
        <div className="p-3.5 mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-semibold block">Connection Lost &bull; Local Storage Active</span>
            <span>
              Your responses are saved locally on your device. You can keep answering and submit once
              reconnected.
            </span>
          </div>
        </div>
      )}

      {hasRequiredFileUpload && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200"
        >
          This study includes a required file-upload question, but secure file upload is not available yet. Contact the researcher before starting so your response is not blocked.
        </div>
      )}

      {/* Draft Restored Notice */}
      {draftRestored && !submitted && (
        <div className="p-3 mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Resumed your previously saved draft responses on this device.</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDraftRestored(false)}
            className="text-[11px] h-6 text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* CONSENT GATE */}
      {!consented && (
        <StudyConsentGate
          studyId={study.id}
          containsSensitiveTopics={study.containsSensitiveTopics}
          safetyProtocolText={study.safetyProtocolText}
          onConsentComplete={() => setConsented(true)}
        />
      )}

      {consented && (
        <>
          {/* STUDY HEADER BANNER (Hidden or simplified in Low-Bandwidth Mode) */}
          {!lowBandwidth && study.bannerTheme ? (
            <div className="mb-6">
              <div className="relative mb-6 rounded-2xl overflow-hidden border border-border">
                <StudyBanner theme={study.bannerTheme} className="h-28 sm:h-36 w-full" />
                <div className="p-4 sm:p-5 bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    {study.category && <Badge variant="secondary">{study.category}</Badge>}
                    <Badge variant="outline">
                      {study.rewardCredits > 0 ? `${study.rewardCredits} TC Reward` : "Academic Study"}
                    </Badge>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{activeTitle}</h1>
                  {activeDescription && (
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {activeDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 mb-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-1">
                {study.category && <Badge variant="secondary">{study.category}</Badge>}
                <Badge variant="outline">
                  {study.rewardCredits > 0 ? `${study.rewardCredits} TC Reward` : "Academic Study"}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-foreground">{activeTitle}</h1>
              {activeDescription && (
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {activeDescription}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
            <div className="text-xs text-muted-foreground">
              Conducted by{" "}
              {study.researcher.id ? (
                <Link
                  href={`/profile/${study.researcher.id}`}
                  title={`View ${study.researcher.name}'s profile`}
                  className="font-semibold text-foreground hover:text-emerald-600 hover:underline transition-colors"
                >
                  {study.researcher.name}
                </Link>
              ) : (
                <strong className="text-foreground">{study.researcher.name}</strong>
              )}
            </div>

            <div className="flex items-center gap-2">
              <BecomeCollectorButton
                studyId={study.id}
                studyTitle={study.title}
                researcherName={study.researcher.name}
                category={study.category || undefined}
                className="text-xs h-8 gap-1.5 min-h-[36px]"
              />

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-md hover:bg-muted text-xs h-8 text-muted-foreground hover:text-foreground min-h-[36px]"
                onClick={handleCopyLink}
                aria-label="Share study link"
              >
                {copied ? (
                  <>
                    <span className="text-emerald-600 font-medium">Link Copied!</span>
                    <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Share Study Link</span>
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportModal(true)}
                className="gap-1 rounded-md text-xs h-8 text-muted-foreground hover:text-destructive min-h-[36px]"
                aria-label="Report problem or ethical concern"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report</span>
              </Button>
            </div>
          </div>

          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 mb-6 dark:bg-emerald-950/20 dark:border-emerald-800">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Submission Successful
              </h3>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{success}</p>
              <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-500">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6 dark:bg-red-950/20 dark:border-red-800">
              <p className="text-xs font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Sensitive Topics & Distress Support Notice */}
          {study.containsSensitiveTopics && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 mb-6 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <PhoneCall className="w-4 h-4 text-amber-600" />
                <span>Participant Distress & Support Helpline Notice</span>
              </div>
              <p>
                {activeSafetyProtocol ||
                  "If questions cause discomfort, you can skip questions or withdraw anytime."}
              </p>
              <div className="font-medium text-amber-800 dark:text-amber-300">
                Emergency Hotlines: <strong>952</strong> / <strong>6055</strong> (National Mental Health Support)
              </div>
            </div>
          )}

          {!submitted && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {study.questions.map((question, index) => {
                const trans = questionTranslations[question.id];
                const displayQuestionText = trans?.text || question.text;

                return (
                  <Card key={question.id}>
                    <CardHeader className="pb-3 border-b border-border bg-muted/40 rounded-t-xl flex flex-row items-center justify-between gap-4">
                      <CardTitle className="text-sm sm:text-base font-semibold leading-snug">
                        {index + 1}. {displayQuestionText}
                        {question.required && (
                          <span className="text-red-500 ml-1" aria-label="Required question">
                            *
                          </span>
                        )}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateAnswer(question.id, "__PREFER_NOT_TO_ANSWER__")}
                        className="text-xs text-muted-foreground hover:text-foreground shrink-0 min-h-[36px]"
                        aria-label={`Prefer not to answer question ${index + 1}`}
                      >
                        Prefer not to answer
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4 overflow-hidden">
                      {renderQuestion(question)}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Confidentiality & Coded Linkage Notice */}
              <div className="p-4 rounded-xl bg-card border border-border text-xs leading-relaxed space-y-1.5 text-muted-foreground">
                <div className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Confidential & Coded Linkage (Not Anonymous)
                </div>
                <p>
                  Your answers are{" "}
                  <strong>confidential and coded (pseudonymized)</strong>, not anonymous. When you
                  submit, your responses are associated with an unguessable Respondent Code separated
                  from your personal profile. Researchers receive only your de-identified research
                  data and never see your direct personal details.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading || hasRequiredFileUpload}
                    className="px-8 min-h-[48px] text-sm font-semibold"
                  >
                    {loading
                      ? "Submitting..."
                      : study.rewardCredits > 0
                      ? `Submit Responses & Earn ${study.rewardCredits} TC`
                      : "Submit Responses"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Tinat Research Protocol &bull; Responses are submitted securely for academic &
                  community research.
                </p>
              </div>
            </form>
          )}

          {/* Report Problem Modal */}
          {showReportModal && (
            <ReportProblemModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              studyId={study.id}
              resourceType="STUDY"
              resourceId={study.id}
            />
          )}
        </>
      )}
    </div>
  );
}
