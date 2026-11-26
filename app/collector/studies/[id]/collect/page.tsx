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
  X,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ListOrdered,
  Sparkles,
  Edit3,
  Users,
} from "lucide-react";
import {
  formatCollectorAnswers,
  hasRequiredAnswer,
  hasAnswer,
} from "@/lib/collectorAnswers";
import {
  isQuestionSkipped,
  getNextActiveStep,
  getPreviousActiveStep,
  DEFAULT_STUDY_SKIP_RULES,
  HouseholdRosterData,
} from "@/lib/studyLogic";
import { HouseholdRosterComponent } from "@/app/collector/components/HouseholdRosterComponent";
import { SUPPORTED_LOCALES, SupportedLocale } from "@/lib/i18n";
import {
  cacheOfflineForm,
  deleteOfflineSubmission,
  getCachedOfflineForm,
  getOfflineSubmissions,
  queueOfflineSubmission,
  updateOfflineSubmission,
  type OfflineSubmission,
  type OfflineSubmissionStatus,
} from "@/lib/offlineQueue";

interface SectionDef {
  part: string;
  title: string;
  start: number;
  end: number;
}

function getSectionsForStudy(questions: any[]): SectionDef[] {
  if (!questions || questions.length === 0) return [];

  // Dedicated section map for SPHMMC Melka Nono 68-question census
  if (questions.length === 68) {
    return [
      { part: "Part I", title: "Socio-Demographic Characteristics", start: 0, end: 14 },
      { part: "Part II", title: "Birth, Morbidity & Mortality Registration", start: 15, end: 22 },
      { part: "Part III", title: "Maternal & Child Health", start: 23, end: 42 },
      { part: "Part IV", title: "Household & Environmental Health", start: 43, end: 65 },
      { part: "Part V", title: "Information Channels & Verification", start: 66, end: 67 },
    ];
  }

  // Automatic heuristic for other studies: group by ~12 questions or explicit "Part" markers
  const chunkSize = Math.max(8, Math.ceil(questions.length / Math.ceil(questions.length / 12)));
  const sections: SectionDef[] = [];
  for (let s = 0; s < questions.length; s += chunkSize) {
    const end = Math.min(s + chunkSize - 1, questions.length - 1);
    sections.push({
      part: `Section ${sections.length + 1}`,
      title: `Questions ${s + 1} – ${end + 1}`,
      start: s,
      end,
    });
  }
  return sections;
}

export default function FieldCollectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [study, setStudy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(-1); // -1: consent, 0+: question, questions.length: review
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
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Desktop navigation sidebar & mobile drawer states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [filterUnanswered, setFilterUnanswered] = useState(false);
  const [syncStatus, setSyncStatus] = useState<OfflineSubmissionStatus | "SYNCED" | "OFFLINE">(
    typeof navigator !== "undefined" && navigator.onLine ? "SYNCED" : "OFFLINE"
  );

  const t = {
    en: {
      consent: "Participant Informed Consent",
      agree: "Confirm Participant Consent & Start",
      next: "Next Question",
      prev: "Previous",
      submit: "Submit Field Response",
      submitting: "Submitting...",
      required: "Required",
      optional: "Optional",
      language: "Language",
      yes: "Yes",
      no: "No",
      skip: "Skip",
      review: "Review All Answers",
      exit: "Exit",
      exitConfirm: "Are you sure you want to exit? In-progress responses will be saved as draft.",
      allQuestions: "Question Outline",
      unansweredOnly: "Unanswered Only",
      answered: "Answered",
      of: "of",
    },
    am: {
      consent: "የተሳታፊ ስምምነት",
      agree: "ተሳታፊው መስማማቱን አረጋግጥና ጀምር",
      next: "ቀጣይ ጥያቄ",
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
      exit: "ውጣ",
      exitConfirm: "መውጣት ይፈልጋሉ? የተጀመረው ምረጣ በረቂቅነት ይቀመጣል።",
      allQuestions: "የጥያቄዎች ዝርዝር",
      unansweredOnly: "ያልተመለሱ ብቻ",
      answered: "የተመለሱ",
      of: "ከ",
    },
    om: {
      consent: "Eeyyama Hirmaataa",
      agree: "Hirmaataan walii galuu isaa nan mirkaneessa",
      next: "Gaaffii Itti Aanu",
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
      exit: "Bahi",
      exitConfirm: "Bahuu barbaadduu? Deebiin hanga ammaatti guutame akka wixineetti ni olkaa'ama.",
      allQuestions: "Tarree Gaaffilee",
      unansweredOnly: "Kan hin deebifamne qofa",
      answered: "Deebifame",
      of: "keessaa",
    },
    ti: {
      consent: "ስምምነት ተሳታፊ",
      agree: "እቲ ተሳታፊ ከምዝተሰማምዐ አረጋግፅ",
      next: "ቀፃሊ ሕቶ",
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
      exit: "ውፃእ",
      exitConfirm: "ክትወፅእ ትደሊ ዲኻ? ዝተጀመረ ምላሽ ከም ንድፊ ክዕቀብ እዩ።",
      allQuestions: "ዝርዝር ሕቶታት",
      unansweredOnly: "ዘይተመለሱ ጥራይ",
      answered: "ዝተመለሱ",
      of: "ካብ",
    },
    so: {
      consent: "Oggolaanshaha ka qaybgalaha",
      agree: "Waxaan xaqiijinayaa in ka qaybgaluhu oggolaaday",
      next: "Su'aasha Xigta",
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
      exit: "Ka bax",
      exitConfirm: "Ma hubtaa inaad rabto inaad baxdo? Jawaabaha qabyada ah waa la kaydin doonaa.",
      allQuestions: "Liiska Su'aalaha",
      unansweredOnly: "Keliya kuwa aan laga jawaabin",
      answered: "La jawaabay",
      of: "ee",
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
          const cached = await getCachedOfflineForm(params.id);
          if (cached?.data) {
            setStudy((cached.data as { study: any }).study);
            setSyncStatus("OFFLINE");
          } else {
            throw new Error(data.error || "Failed to load study details.");
          }
        }
        if (cancelled) return;
        if (data?.study) {
          setStudy(data.study);
          await cacheOfflineForm(params.id, data.study.updatedAt || new Date().toISOString(), data);
        }

        // Restore draft answers from local storage if available
        try {
          const savedDraft = localStorage.getItem(`tinat_collector_draft_${params.id}`);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
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

  useEffect(() => {
    async function syncPending() {
      if (!navigator.onLine) {
        setSyncStatus("OFFLINE");
        return;
      }
      const pending = await getOfflineSubmissions();
      if (!pending.length) {
        setSyncStatus("SYNCED");
        return;
      }
      for (const item of pending) {
        const syncing: OfflineSubmission = { ...item, status: "SYNCING" };
        await updateOfflineSubmission(syncing);
        setSyncStatus("SYNCING");
        try {
          const response = await fetch(item.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.body),
          });
          if (response.ok) {
            await deleteOfflineSubmission(item.id);
          } else if (response.status === 409) {
            await updateOfflineSubmission({
              ...item,
              status: "FAILED",
              attempts: item.attempts + 1,
              lastError: "The form changed. Refresh it before resubmitting.",
            });
          } else {
            const data = await response.json().catch(() => ({}));
            await updateOfflineSubmission({
              ...item,
              status: "FAILED",
              attempts: item.attempts + 1,
              lastError: data.error || "Synchronization failed.",
            });
          }
        } catch {
          await updateOfflineSubmission({
            ...item,
            status: "FAILED",
            attempts: item.attempts + 1,
            lastError: "Network unavailable.",
          });
        }
      }
      const remaining = await getOfflineSubmissions();
      setSyncStatus(remaining.some((item) => item.status === "FAILED") ? "FAILED" : remaining.length ? "PENDING" : "SYNCED");
    }

    void syncPending();
    const handleOffline = () => setSyncStatus("OFFLINE");
    window.addEventListener("online", syncPending);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", syncPending);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
      const submissionKey = (typeof crypto !== "undefined" && "randomUUID" in crypto)
        ? crypto.randomUUID()
        : `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const body = {
          collectionMethod: "FIELD_COLLECTED",
          language,
          answers: formattedAnswers,
          submissionKey,
          formRevision: typeof study?.updatedAt === "string" ? study.updatedAt : undefined,
      };

      if (!navigator.onLine) {
        await queueOfflineSubmission({
          id: submissionKey,
          kind: "study",
          url: `/api/studies/${params.id}/responses`,
          body,
          createdAt: new Date().toISOString(),
          formRevision: body.formRevision,
          status: "PENDING",
          attempts: 0,
        });
        setSyncStatus("PENDING");
        setIsSuccess(true);
        setAnswers({});
        localStorage.removeItem(`tinat_collector_draft_${params.id}`);
        return;
      }

      const res = await fetch(`/api/studies/${params.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      try {
        const formattedAnswers = formatCollectorAnswers(answers);
        const submissionKey = (typeof crypto !== "undefined" && "randomUUID" in crypto)
          ? crypto.randomUUID()
          : `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await queueOfflineSubmission({
          id: submissionKey,
          kind: "study",
          url: `/api/studies/${params.id}/responses`,
          body: {
            collectionMethod: "FIELD_COLLECTED",
            language,
            answers: formattedAnswers,
            submissionKey,
            formRevision: typeof study?.updatedAt === "string" ? study.updatedAt : undefined,
          },
          createdAt: new Date().toISOString(),
          status: "PENDING",
          attempts: 0,
        });
        setSyncStatus("PENDING");
        setIsSuccess(true);
        setAnswers({});
        localStorage.removeItem(`tinat_collector_draft_${params.id}`);
      } catch {
        setErrorMessage("The response could not be saved locally. Keep this page open and try again.");
      }
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

  const questions: any[] = study?.questions || [];
  const sections: SectionDef[] = useMemo(() => getSectionsForStudy(questions), [questions]);
  const q = questions[currentStep];

  // Real-time skip logic evaluation for the active question
  const currentSkip = useMemo(() => {
    if (!q) return { skipped: false };
    return isQuestionSkipped(q.order + 1, questions, answers, DEFAULT_STUDY_SKIP_RULES);
  }, [q, questions, answers]);

  const currentSection = useMemo(() => {
    if (currentStep < 0 || currentStep >= questions.length) return null;
    return sections.find((s) => currentStep >= s.start && currentStep <= s.end) || null;
  }, [currentStep, questions.length, sections]);

  const isRosterQuestion = useMemo(() => {
    if (!q) return false;
    return q.order === 11 || q.text.toLowerCase().includes("family size");
  }, [q]);

  const hasCurrentAnswer = useMemo(() => {
    if (!q) return false;
    if (currentSkip.skipped) return true; // Skipped questions do not block advancement
    return hasRequiredAnswer(
      answers[q.id],
      q.type === "MULTIPLE_CHOICE_GRID" || q.type === "CHECKBOX_GRID"
        ? q.rows?.map((row: any) => row.value) || []
        : undefined
    );
  }, [answers, q, currentSkip.skipped]);

  const canAdvance = useMemo(() => {
    if (!q) return true;
    if (currentSkip.skipped) return true;
    if (!q.required) return true;
    return hasCurrentAnswer;
  }, [q, currentSkip.skipped, hasCurrentAnswer]);

  // Next Question with Skip Logic Branching
  const handleNext = useCallback(() => {
    if (canAdvance) {
      const nextStep = getNextActiveStep(currentStep, questions, answers, DEFAULT_STUDY_SKIP_RULES);
      setCurrentStep(nextStep);
    }
  }, [canAdvance, currentStep, questions, answers]);

  // Previous Question with Skip Logic Branching
  const handlePrev = useCallback(() => {
    const prevStep = getPreviousActiveStep(currentStep, questions, answers, DEFAULT_STUDY_SKIP_RULES);
    setCurrentStep(prevStep);
  }, [currentStep, questions, answers]);

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
      if (!isInput && q?.type === "SINGLE_CHOICE" && Array.isArray(q.options) && !currentSkip.skipped) {
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
  }, [canAdvance, currentStep, q, questions.length, handleNext, currentSkip.skipped]);

  // Loading state
  if (isLoading) {
    return (
      <div className="relative h-full w-full flex flex-col items-center justify-center p-6 text-center bg-background">
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
      <div className="relative h-full w-full flex flex-col items-center justify-center p-6 text-center bg-background">
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
  const answeredCount = questions.filter((item: any) => {
    const skipCheck = isQuestionSkipped(item.order + 1, questions, answers, DEFAULT_STUDY_SKIP_RULES);
    if (skipCheck.skipped) return true; // Skipped questions count towards completion
    return hasRequiredAnswer(
      answers[item.id],
      item.type === "MULTIPLE_CHOICE_GRID" || item.type === "CHECKBOX_GRID"
        ? item.rows?.map((row: any) => row.value) || []
        : undefined
    );
  }).length;
  const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100);

  // Success Screen
  if (isSuccess) {
    return (
      <div className="relative h-full w-full flex flex-col items-center justify-center bg-background p-4 sm:p-6">
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
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background min-h-0">
        <div className="mx-auto w-full max-w-4xl h-full flex flex-col bg-card sm:border-x border-border/50 sm:shadow-2xl overflow-hidden relative min-h-0">
          {/* Top Bar */}
          <header className="h-14 sm:h-16 shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-20">
            <button
              type="button"
              onClick={() => router.push("/collector/dashboard")}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Field Collection Mode
            </span>
          </header>

          {/* Scrollable Consent Body */}
          <main className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-10 space-y-6 max-w-2xl mx-auto w-full touch-pan-y overscroll-y-auto [scrollbar-gutter:stable]">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                {t.consent}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                St. Paul’s Hospital Millennium Medical College (SPHMMC) &bull; Department of Public Health
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-3 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              <p className="font-bold text-foreground">
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

            {/* Study Sections Overview */}
            <div className="rounded-2xl border border-border p-4 bg-background space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Questionnaire Sections ({sections.length} Parts &bull; {questions.length} Indicators)
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Real-Time Logic Active
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {sections.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border/60">
                    <span className="font-bold text-emerald-600 shrink-0">{s.part}</span>
                    <span className="text-muted-foreground truncate">{s.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <p className="leading-relaxed">
                Ensure verbal or written consent is explicitly granted by the household head or authorized representative before recording data.
              </p>
            </div>
          </main>

          {/* Fixed Bottom Action Bar */}
          <footer className="shrink-0 border-t border-border bg-card/95 backdrop-blur-md p-4 sm:px-8 sm:py-4 z-20">
            <div className="max-w-2xl mx-auto w-full">
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
          </footer>
        </div>
      </div>
    );
  }

  // Review & Submit Screen (Step === questions.length)
  if (isDone) {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background min-h-0">
        <div className="mx-auto w-full max-w-5xl h-full flex flex-col bg-card sm:border-x border-border/50 sm:shadow-2xl overflow-hidden relative min-h-0">
          {/* Top Bar */}
          <header className="h-14 sm:h-16 shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-20">
            <button
              type="button"
              onClick={() => setCurrentStep(questions.length - 1)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Edit</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {answeredCount} / {questions.length} Verified ({progressPercent}%)
              </span>
            </div>
          </header>

          {/* Scrollable Summary Grouped by Section */}
          <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 space-y-6 pb-28 touch-pan-y overscroll-y-auto [scrollbar-gutter:stable]">
            <div className="text-center space-y-1.5 pb-2">
              <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                Review Household Responses
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Verify collected data across all survey parts before final submission. Click any question to edit.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sections Accordion / Cards */}
            <div className="space-y-6">
              {sections.map((section, sIdx) => {
                const sectionQuestions = questions.slice(section.start, section.end + 1);
                const sectionAnswered = sectionQuestions.filter((sq) => {
                  const sCheck = isQuestionSkipped(sq.order + 1, questions, answers, DEFAULT_STUDY_SKIP_RULES);
                  return sCheck.skipped || hasAnswer(answers[sq.id]);
                }).length;

                return (
                  <div key={sIdx} className="rounded-2xl border border-border bg-muted/15 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          {section.part}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                          {section.title}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted border border-border text-foreground shrink-0">
                        {sectionAnswered} / {sectionQuestions.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {sectionQuestions.map((question: any, idxOffset: number) => {
                        const globalIndex = section.start + idxOffset;
                        const answer = answers[question.id];
                        const skipStatus = isQuestionSkipped(question.order + 1, questions, answers, DEFAULT_STUDY_SKIP_RULES);
                        const isProvided = hasAnswer(answer);

                        let displayAnswer = "No answer recorded";
                        if (skipStatus.skipped) {
                          displayAnswer = `Skipped by Logic: ${skipStatus.reason}`;
                        } else if (isProvided) {
                          if (answer && typeof answer === "object" && "members" in answer) {
                            displayAnswer = `Dynamic Roster (${answer.total} members: ${answer.maleCount} Male, ${answer.femaleCount} Female)`;
                          } else if (Array.isArray(answer)) {
                            displayAnswer = answer.join(", ");
                          } else if (typeof answer === "object") {
                            displayAnswer = Object.entries(answer)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" | ");
                          } else {
                            displayAnswer = String(answer);
                          }
                        }

                        return (
                          <div
                            key={question.id}
                            onClick={() => setCurrentStep(globalIndex)}
                            className={`group cursor-pointer rounded-xl border p-3.5 transition flex flex-col justify-between gap-2 shadow-xs ${
                              skipStatus.skipped
                                ? "border-dashed border-border/60 bg-muted/30 opacity-75"
                                : "border-border/80 bg-card hover:border-emerald-500/50"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-foreground">
                                  Q{globalIndex + 1}
                                </span>
                                {skipStatus.skipped ? (
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">
                                    Skipped
                                  </span>
                                ) : question.required ? (
                                  <span className="text-[10px] font-bold text-rose-500 uppercase">
                                    Required
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    Optional
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-foreground group-hover:text-emerald-600 transition break-words line-clamp-2">
                                {questionTranslations[question.id]?.text || question.text}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
                              <div className="truncate flex-1">
                                {skipStatus.skipped ? (
                                  <span className="text-amber-700 dark:text-amber-300 italic text-[11px] truncate block">
                                    {displayAnswer}
                                  </span>
                                ) : isProvided ? (
                                  <span className="text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md text-[11px] truncate block">
                                    {displayAnswer}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic text-[11px]">
                                    Not recorded
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-emerald-600 inline-flex items-center gap-1 shrink-0">
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Fixed Bottom Submit Action Bar */}
          <footer className="shrink-0 border-t border-border bg-card/95 backdrop-blur-md p-4 sm:px-8 sm:py-4 flex items-center justify-between gap-4 z-20">
            <button
              type="button"
              onClick={() => setCurrentStep(questions.length - 1)}
              className="rounded-xl border border-border bg-background px-5 py-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition"
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
          </footer>
        </div>
      </div>
    );
  }

  // Active Question Screen (0 <= currentStep < questions.length)
  // Renders a modern Desktop Two-Panel Layout with collapsible Question & Section Navigator
  return (
    <div className="relative h-full w-full flex overflow-hidden bg-background min-h-0">
      {/* Pinned Top Viewport Progress Line */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-muted/40 z-[999] pointer-events-none"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-emerald-600 transition-all duration-300 ease-out shadow-xs"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {/* ============================================================== */}
      {/* DESKTOP QUESTION & SECTION NAVIGATOR SIDEBAR                   */}
      {/* ============================================================== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-border bg-card transition-all duration-200 z-20 ${
          sidebarOpen ? "w-72 xl:w-80" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 shrink-0 border-b border-border px-4 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold text-foreground truncate">
              {study.title}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
              <span className="font-semibold text-emerald-600">{answeredCount} of {questions.length} answered</span>
              <span>&bull;</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toggle */}
        <div className="px-3 py-2 border-b border-border bg-muted/20 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Outline</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-mono">
              Branching ON
            </span>
          </span>
          <button
            type="button"
            onClick={() => setFilterUnanswered(!filterUnanswered)}
            className={`px-2 py-0.5 rounded-md font-semibold transition ${
              filterUnanswered
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {filterUnanswered ? "Show All" : "Unanswered Only"}
          </button>
        </div>

        {/* Scrollable Questions & Sections List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {sections.map((section, sIdx) => {
            const sectionQuestions = questions.slice(section.start, section.end + 1);
            const isSectionActive = currentStep >= section.start && currentStep <= section.end;

            return (
              <div key={sIdx} className="space-y-1.5">
                <div className="flex items-center justify-between px-1.5 text-[11px]">
                  <span className={`font-bold uppercase tracking-wider ${isSectionActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {section.part}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                    {section.title}
                  </span>
                </div>

                {/* Compact Grid of Question Chips */}
                <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-xl bg-muted/30 border border-border/50">
                  {sectionQuestions.map((sq: any, offset: number) => {
                    const idx = section.start + offset;
                    const isCurrent = currentStep === idx;
                    const isAnswered = hasAnswer(answers[sq.id]);
                    const skipCheck = isQuestionSkipped(sq.order + 1, questions, answers, DEFAULT_STUDY_SKIP_RULES);

                    if (filterUnanswered && (isAnswered || skipCheck.skipped)) return null;

                    return (
                      <button
                        key={sq.id}
                        type="button"
                        onClick={() => setCurrentStep(idx)}
                        title={`Q${idx + 1}: ${sq.text}${skipCheck.skipped ? ` (Skipped by logic: ${skipCheck.reason})` : ""}`}
                        className={`relative h-8 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                          isCurrent
                            ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500 ring-offset-1 ring-offset-card"
                            : skipStatusClass(skipCheck.skipped, isAnswered)
                        }`}
                      >
                        <span className={skipCheck.skipped ? "line-through opacity-60 text-[10px]" : ""}>
                          {idx + 1}
                        </span>
                        {isAnswered && !isCurrent && !skipCheck.skipped && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-600 text-[8px] text-white">
                            ✓
                          </span>
                        )}
                        {skipCheck.skipped && !isCurrent && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white">
                            -
                          </span>
                        )}
                        {sq.required && !isAnswered && !isCurrent && !skipCheck.skipped && (
                          <span className="absolute top-0.5 right-1 text-[9px] text-rose-500">
                            *
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border shrink-0 bg-muted/10 space-y-2">
          <button
            type="button"
            onClick={() => setCurrentStep(questions.length)}
            className="w-full py-2.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground hover:bg-muted transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Review All Responses ({answeredCount}/{questions.length})</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN QUESTION WORKSPACE AREA                                  */}
      {/* ============================================================== */}
      <div className="flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-hidden bg-background relative">
        {/* Fixed Top Header */}
        <header className="h-14 sm:h-16 shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
          {/* Left: Sidebar Toggle, Back, and Section Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Desktop Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition"
              title={sidebarOpen ? "Hide Outline Sidebar" : "Show Outline Sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5 text-emerald-600" />}
            </button>

            {/* Previous Question Chevron */}
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition shrink-0"
              aria-label="Previous question"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Mobile Drawer Trigger Pill */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted/40 text-xs font-bold text-foreground"
            >
              <ListOrdered className="w-3.5 h-3.5 text-emerald-600" />
              <span>Q{currentStep + 1}/{questions.length}</span>
            </button>

            {/* Title / Section Name */}
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-2">
                {currentSection && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider shrink-0">
                    {currentSection.part}
                  </span>
                )}
                <h1 className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {currentSection?.title || study.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Right: Step Counter, Exit */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground" role="status" aria-live="polite">
              {syncStatus === "SYNCED" ? "Synced" : syncStatus === "OFFLINE" ? "Offline" : syncStatus === "PENDING" ? "Pending" : syncStatus === "SYNCING" ? "Syncing" : "Sync failed"}
            </div>
            {syncStatus === "FAILED" && (
              <button type="button" onClick={() => window.dispatchEvent(new Event("online"))} className="hidden text-[11px] font-bold text-primary underline sm:block">
                Retry
              </button>
            )}
            <div className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20">
              <span>{answeredCount}</span>
              <span className="text-muted-foreground font-normal">/</span>
              <span className="text-muted-foreground font-normal">{questions.length} Verified</span>
            </div>

            {/* Exit to Dashboard Button */}
            <button
              type="button"
              onClick={() => {
                if (Object.keys(answers).length > 0) {
                  setShowExitConfirm(true);
                } else {
                  router.push("/collector/dashboard");
                }
              }}
              title="Exit to Dashboard"
              className="inline-flex items-center gap-1.5 p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Exit</span>
            </button>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-muted overflow-hidden shrink-0">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Scrollable Question Content */}
        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-10 sm:py-8 touch-pan-y overscroll-y-auto pb-32 [scrollbar-gutter:stable]">
          <div className="max-w-3xl xl:max-w-4xl mx-auto space-y-6">
            {errorMessage && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Section & Question Metadata Header */}
            <div className="space-y-2.5 border-b border-border/60 pb-5">
              <div className="flex items-center gap-2 flex-wrap">
                {currentSection && (
                  <span className="inline-flex items-center rounded-lg bg-muted text-muted-foreground px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-border/60">
                    {currentSection.part}: {currentSection.title}
                  </span>
                )}
                <span className="inline-flex items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                  Question {currentStep + 1} of {questions.length}
                </span>
                {currentSkip.skipped ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold border border-amber-500/30">
                    <Sparkles className="w-3 h-3" />
                    Skipped by Logic
                  </span>
                ) : q.required ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[10px] font-semibold">
                    * {t.required}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-lg bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-medium">
                    {t.optional}
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-foreground leading-snug break-words">
                {questionTranslations[q.id]?.text || q.text}
              </h2>
            </div>

            {/* ========================================================== */}
            {/* REAL-TIME LOGIC SKIP BANNER OR QUESTION INPUT              */}
            {/* ========================================================== */}
            {currentSkip.skipped ? (
              <div className="rounded-3xl border-2 border-dashed border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto my-6 animate-in zoom-in-95 duration-200 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 inline-block">
                    Real-Time Logic Branch
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Indicator Automatically Skipped
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {currentSkip.reason}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition active:scale-[0.98]"
                  >
                    <span>Continue to Next Active Indicator</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Input Controls */
              <div className="pt-2">
                {/* DYNAMIC HOUSEHOLD ROSTER (Q12) */}
                {isRosterQuestion && (
                  <div className="space-y-4">
                    <HouseholdRosterComponent
                      value={answers[q.id]}
                      onChange={(rosterData: HouseholdRosterData) => {
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: rosterData,
                        }));
                      }}
                      onSyncCounts={(maleCount: number, femaleCount: number) => {
                        const q13 = questions.find((item: any) => item.order === 12);
                        const q14 = questions.find((item: any) => item.order === 13);
                        if (q13) {
                          setAnswers((prev) => ({ ...prev, [q13.id]: maleCount }));
                        }
                        if (q14) {
                          setAnswers((prev) => ({ ...prev, [q14.id]: femaleCount }));
                        }
                      }}
                    />
                  </div>
                )}

                {/* SINGLE_CHOICE */}
                {q.type === "SINGLE_CHOICE" && (
                  <div
                    className={`gap-3 ${
                      q.options && q.options.length >= 4
                        ? "grid grid-cols-1 md:grid-cols-2"
                        : "space-y-3"
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
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3.5 ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-xs ring-1 ring-emerald-600"
                              : "border-border bg-card text-foreground hover:border-emerald-500/40 hover:bg-muted/30 active:scale-[0.99]"
                          }`}
                        >
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5 transition ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold break-words flex-1 leading-snug">
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
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
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
                          className={`p-5 sm:p-6 rounded-2xl border-2 transition-all text-center flex flex-col items-center justify-center gap-2.5 ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-600"
                              : "border-border bg-card text-foreground hover:border-emerald-500/40 active:scale-[0.98]"
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </span>
                          <span className="text-base font-bold">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* MULTIPLE_CHOICE */}
                {q.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-muted-foreground font-medium mb-1">
                      Select all options that apply:
                    </p>
                    <div
                      className={`gap-3 ${
                        q.options && q.options.length >= 4
                          ? "grid grid-cols-1 md:grid-cols-2"
                          : "space-y-2.5"
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
                            className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border-2 p-4 font-semibold transition-all ${
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
                              className="h-4 w-4 rounded accent-emerald-600 mt-0.5 shrink-0"
                            />
                            <span className="text-xs sm:text-sm break-words flex-1 leading-snug">
                              {questionTranslations[q.id]?.options?.[opt.id] || opt.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* NUMBER (Only if not a roster question) */}
                {q.type === "NUMBER" && !isRosterQuestion && (
                  <div className="max-w-md mx-auto space-y-5">
                    {/* Census auto-sync notice on Q13 and Q14 */}
                    {(q.order === 12 || q.order === 13) && answers[q.id] !== undefined && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>Pre-filled from Household Roster (Q12). You can adjust if needed.</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = Number(answers[q.id]) || 0;
                          if (cur > 0) {
                            setAnswers((prev) => ({ ...prev, [q.id]: cur - 1 }));
                          }
                        }}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground hover:bg-muted active:scale-95 transition"
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
                        className="flex-1 p-4 text-center text-2xl sm:text-3xl font-mono font-bold rounded-2xl border-2 border-border focus:border-emerald-600 focus:outline-none bg-background text-foreground"
                        placeholder="0"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const cur = Number(answers[q.id]) || 0;
                          setAnswers((prev) => ({ ...prev, [q.id]: cur + 1 }));
                        }}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground hover:bg-muted active:scale-95 transition"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Quick Number Presets */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {[0, 1, 2, 3, 4, 5].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: preset }))}
                          className={`h-10 w-11 rounded-xl border text-xs font-bold transition ${
                            answers[q.id] === preset
                              ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
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
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
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
                  <div className="relative max-w-2xl mx-auto">
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
                  <div className="max-w-2xl mx-auto space-y-1">
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
                  <div className="max-w-2xl mx-auto">
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
                  </div>
                )}

                {/* DATE & TIME */}
                {(q.type === "DATE" || q.type === "TIME") && (
                  <div className="max-w-md mx-auto">
                    <input
                      type={q.type.toLowerCase()}
                      value={answers[q.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="w-full p-4 text-xs sm:text-sm rounded-2xl border-2 border-border bg-background text-foreground focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* GRIDS */}
                {(q.type === "MULTIPLE_CHOICE_GRID" || q.type === "CHECKBOX_GRID") && (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {q.rows?.map((row: any) => {
                      const grid = answers[q.id] || {};
                      const rowAnswer = grid[row.value];
                      return (
                        <fieldset key={row.id} className="space-y-2 rounded-2xl border border-border p-4 bg-muted/20">
                          <legend className="px-2 text-xs sm:text-sm font-bold text-foreground break-words">
                            {row.text}
                          </legend>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {q.options?.map((opt: any) => {
                              const checked =
                                q.type === "MULTIPLE_CHOICE_GRID"
                                  ? rowAnswer === opt.value
                                  : Array.isArray(rowAnswer) && rowAnswer.includes(opt.value);
                              return (
                                <label
                                  key={opt.id}
                                  className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-xs font-medium transition ${
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
                                    className="h-4 w-4 accent-emerald-600 mt-0.5 shrink-0"
                                  />
                                  <span className="break-words leading-tight">{opt.text}</span>
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
            )}
          </div>
        </main>

        {/* Fixed Bottom Action Bar */}
        <footer className="shrink-0 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 sm:px-8 sm:py-4 z-30">
          <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto w-full">
            {/* Left: Previous Question */}
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 rounded-xl border border-border text-xs sm:text-sm font-semibold bg-background text-foreground hover:bg-muted active:scale-[0.98] transition"
              aria-label="Previous question"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.prev}</span>
            </button>

            {/* Center: Desktop Key Indicator or Required Hint */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
              {currentSkip.skipped ? (
                <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Skipped by survey branching logic</span>
                </span>
              ) : canAdvance ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border text-[11px] font-mono">
                  <span>Press</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold text-foreground">Enter</span>
                </span>
              ) : q.required ? (
                <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  * Answer required to continue
                </span>
              ) : null}
            </div>

            {/* Right: Skip & Next Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              {!q.required && !hasCurrentAnswer && !currentSkip.skipped && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <span>{t.skip}</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance}
                className={`inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
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

      {/* ============================================================== */}
      {/* MOBILE DRAWER OVERLAY                                          */}
      {/* ============================================================== */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-h-[80dvh] rounded-t-3xl border-t border-border bg-card p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">Question Navigator</h3>
                <p className="text-xs text-muted-foreground">{answeredCount} of {questions.length} answered</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-4">
              {sections.map((section, sIdx) => {
                const sectionQuestions = questions.slice(section.start, section.end + 1);
                return (
                  <div key={sIdx} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-emerald-600 uppercase">
                      {section.part}: {section.title}
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {sectionQuestions.map((sq: any, offset: number) => {
                        const idx = section.start + offset;
                        const isCurrent = currentStep === idx;
                        const isAnswered = hasAnswer(answers[sq.id]);
                        const skipCheck = isQuestionSkipped(sq.order + 1, questions, answers, DEFAULT_STUDY_SKIP_RULES);

                        return (
                          <button
                            key={sq.id}
                            type="button"
                            onClick={() => {
                              setCurrentStep(idx);
                              setMobileDrawerOpen(false);
                            }}
                            className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center transition ${
                              isCurrent
                                ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500"
                                : skipCheck.skipped
                                ? "bg-muted/40 text-muted-foreground line-through opacity-60"
                                : isAnswered
                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            <span>{idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">Exit Collection?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your answers will remain saved as a draft.
                </p>
              </div>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              You can return to this study later and resume filling answers from where you stopped.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => router.push("/collector/dashboard")}
                className="rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-white hover:bg-destructive/90 transition"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function skipStatusClass(isSkipped: boolean, isAnswered: boolean): string {
  if (isSkipped) {
    return "bg-muted/40 text-muted-foreground/60 border border-border/40 hover:bg-muted";
  }
  if (isAnswered) {
    return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/25";
  }
  return "bg-card text-muted-foreground border border-border hover:border-emerald-500/40 hover:text-foreground";
}
