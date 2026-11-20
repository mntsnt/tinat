"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Check,
  Globe,
  Minus,
  Plus,
  SkipForward,
  CornerDownLeft,
  LoaderCircle,
  CheckCheck,
  ListOrdered,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import {
  formatCollectorAnswers,
  hasRequiredAnswer,
  hasAnswer,
} from "@/lib/collectorAnswers";
import { SUPPORTED_LOCALES, SupportedLocale } from "@/lib/i18n";

export default function FieldCollectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [study, setStudy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(-1); // -1 is consent, 0+ is question index, questions.length is review
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [language, setLanguage] = useState<SupportedLocale>("en");
  const [availableLanguages, setAvailableLanguages] = useState<SupportedLocale[]>(["en", "am", "om"]);
  const [questionTranslations, setQuestionTranslations] = useState<
    Record<string, { text: string; options?: Record<string, string> }>
  >({});
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [languageWarning, setLanguageWarning] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = {
    en: {
      consent: "Participant Informed Consent",
      agree: "Confirm Participant Consent",
      next: "Next",
      prev: "Back",
      submit: "Submit Field Response",
      submitting: "Submitting...",
      required: "Required",
      optional: "Optional",
      language: "Language",
      yes: "Yes",
      no: "No",
      skip: "Skip",
      review: "Review & Submit",
    },
    am: {
      consent: "የተሳታፊ ስምምነት",
      agree: "ተሳታፊው መስማማቱን አረጋግጣለሁ",
      next: "ቀጣይ",
      prev: "ተመለስ",
      submit: "ምላሹን አስገባ",
      submitting: "በማስገባት ላይ...",
      required: "ያስፈልጋል",
      optional: "አማራጭ",
      language: "ቋንቋ",
      yes: "አዎ",
      no: "አይ",
      skip: "ዝለል",
      review: "ከልስና አስገባ",
    },
    om: {
      consent: "Eeyyama Hirmaataa",
      agree: "Hirmaataan walii galuu isaa nan mirkaneessa",
      next: "Itti aanu",
      prev: "Duubatti",
      submit: "Deebii Galchi",
      submitting: "Galchaa jira...",
      required: "Dirqama",
      optional: "Filannoo",
      language: "Afaan",
      yes: "Eeyyee",
      no: "Lakki",
      skip: "Darbi",
      review: "Irra deebi'ii Galchi",
    },
    ti: {
      consent: "ስምምነት ተሳታፊ",
      agree: "እቲ ተሳታፊ ከምዝተሰማምዐ አረጋግፅ",
      next: "ቀፃሊ",
      prev: "ተመለስ",
      submit: "ምላሽ አእቱ",
      submitting: "እየተልእከ እዩ...",
      required: "የድሊ",
      optional: "ኣማራፂ",
      language: "ቋንቋ",
      yes: "እወ",
      no: "ኣይፋል",
      skip: "ሕለፍ",
      review: "ኣረጋጊፅካ ኣእቱ",
    },
    so: {
      consent: "Oggolaanshaha ka qaybgalaha",
      agree: "Waxaan xaqiijinayaa in ka qaybgaluhu oggolaaday",
      next: "Xiga",
      prev: "Dib u noqo",
      submit: "Gudbi jawaabta",
      submitting: "Waa la gudbinayaa...",
      required: "Waa khasab",
      optional: "Ikhtiyaari",
      language: "Luqadda",
      yes: "Haa",
      no: "Maya",
      skip: "Dhaaf",
      review: "Dib u eeg & Gudbi",
    },
  }[language];

  // Load study and local draft
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    async function loadStudy() {
      try {
        const response = await fetch(`/api/studies/${params.id}`);
        const data = await response.json();
        if (!response.ok || !data.study) {
          throw new Error(data.error || "Failed to load study details.");
        }
        if (cancelled) return;
        setStudy(data.study);

        // Restore draft answers from local storage if available
        try {
          const savedDraft = localStorage.getItem(`tinat_collector_draft_${params.id}`);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed && typeof parsed === "object") {
              setAnswers(parsed);
            }
          }
        } catch {
          // silent fallback
        }

        try {
          const languagesResponse = await fetch(
            `/api/studies/${params.id}/translations?lang=en`
          );
          if (languagesResponse.ok) {
            const languageData = await languagesResponse.json();
            const languages = SUPPORTED_LOCALES
              .map(({ code }) => code)
              .filter((code) =>
                Array.isArray(languageData.availableLanguages) &&
                languageData.availableLanguages.includes(code)
              );
            if (!cancelled && languages.length > 0) {
              setAvailableLanguages(languages);
            }
          }
        } catch {
          // keep default languages
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load study details."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadStudy();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // Persist answers draft locally
  useEffect(() => {
    if (study?.id && Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(`tinat_collector_draft_${study.id}`, JSON.stringify(answers));
      } catch {
        // silent fallback
      }
    }
  }, [answers, study?.id]);

  async function handleLanguageChange(nextLanguage: SupportedLocale) {
    setLanguage(nextLanguage);
    setLanguageWarning(null);
    if (nextLanguage === "en") {
      setQuestionTranslations({});
      return;
    }

    setLoadingTranslation(true);
    try {
      const response = await fetch(
        `/api/studies/${params.id}/translations?lang=${nextLanguage}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not load translated questions.");
      }
      setQuestionTranslations(data.questions || {});
      const translations = data.questions || {};
      const incompleteTranslations = (study?.questions || []).some((question: any) => {
        const translation = translations[question.id];
        return (
          !translation?.text ||
          question.rows?.length > 0 ||
          question.options?.some((option: any) => !translation?.options?.[option.id])
        );
      });
      if (incompleteTranslations || Object.keys(translations).length === 0) {
        setLanguageWarning(
          "Some questions have no verified translation and will appear in English."
        );
      }
    } catch (error) {
      setQuestionTranslations({});
      setLanguageWarning(
        error instanceof Error
          ? error.message
          : "Could not load translated questions; the original text is shown."
      );
    } finally {
      setLoadingTranslation(false);
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const formattedAnswers = formatCollectorAnswers(answers);

      const res = await fetch(`/api/studies/${params.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionMethod: "FIELD_COLLECTED",
          language,
          answers: formattedAnswers,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setAnswers({});
        try {
          localStorage.removeItem(`tinat_collector_draft_${params.id}`);
        } catch {
          // ignore
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || "Failed to submit field response. Please try again.");
      }
    } catch {
      setErrorMessage("Network error while submitting response. Ensure your internet connection is active.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartAnother = () => {
    setIsSuccess(false);
    setCurrentStep(0);
    setConsentGiven(true);
    setAnswers({});
    setErrorMessage(null);
    try {
      localStorage.removeItem(`tinat_collector_draft_${params.id}`);
    } catch {
      // ignore
    }
  };

  const questions = study?.questions || [];
  const q = questions[currentStep];

  const hasCurrentAnswer = useMemo(() => {
    if (!q) return false;
    return hasRequiredAnswer(
      answers[q.id],
      q.type === "MULTIPLE_CHOICE_GRID" || q.type === "CHECKBOX_GRID"
        ? q.rows?.map((row: any) => row.value) || []
        : undefined
    );
  }, [answers, q]);

  const canAdvance = useMemo(() => {
    if (!q) return true;
    if (!q.required) return true;
    return hasCurrentAnswer;
  }, [q, hasCurrentAnswer]);

  const handleNext = useCallback(() => {
    if (canAdvance) {
      setCurrentStep((c) => c + 1);
    }
  }, [canAdvance]);

  // Keyboard navigation shortcuts for Desktop (Enter to advance, numbers for single choice)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT");

      if (e.key === "Enter" && !isInput && currentStep >= 0 && currentStep < questions.length) {
        if (canAdvance) {
          e.preventDefault();
          handleNext();
        }
      }

      // 1-9 single choice quick selection
      if (!isInput && q?.type === "SINGLE_CHOICE" && Array.isArray(q.options)) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= q.options.length) {
          const opt = q.options[num - 1];
          if (opt) {
            setAnswers((prev) => ({ ...prev, [q.id]: opt.value }));
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canAdvance, currentStep, q, questions.length, handleNext]);

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-emerald-500/20 blur-lg animate-pulse" />
          <LoaderCircle className="relative h-10 w-10 animate-spin text-emerald-600" />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground">Loading Field Study Form...</p>
        <p className="text-xs text-muted-foreground mt-1">Preparing offline questionnaire cache</p>
      </div>
    );
  }

  // Error loading study
  if (!study) {
    return (
      <div className="fixed inset-0 h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="max-w-md w-full space-y-4 rounded-3xl border border-border bg-card p-8 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Study Unavailable</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {errorMessage || "Study details could not be loaded. Please ensure you are assigned to this study."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/collector/dashboard")}
            className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isDone = currentStep >= questions.length;
  const progress = Math.round(((currentStep + 1) / (questions.length + 1)) * 100);

  // Success Screen
  if (isSuccess) {
    return (
      <div className="fixed inset-0 h-[100dvh] w-full flex flex-col items-center justify-center bg-background p-4 sm:p-6">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute -inset-3 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Response Recorded!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Household interview data has been securely saved to the study database.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 text-xs text-foreground font-mono">
            <span>Study: {study.title}</span>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleStartAnother}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs sm:text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition shadow-md shadow-emerald-500/20 active:scale-[0.99]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Collect Next Household Interview</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/collector/dashboard")}
              className="w-full rounded-xl border border-border bg-background py-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Consent Screen (Step -1)
  if (currentStep === -1) {
    return (
      <div className="fixed inset-0 h-[100dvh] w-full flex flex-col overflow-hidden bg-background">
        <div className="mx-auto w-full max-w-2xl h-full flex flex-col bg-card border-x border-border/40 shadow-xl overflow-hidden relative">
          {/* Top Bar */}
          <div className="h-14 sm:h-16 shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
            <button
              type="button"
              onClick={() => router.push("/collector/dashboard")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Field Attachment
            </span>
          </div>

          {/* Scrollable Consent Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {t.consent}
              </h1>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                St. Paul’s Hospital Millennium Medical College (SPHMMC) &bull; Department of Public Health
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5 space-y-3 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              <p className="font-semibold text-foreground">
                Study: {study.title}
              </p>
              <p>
                {study.description ||
                  "As part of academic community diagnosis requirements, 4th-year Medical Students are conducting a comprehensive assessment of community health indicators in this woreda."}
              </p>
              <p className="text-xs text-muted-foreground">
                All obtained information is used strictly for scientific and intervention planning purposes. Participant confidentiality is guaranteed. Participation is completely voluntary.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <p className="leading-relaxed">
                Ensure verbal or written consent is explicitly granted by the household head or authorized representative before recording data.
              </p>
            </div>
          </div>

          {/* Fixed Bottom Action Bar */}
          <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-md p-4 sm:p-5 z-20">
            <button
              type="button"
              onClick={() => {
                setConsentGiven(true);
                setCurrentStep(0);
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs sm:text-sm font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition shadow-md shadow-emerald-500/20 active:scale-[0.99]"
            >
              <span>{t.agree}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review & Submit Screen (Step === questions.length)
  if (isDone) {
    const answeredCount = questions.filter((item: any) =>
      hasRequiredAnswer(
        answers[item.id],
        item.type === "MULTIPLE_CHOICE_GRID" || item.type === "CHECKBOX_GRID"
          ? item.rows?.map((row: any) => row.value) || []
          : undefined
      )
    ).length;

    return (
      <div className="fixed inset-0 h-[100dvh] w-full flex flex-col overflow-hidden bg-background">
        <div className="mx-auto w-full max-w-3xl xl:max-w-4xl h-full flex flex-col bg-card border-x border-border/40 shadow-xl overflow-hidden relative">
          {/* Top Bar */}
          <div className="h-14 sm:h-16 shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
            <button
              type="button"
              onClick={() => setCurrentStep(questions.length - 1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Edit Answers</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600">
                {answeredCount} / {questions.length} Answered
              </span>
            </div>
          </div>

          {/* Scrollable Summary List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="text-center space-y-1.5 pb-2">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Review Household Responses
              </h2>
              <p className="text-xs text-muted-foreground">
                Verify collected data before final submission. Tap any question to revise.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2.5">
              {questions.map((question: any, idx: number) => {
                const answer = answers[question.id];
                const isProvided = hasAnswer(answer);
                return (
                  <div
                    key={question.id}
                    onClick={() => setCurrentStep(idx)}
                    className="group cursor-pointer rounded-2xl border border-border/80 bg-background hover:border-emerald-500/50 p-3.5 transition flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Q{idx + 1}
                        </span>
                        {question.required && (
                          <span className="text-[9px] font-bold text-rose-500 uppercase">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-emerald-600 transition">
                        {questionTranslations[question.id]?.text || question.text}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        {isProvided
                          ? typeof answer === "object"
                            ? JSON.stringify(answer)
                            : String(answer)
                          : "Not answered"}
                      </p>
                    </div>

                    <div className="shrink-0 mt-1">
                      {isProvided ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted text-muted-foreground text-[10px]">
                          -
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fixed Bottom Submit Action Bar */}
          <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-md p-4 sm:p-5 flex items-center justify-between gap-3 z-20">
            <button
              type="button"
              onClick={() => setCurrentStep(questions.length - 1)}
              className="rounded-xl border border-border bg-background px-4 py-3 text-xs font-semibold text-foreground hover:bg-muted transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs sm:text-sm font-bold text-white transition shadow-md shadow-emerald-500/20 ${
                isSubmitting ? "opacity-50 cursor-wait" : "hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  <span>{t.submitting}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.submit}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Question Screen (0 <= currentStep < questions.length)
  return (
    <div className="fixed inset-0 h-[100dvh] w-full flex flex-col overflow-hidden bg-background">
      <div className="mx-auto w-full max-w-3xl xl:max-w-4xl h-full flex flex-col bg-card border-x border-border/40 shadow-xl overflow-hidden relative">
        {/* Fixed Top Header */}
        <header className="h-14 sm:h-16 shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-20">
          {/* Left: Back / Dashboard & Study Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setCurrentStep((c) => Math.max(-1, c - 1))}
              className="p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition shrink-0"
              aria-label="Previous question"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-foreground truncate">
                {study.title}
              </h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block truncate">
                {study.targetPopulation || "Rural Attachment Census"} &bull; Melka Nono
              </p>
            </div>
          </div>

          {/* Right: Step Counter & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20">
              <span>{currentStep + 1}</span>
              <span className="text-muted-foreground font-normal">/</span>
              <span className="text-muted-foreground font-normal">{questions.length}</span>
            </div>

            {/* Language Switcher Pills */}
            <div className="flex items-center p-0.5 rounded-xl border border-border bg-muted/40">
              {(["en", "am", "om"] as SupportedLocale[]).map((langCode) => (
                <button
                  key={langCode}
                  type="button"
                  onClick={() => handleLanguageChange(langCode)}
                  className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase transition ${
                    language === langCode
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {langCode === "en" ? "EN" : langCode === "am" ? "አማ" : "OR"}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-muted overflow-hidden shrink-0">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Workspace (Scrollable Middle Area) */}
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7 overscroll-contain space-y-5">
          {languageWarning && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Globe className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{languageWarning}</span>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Question Metadata Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                Question {currentStep + 1}
              </span>
              {q.required ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[10px] font-semibold">
                  * {t.required}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-lg bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-medium">
                  {t.optional}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-xl font-bold text-foreground leading-snug">
              {questionTranslations[q.id]?.text || q.text}
            </h2>
          </div>

          {/* Input Controls */}
          <div className="pt-2">
            {/* SINGLE_CHOICE */}
            {q.type === "SINGLE_CHOICE" && (
              <div
                className={`grid gap-2.5 ${
                  Array.isArray(q.options) && q.options.length > 5
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {q.options?.map((opt: any, optIndex: number) => {
                  const isSelected = answers[q.id] === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                      }
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-xs ring-1 ring-emerald-600"
                          : "border-border bg-card text-foreground hover:border-emerald-500/40 hover:bg-muted/30 active:scale-[0.99]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold truncate">
                          {questionTranslations[q.id]?.options?.[opt.id] || opt.text}
                        </span>
                      </div>
                      <span className="hidden sm:inline-block text-[10px] font-mono font-semibold text-muted-foreground/60 shrink-0">
                        [{optIndex + 1}]
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* YES_NO */}
            {q.type === "YES_NO" && (
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {[
                  { label: t.yes, value: "Yes" },
                  { label: t.no, value: "No" },
                ].map((option) => {
                  const isSelected = answers[q.id] === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: option.value }))
                      }
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all text-center flex flex-col items-center justify-center gap-2 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-600"
                          : "border-border bg-card text-foreground hover:border-emerald-500/40 active:scale-[0.98]"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </span>
                      <span className="text-sm sm:text-base font-bold">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* MULTIPLE_CHOICE */}
            {q.type === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground font-medium mb-1">
                  Select all options that apply:
                </p>
                <div
                  className={`grid gap-2.5 ${
                    Array.isArray(q.options) && q.options.length > 5
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {q.options?.map((opt: any) => {
                    const selected: string[] = Array.isArray(answers[q.id])
                      ? answers[q.id]
                      : [];
                    const checked = selected.includes(opt.value);
                    return (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 sm:p-4 font-semibold transition-all ${
                          checked
                            ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-600"
                            : "border-border bg-card text-foreground hover:border-emerald-500/40 hover:bg-muted/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.id]: checked
                                ? selected.filter((v) => v !== opt.value)
                                : [...selected, opt.value],
                            }))
                          }
                          className="h-4 w-4 rounded accent-emerald-600"
                        />
                        <span className="text-xs sm:text-sm">
                          {questionTranslations[q.id]?.options?.[opt.id] || opt.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NUMBER */}
            {q.type === "NUMBER" && (
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(answers[q.id]) || 0;
                      if (cur > 0) {
                        setAnswers((prev) => ({ ...prev, [q.id]: cur - 1 }));
                      }
                    }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground hover:bg-muted transition"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <input
                    type="number"
                    inputMode="numeric"
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className="flex-1 p-3.5 text-center text-xl sm:text-2xl font-mono font-bold rounded-2xl border-2 border-border focus:border-emerald-600 focus:outline-none bg-background text-foreground"
                    placeholder="0"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(answers[q.id]) || 0;
                      setAnswers((prev) => ({ ...prev, [q.id]: cur + 1 }));
                    }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground hover:bg-muted transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Number Presets */}
                <div className="flex items-center justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: preset }))}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                        answers[q.id] === preset
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* LINEAR_SCALE */}
            {q.type === "LINEAR_SCALE" && (
              <div className="space-y-4 max-w-lg mx-auto">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  {Array.from(
                    { length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 },
                    (_, index) => (q.scaleMin ?? 1) + index
                  ).map((value) => {
                    const isSelected = answers[q.id] === value;
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
                        className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border-2 font-bold text-sm sm:text-base transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                            : "border-border bg-card text-foreground hover:border-emerald-500/40 hover:bg-muted/40"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
                {(q.scaleMinLabel || q.scaleMaxLabel) && (
                  <div className="flex justify-between text-xs text-muted-foreground font-medium px-2">
                    <span>{q.scaleMinLabel || "Min"}</span>
                    <span>{q.scaleMaxLabel || "Max"}</span>
                  </div>
                )}
              </div>
            )}

            {/* SHORT_TEXT */}
            {q.type === "SHORT_TEXT" && (
              <div className="relative">
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  className="w-full p-4 text-xs sm:text-sm rounded-2xl border-2 border-border bg-background text-foreground focus:border-emerald-600 focus:outline-none transition pr-10"
                  placeholder="Enter response here..."
                />
                {answers[q.id] && (
                  <button
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: "" }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* LONG_TEXT */}
            {q.type === "LONG_TEXT" && (
              <div className="space-y-1">
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  rows={4}
                  className="w-full p-4 text-xs sm:text-sm rounded-2xl border-2 border-border focus:border-emerald-600 focus:outline-none bg-background text-foreground resize-none transition"
                  placeholder="Enter detailed field observations or notes..."
                />
              </div>
            )}

            {/* DROPDOWN */}
            {q.type === "DROPDOWN" && (
              <select
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                className="w-full p-4 text-xs sm:text-sm rounded-2xl border-2 border-border bg-background text-foreground focus:border-emerald-600 focus:outline-none"
              >
                <option value="">-- Select an option --</option>
                {q.options?.map((opt: any) => (
                  <option key={opt.id} value={opt.value}>
                    {questionTranslations[q.id]?.options?.[opt.id] || opt.text}
                  </option>
                ))}
              </select>
            )}

            {/* DATE & TIME */}
            {(q.type === "DATE" || q.type === "TIME") && (
              <input
                type={q.type.toLowerCase()}
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                className="w-full p-4 text-xs sm:text-sm rounded-2xl border-2 border-border bg-background text-foreground focus:border-emerald-600 focus:outline-none"
              />
            )}

            {/* GRIDS */}
            {(q.type === "MULTIPLE_CHOICE_GRID" || q.type === "CHECKBOX_GRID") && (
              <div className="space-y-4">
                {q.rows?.map((row: any) => {
                  const grid = answers[q.id] || {};
                  const rowAnswer = grid[row.value];
                  return (
                    <fieldset key={row.id} className="space-y-2 rounded-2xl border border-border p-4 bg-muted/20">
                      <legend className="px-2 text-xs sm:text-sm font-bold text-foreground">
                        {row.text}
                      </legend>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {q.options?.map((opt: any) => {
                          const checked =
                            q.type === "MULTIPLE_CHOICE_GRID"
                              ? rowAnswer === opt.value
                              : Array.isArray(rowAnswer) && rowAnswer.includes(opt.value);
                          return (
                            <label
                              key={opt.id}
                              className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition ${
                                checked
                                  ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                                  : "border-border bg-card text-foreground"
                              }`}
                            >
                              <input
                                type={q.type === "MULTIPLE_CHOICE_GRID" ? "radio" : "checkbox"}
                                name={`${q.id}-${row.id}`}
                                checked={checked}
                                onChange={() =>
                                  setAnswers((prev) => {
                                    const prevGrid = prev[q.id] || {};
                                    if (q.type === "MULTIPLE_CHOICE_GRID") {
                                      return { ...prev, [q.id]: { ...prevGrid, [row.value]: opt.value } };
                                    }
                                    const curRow: string[] = Array.isArray(prevGrid[row.value])
                                      ? prevGrid[row.value]
                                      : [];
                                    return {
                                      ...prev,
                                      [q.id]: {
                                        ...prevGrid,
                                        [row.value]: checked
                                          ? curRow.filter((v) => v !== opt.value)
                                          : [...curRow, opt.value],
                                      },
                                    };
                                  })
                                }
                                className="h-3.5 w-3.5 accent-emerald-600"
                              />
                              <span className="truncate">{opt.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Fixed Bottom Action Bar */}
        <footer className="shrink-0 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-3.5 z-20">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Previous Button */}
            <button
              type="button"
              onClick={() => setCurrentStep((c) => Math.max(-1, c - 1))}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-semibold bg-background text-foreground hover:bg-muted active:scale-[0.98] transition"
              aria-label="Previous question"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t.prev}</span>
            </button>

            {/* Center keyboard hint on desktop */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
              {canAdvance && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border text-[10px] font-mono">
                  <span>Press</span>
                  <CornerDownLeft className="w-3 h-3" />
                  <span>Enter</span>
                </span>
              )}
            </div>

            {/* Right: Skip & Next Button */}
            <div className="flex items-center gap-2">
              {!q.required && !hasCurrentAnswer && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((c) => c + 1)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <span>{t.skip}</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (canAdvance) {
                    setCurrentStep((c) => c + 1);
                  }
                }}
                disabled={!canAdvance}
                className={`inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
                  canAdvance
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-emerald-600/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed border border-border/50"
                }`}
              >
                <span>
                  {currentStep === questions.length - 1 ? t.review : t.next}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
