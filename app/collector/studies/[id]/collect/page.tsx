"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import {
  formatCollectorAnswers,
  hasRequiredAnswer,
} from "@/lib/collectorAnswers";
import { SUPPORTED_LOCALES, SupportedLocale } from "@/lib/i18n";

export default function FieldCollectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [study, setStudy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(-1); // -1 is consent, 0+ is question index
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [language, setLanguage] = useState<SupportedLocale>("en");
  const [availableLanguages, setAvailableLanguages] = useState<SupportedLocale[]>(["en"]);
  const [questionTranslations, setQuestionTranslations] = useState<
    Record<string, { text: string; options?: Record<string, string> }>
  >({});
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [languageWarning, setLanguageWarning] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = {
    en: {
      consent: "Participant Consent",
      agree: "I confirm the participant has agreed",
      next: "Next",
      prev: "Previous",
      submit: "Submit Field Response",
      submitting: "Submitting...",
      required: "Required",
      language: "Response language",
      yes: "Yes",
      no: "No",
    },
    am: {
      consent: "የተሳታፊ ስምምነት",
      agree: "ተሳታፊው መስማማቱን አረጋግጣለሁ",
      next: "ቀጣይ",
      prev: "ቀዳሚ",
      submit: "ምላሹን አስገባ",
      submitting: "በማስገባት ላይ...",
      required: "ያስፈልጋል",
      language: "የምላሽ ቋንቋ",
      yes: "አዎ",
      no: "አይ",
    },
    om: {
      consent: "Eeyyama Hirmaataa",
      agree: "Hirmaataan walii galuu isaa nan mirkaneessa",
      next: "Itti aanu",
      prev: "Duraa",
      submit: "Deebii Galchi",
      submitting: "Galchaa jira...",
      required: "Dirqama",
      language: "Afaan deebii",
      yes: "Eeyyee",
      no: "Lakki",
    },
    ti: {
      consent: "ስምምነት ተሳታፊ",
      agree: "እቲ ተሳታፊ ከምዝተሰማምዐ አረጋግፅ",
      next: "ቀፃሊ",
      prev: "ቅድሚኡ",
      submit: "ምላሽ አእቱ",
      submitting: "እየተልእከ እዩ...",
      required: "የድሊ",
      language: "ቋንቋ መልሲ",
      yes: "እወ",
      no: "ኣይፋል",
    },
    so: {
      consent: "Oggolaanshaha ka qaybgalaha",
      agree: "Waxaan xaqiijinayaa in ka qaybgaluhu oggolaaday",
      next: "Xiga",
      prev: "Hore",
      submit: "Gudbi jawaabta",
      submitting: "Waa la gudbinayaa...",
      required: "Waa khasab",
      language: "Luqadda jawaabta",
      yes: "Haa",
      no: "Maya",
    },
  }[language];

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

        try {
          const languagesResponse = await fetch(
            `/api/studies/${params.id}/translations?lang=en`
          );
          if (!languagesResponse.ok) {
            throw new Error("Failed to load available response languages.");
          }
          const languageData = await languagesResponse.json();
          const languages = SUPPORTED_LOCALES
            .map(({ code }) => code)
            .filter((code) =>
              Array.isArray(languageData.availableLanguages) &&
              languageData.availableLanguages.includes(code)
            );
          if (!cancelled) {
            setAvailableLanguages(languages.length > 0 ? languages : ["en"]);
          }
        } catch (error) {
          if (!cancelled) {
            setAvailableLanguages(["en"]);
            setLanguageWarning(
              error instanceof Error
                ? error.message
                : "Could not load available response languages."
            );
          }
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
          "Some study text has no translation and will appear in English."
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

  function renderLanguageSelect() {
    return (
      <label className="block text-left">
        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {t.language}
        </span>
        <select
          value={language}
          onChange={(event) => {
            const nextLanguage = SUPPORTED_LOCALES.find(
              ({ code }) => code === event.target.value
            )?.code;
            if (nextLanguage) void handleLanguageChange(nextLanguage);
          }}
          disabled={loadingTranslation || availableLanguages.length < 2}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {SUPPORTED_LOCALES.filter(({ code }) =>
            availableLanguages.includes(code)
          ).map(({ code, name, nativeName }) => (
            <option key={code} value={code}>
              {nativeName === name ? name : `${nativeName} (${name})`}
            </option>
          ))}
        </select>
        {loadingTranslation && (
          <span role="status" className="mt-1 block text-xs text-muted-foreground">
            Loading translated questions...
          </span>
        )}
      </label>
    );
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
          answers: formattedAnswers,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setAnswers({});
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || "Failed to submit field response. Please try again.");
      }
    } catch {
      setErrorMessage("Network error while submitting response.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartAnother = () => {
    setIsSuccess(false);
    setCurrentStep(-1);
    setConsentGiven(false);
    setAnswers({});
    setErrorMessage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Loading study...</p>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Study unavailable</h1>
          <p role="alert" className="text-sm text-muted-foreground">
            {errorMessage || "Study details could not be loaded."}
          </p>
          <Button onClick={() => router.push("/collector/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const questions = study.questions || [];
  const isDone = currentStep >= questions.length;
  const progress = Math.round(((currentStep + 1) / (questions.length + 1)) * 100);



  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col p-5 max-w-lg mx-auto relative justify-center items-center text-center">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Response Recorded</h1>
        <p className="text-muted-foreground mb-8 text-sm max-w-xs">
          The participant&apos;s responses have been securely saved to the study database.
        </p>
        <div className="w-full space-y-3">
          <Button
            onClick={handleStartAnother}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 h-auto text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Collect Another Response</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/collector/dashboard")}
            className="w-full py-3.5 h-auto text-sm font-semibold rounded-xl"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === -1) {
    return (
      <div className="min-h-screen bg-background flex flex-col p-5 max-w-lg mx-auto relative">
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-6">{renderLanguageSelect()}</div>
          {languageWarning && (
            <p role="status" className="mb-4 text-xs text-amber-700 dark:text-amber-300">
              {languageWarning}
            </p>
          )}
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">{t.consent}</h1>
          <p className="text-center text-muted-foreground mb-6 px-4 text-sm leading-relaxed">
            Before continuing, confirm that the participant has received the study information and has agreed to participate.
          </p>

          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl mb-8 flex gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>Do not proceed without verbal or written consent according to the researcher&apos;s protocol.</p>
          </div>

          <button
            onClick={() => {
              setConsentGiven(true);
              setCurrentStep(0);
            }}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition shadow-md active:scale-[0.98]"
          >
            {t.agree}
          </button>

          <button
            onClick={() => router.push("/collector/dashboard")}
            className="w-full mt-4 text-muted-foreground py-3 font-medium text-sm hover:text-foreground transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-background flex flex-col p-5 max-w-lg mx-auto relative">
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Ready to Submit</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            You have completed all questions for this participant.
          </p>

          {errorMessage && (
            <div className="w-full mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-base transition shadow-md ${
              isSubmitting ? "opacity-50" : "hover:bg-emerald-700 active:scale-[0.98]"
            }`}
          >
            {isSubmitting ? t.submitting : t.submit}
          </button>

          <button
            onClick={() => setCurrentStep(questions.length - 1)}
            className="w-full mt-4 text-muted-foreground py-3 font-medium text-sm hover:text-foreground transition"
          >
            Review Answers
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentStep];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col max-w-lg mx-auto">
      {/* Top Progress */}
      <div className="bg-background p-4 border-b border-border sticky top-0 z-10 shadow-sm flex items-center gap-4">
        <button
          onClick={() => setCurrentStep((c) => c - 1)}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition"
          aria-label="Previous question"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
            <span>
              {currentStep + 1} / {questions.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="mb-4">{renderLanguageSelect()}</div>
        {languageWarning && (
          <p role="status" className="mb-4 text-xs text-amber-700 dark:text-amber-300">
            {languageWarning}
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <h2 className="text-xl font-bold text-foreground mb-2 leading-tight">
          {questionTranslations[q.id]?.text || q.text}
        </h2>
        {q.required && (
          <p className="mb-5 text-xs font-medium text-destructive">{t.required}</p>
        )}

        {/* Large Mobile Inputs based on type */}
        <div className="space-y-3">
          {q.type === "SINGLE_CHOICE" ? (
            q.options?.map((opt: any) => (
              <button
                type="button"
                key={opt.id}
                aria-pressed={answers[q.id] === opt.value}
                onClick={() => setAnswers((previous) => ({ ...previous, [q.id]: opt.value }))}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-base ${
                  answers[q.id] === opt.value
                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "border-border bg-card text-foreground hover:border-emerald-500/40 active:bg-muted"
                }`}
              >
                {questionTranslations[q.id]?.options?.[opt.id] || opt.text}
              </button>
            ))
          ) : q.type === "YES_NO" ? (
            [
              { label: t.yes, value: "Yes" },
              { label: t.no, value: "No" },
            ].map((option) => (
              <button
                type="button"
                key={option.value}
                aria-pressed={answers[q.id] === option.value}
                onClick={() =>
                  setAnswers((previous) => ({ ...previous, [q.id]: option.value }))
                }
                className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-base ${
                  answers[q.id] === option.value
                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "border-border bg-card text-foreground hover:border-emerald-500/40 active:bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))
          ) : q.type === "MULTIPLE_CHOICE" ? (
            q.options?.map((opt: any) => {
              const selected: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.id}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 p-4 font-medium transition-all ${
                    checked
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setAnswers((previous) => ({
                        ...previous,
                        [q.id]: checked
                          ? selected.filter((value) => value !== opt.value)
                          : [...selected, opt.value],
                      }))
                    }
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span>{questionTranslations[q.id]?.options?.[opt.id] || opt.text}</span>
                </label>
              );
            })
          ) : q.type === "DROPDOWN" ? (
            <select
              aria-label={questionTranslations[q.id]?.text || q.text}
              value={answers[q.id] || ""}
              onChange={(event) =>
                setAnswers((previous) => ({ ...previous, [q.id]: event.target.value }))
              }
              className="h-12 w-full rounded-xl border-2 border-border bg-background px-4 text-base text-foreground focus:border-emerald-600 focus:outline-none"
            >
              <option value="">Select an option</option>
              {q.options?.map((opt: any) => (
                <option key={opt.id} value={opt.value}>
                  {questionTranslations[q.id]?.options?.[opt.id] || opt.text}
                </option>
              ))}
            </select>
          ) : q.type === "NUMBER" ? (
            <input
              type="number"
              aria-label={questionTranslations[q.id]?.text || q.text}
              value={answers[q.id] ?? ""}
              onChange={(e) =>
                setAnswers((previous) => ({
                  ...previous,
                  [q.id]: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              className="w-full p-4 text-xl rounded-xl border-2 border-border focus:border-emerald-600 focus:ring-0 bg-background text-foreground"
              placeholder="Enter number..."
            />
          ) : q.type === "DATE" || q.type === "TIME" ? (
            <input
              type={q.type.toLowerCase()}
              aria-label={questionTranslations[q.id]?.text || q.text}
              value={answers[q.id] || ""}
              onChange={(e) =>
                setAnswers((previous) => ({ ...previous, [q.id]: e.target.value }))
              }
              className="w-full p-4 text-base rounded-xl border-2 border-border bg-background text-foreground focus:border-emerald-600 focus:outline-none"
            />
          ) : q.type === "LINEAR_SCALE" ? (
            <div className="space-y-3">
              <div role="radiogroup" aria-label={questionTranslations[q.id]?.text || q.text} className="flex flex-wrap gap-2">
                {Array.from(
                  { length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 },
                  (_, index) => (q.scaleMin ?? 1) + index
                ).map((value) => (
                  <button
                    type="button"
                    key={value}
                    role="radio"
                    aria-checked={answers[q.id] === value}
                    aria-label={`Rating ${value}`}
                    onClick={() => setAnswers((previous) => ({ ...previous, [q.id]: value }))}
                    className={`min-h-11 min-w-11 rounded-lg border font-semibold ${
                      answers[q.id] === value
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {(q.scaleMinLabel || q.scaleMaxLabel) && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{q.scaleMinLabel}</span>
                  <span>{q.scaleMaxLabel}</span>
                </div>
              )}
            </div>
          ) : q.type === "MULTIPLE_CHOICE_GRID" || q.type === "CHECKBOX_GRID" ? (
            <div className="space-y-4">
              {q.rows?.map((row: any) => {
                const grid = answers[q.id] || {};
                const rowAnswer = grid[row.value];
                return (
                  <fieldset key={row.id} className="space-y-2 rounded-xl border border-border p-3">
                    <legend className="px-1 text-sm font-semibold text-foreground">{row.text}</legend>
                    {q.options?.map((opt: any) => {
                      const checked =
                        q.type === "MULTIPLE_CHOICE_GRID"
                          ? rowAnswer === opt.value
                          : Array.isArray(rowAnswer) && rowAnswer.includes(opt.value);
                      return (
                        <label key={opt.id} className="flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm text-foreground hover:bg-muted/50">
                          <input
                            type={q.type === "MULTIPLE_CHOICE_GRID" ? "radio" : "checkbox"}
                            name={`${q.id}-${row.id}`}
                            checked={checked}
                            onChange={() =>
                              setAnswers((previous) => {
                                const previousGrid = previous[q.id] || {};
                                if (q.type === "MULTIPLE_CHOICE_GRID") {
                                  return { ...previous, [q.id]: { ...previousGrid, [row.value]: opt.value } };
                                }
                                const currentRow: string[] = Array.isArray(previousGrid[row.value])
                                  ? previousGrid[row.value]
                                  : [];
                                return {
                                  ...previous,
                                  [q.id]: {
                                    ...previousGrid,
                                    [row.value]: checked
                                      ? currentRow.filter((value) => value !== opt.value)
                                      : [...currentRow, opt.value],
                                  },
                                };
                              })
                            }
                            className="h-4 w-4 accent-emerald-600"
                          />
                          <span>{questionTranslations[q.id]?.options?.[opt.id] || opt.text}</span>
                        </label>
                      );
                    })}
                  </fieldset>
                );
              })}
            </div>
          ) : q.type === "FILE_UPLOAD" ? (
            <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              Secure file upload is not available in field collection yet. Contact the researcher before collecting this response.
            </p>
          ) : q.type === "SHORT_TEXT" ? (
            <input
              type="text"
              aria-label={questionTranslations[q.id]?.text || q.text}
              value={answers[q.id] || ""}
              onChange={(e) =>
                setAnswers((previous) => ({ ...previous, [q.id]: e.target.value }))
              }
              className="w-full p-4 text-base rounded-xl border-2 border-border bg-background text-foreground focus:border-emerald-600 focus:outline-none"
              placeholder="Type answer here..."
            />
          ) : (
            <textarea
              aria-label={questionTranslations[q.id]?.text || q.text}
              value={answers[q.id] || ""}
              onChange={(e) =>
                setAnswers((previous) => ({ ...previous, [q.id]: e.target.value }))
              }
              className="w-full p-4 text-base rounded-xl border-2 border-border focus:border-emerald-600 focus:ring-0 bg-background text-foreground h-40 resize-none"
              placeholder="Type answer here..."
            />
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="p-4 bg-background border-t border-border">
        <button
          onClick={() => setCurrentStep((c) => c + 1)}
          disabled={
            (q.required &&
              !hasRequiredAnswer(
                answers[q.id],
                q.type === "MULTIPLE_CHOICE_GRID" || q.type === "CHECKBOX_GRID"
                  ? q.rows?.map((row: any) => row.value) || []
                  : undefined
              )) ||
            (q.required && q.type === "FILE_UPLOAD")
          }
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition shadow-sm ${
            (q.required &&
              !hasRequiredAnswer(
                answers[q.id],
                q.type === "MULTIPLE_CHOICE_GRID" || q.type === "CHECKBOX_GRID"
                  ? q.rows?.map((row: any) => row.value) || []
                  : undefined
              )) ||
            (q.required && q.type === "FILE_UPLOAD")
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
          }`}
        >
          <span>{currentStep === questions.length - 1 ? t.next : t.next}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
