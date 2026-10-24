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

export default function FieldCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const [study, setStudy] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(-1); // -1 is consent, 0+ is question index
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [language, setLanguage] = useState("en");
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
    },
    am: {
      consent: "የተሳታፊ ስምምነት",
      agree: "ተሳታፊው መስማማቱን አረጋግጣለሁ",
      next: "ቀጣይ",
      prev: "ቀዳሚ",
      submit: "ምላሹን አስገባ",
      submitting: "በማስገባት ላይ...",
      required: "ያስፈልጋል",
    },
    om: {
      consent: "Eeyyama Hirmaataa",
      agree: "Hirmaataan walii galuu isaa nan mirkaneessa",
      next: "Itti aanu",
      prev: "Duraa",
      submit: "Deebii Galchi",
      submitting: "Galchaa jira...",
      required: "Dirqama",
    },
    ti: {
      consent: "ስምምነት ተሳታፊ",
      agree: "እቲ ተሳታፊ ከምዝተሰማምዐ አረጋግፅ",
      next: "ቀፃሊ",
      prev: "ቅድሚኡ",
      submit: "ምላሽ አእቱ",
      submitting: "እየተልእከ እዩ...",
      required: "የድሊ",
    },
  }[language] as any;

  useEffect(() => {
    fetch(`/api/studies/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.study) setStudy(d.study);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to load study details.");
      });
  }, [params.id]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => {
        let textValue = null;
        let numberValue = null;
        if (typeof val === "number") numberValue = val;
        else textValue = typeof val === "object" ? JSON.stringify(val) : String(val);
        return { questionId: qId, textValue, numberValue };
      });

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

  if (!study) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Loading study...</p>
      </div>
    );
  }

  const questions = study.questions || [];
  const isDone = currentStep >= questions.length;
  const progress = Math.round(((currentStep + 1) / (questions.length + 1)) * 100);

  const LanguageSelector = () => (
    <div className="absolute top-4 right-4 z-50">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-background border border-border text-foreground py-1 px-2 rounded-md shadow-sm text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="en">English</option>
        <option value="am">አማርኛ</option>
        <option value="om">Afaan Oromoo</option>
        <option value="ti">ትግርኛ</option>
      </select>
    </div>
  );

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
        <LanguageSelector />
        <div className="flex-1 flex flex-col justify-center">
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
        <LanguageSelector />
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
        <h2 className="text-xl font-bold text-foreground mb-6 leading-tight">{q.text}</h2>

        {/* Large Mobile Inputs based on type */}
        <div className="space-y-3">
          {q.type === "SINGLE_CHOICE" || q.type === "YES_NO" ? (
            q.options?.map((opt: any) => (
              <button
                key={opt.id}
                onClick={() => {
                  setAnswers({ ...answers, [q.id]: opt.value });
                  setTimeout(() => setCurrentStep((c) => c + 1), 300); // Auto-advance
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-base ${
                  answers[q.id] === opt.value
                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "border-border bg-card text-foreground hover:border-emerald-500/40 active:bg-muted"
                }`}
              >
                {opt.text}
              </button>
            ))
          ) : q.type === "NUMBER" ? (
            <input
              type="number"
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: Number(e.target.value) })}
              className="w-full p-4 text-xl rounded-xl border-2 border-border focus:border-emerald-600 focus:ring-0 bg-background text-foreground"
              placeholder="Enter number..."
            />
          ) : (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
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
          disabled={q.required && !answers[q.id]}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition shadow-sm ${
            q.required && !answers[q.id]
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
