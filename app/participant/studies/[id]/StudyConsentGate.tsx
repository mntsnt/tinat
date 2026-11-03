"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Shield,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Info,
  PhoneCall,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";

interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface ConsentFormData {
  id: string;
  version: number;
  keyInformation: {
    studyTitle: string;
    researcherName: string;
    institution: string;
    estimatedMinutes: number;
    purpose: string;
    voluntaryStatement: string;
    compensationStatement: string;
    confidentialityStatement: string;
    contactInfo: string;
  };
  fullText: string;
  comprehensionQuestions: ComprehensionQuestion[];
}

interface Props {
  studyId: string;
  containsSensitiveTopics?: boolean;
  safetyProtocolText?: string | null;
  onConsentComplete: () => void;
}

export function StudyConsentGate({
  studyId,
  containsSensitiveTopics,
  safetyProtocolText,
  onConsentComplete,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [consentForm, setConsentForm] = useState<ConsentFormData | null>(null);

  // 3-step flow: 1 = Key Information, 2 = Comprehension Check, 3 = Explicit Agreement
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Comprehension answers state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [failedQuestions, setFailedQuestions] = useState<string[]>([]);
  const [comprehensionPassed, setComprehensionPassed] = useState(false);

  // Step 3 explicit checkboxes (NEVER pre-ticked!)
  const [affirmVoluntary, setAffirmVoluntary] = useState(false);
  const [affirmUnderstood, setAffirmUnderstood] = useState(false);

  useEffect(() => {
    fetch(`/api/studies/${studyId}/consent`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load consent form");
        return res.json();
      })
      .then((data) => {
        if (data.hasConsented) {
          onConsentComplete();
        } else {
          setConsentForm(data.consentForm);
        }
      })
      .catch((err) => {
        setError(err.message || "Could not load consent form.");
      })
      .finally(() => setLoading(false));
  }, [studyId, onConsentComplete]);

  const handleComprehensionCheck = () => {
    if (!consentForm?.comprehensionQuestions) return;
    const questions = consentForm.comprehensionQuestions;
    const failed: string[] = [];

    for (const q of questions) {
      if (answers[q.id] === undefined || answers[q.id] !== q.correctIndex) {
        failed.push(q.id);
      }
    }

    setFailedQuestions(failed);
    if (failed.length === 0) {
      setComprehensionPassed(true);
      setError("");
      setStep(3);
    } else {
      setError("Please review your answers below. All comprehension questions must be answered correctly before proceeding.");
    }
  };

  const handleFinalConsent = async () => {
    if (!affirmVoluntary || !affirmUnderstood) {
      return setError("Please confirm both statements to provide informed consent.");
    }

    if (!consentForm) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/studies/${studyId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentFormId: consentForm.id,
          answers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record consent.");
      } else {
        onConsentComplete();
      }
    } catch {
      setError("Network error recording consent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-xs text-muted-foreground mt-3">Loading research informed consent protocol...</p>
      </div>
    );
  }

  if (!consentForm) {
    return (
      <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm text-center">
        {error || "Unable to retrieve consent documentation for this study."}
      </div>
    );
  }

  const { keyInformation } = consentForm;

  return (
    <div className="space-y-6">
      {/* Sensitive Topics & Distress Support Notice */}
      {containsSensitiveTopics && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
            <PhoneCall className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Support Resources & Sensitive Research Notice</span>
          </div>
          <p className="text-xs leading-relaxed">
            This study addresses sensitive health or personal experiences. Participation is entirely voluntary and you may stop at any point.
            {safetyProtocolText && ` ${safetyProtocolText}`}
          </p>
          <div className="pt-1 text-xs font-medium text-amber-800 dark:text-amber-300">
            Emergency & Distress Helplines: <strong>952</strong> / <strong>6055</strong> (National Mental Health Support) &bull; St. Amanuel Mental Specialized Hospital
          </div>
        </div>
      )}

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Informed Consent Protocol</h2>
            <p className="text-xs text-muted-foreground">
              Step {step} of 3 &bull; Version {consentForm.version} &bull; Confidential & Coded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={`px-2 py-0.5 rounded ${step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            1. Key Info
          </span>
          <span className="text-muted-foreground">&rarr;</span>
          <span className={`px-2 py-0.5 rounded ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            2. Check
          </span>
          <span className="text-muted-foreground">&rarr;</span>
          <span className={`px-2 py-0.5 rounded ${step === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            3. Agree
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: KEY INFORMATION CARD */}
      {step === 1 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              Key Information for Participants
            </CardTitle>
            <CardDescription className="text-xs">
              Please read this summary carefully before deciding whether to take part in this study.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/20 text-foreground">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Principal Researcher:</span>
                <span className="font-semibold text-sm">{keyInformation.researcherName}</span>
                <span className="block text-xs text-muted-foreground">{keyInformation.institution}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Estimated Time:</span>
                <span className="font-semibold text-sm">~{keyInformation.estimatedMinutes} minutes</span>
                <span className="block text-xs text-muted-foreground">Contact: {keyInformation.contactInfo}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <strong className="text-foreground block text-sm">Purpose of the Study</strong>
              <p>{keyInformation.purpose}</p>
            </div>

            <div className="space-y-1.5">
              <strong className="text-foreground block text-sm">Voluntary Participation & Right to Withdraw</strong>
              <p>{keyInformation.voluntaryStatement}</p>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border border-border bg-card text-foreground">
              <strong className="block text-sm font-semibold">Compensation & Token Disclaimer</strong>
              <p className="text-muted-foreground">{keyInformation.compensationStatement}</p>
            </div>

            <div className="space-y-1.5">
              <strong className="text-foreground block text-sm">Confidentiality & Participant Protection</strong>
              <p>{keyInformation.confidentialityStatement}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-2 border-t border-border">
            <Button size="sm" onClick={() => setStep(2)} className="text-xs gap-1.5">
              Continue to Comprehension Check <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: COMPREHENSION QUESTIONS */}
      {step === 2 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              Comprehension Check
            </CardTitle>
            <CardDescription className="text-xs">
              To ensure real, informed consent, please answer these 3 quick questions about your rights and this study.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-xs">
            {consentForm.comprehensionQuestions.map((q, idx) => {
              const isFailed = failedQuestions.includes(q.id);
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isFailed ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
                  }`}
                >
                  <div className="font-semibold text-foreground text-sm mb-3">
                    {idx + 1}. {q.question}
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                          answers[q.id] === optIdx
                            ? "border-emerald-600 bg-emerald-500/10 text-foreground font-medium"
                            : "border-border hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          className="mt-0.5 text-emerald-600"
                          checked={answers[q.id] === optIdx}
                          onChange={() => {
                            setAnswers({ ...answers, [q.id]: optIdx });
                            setFailedQuestions(failedQuestions.filter((id) => id !== q.id));
                          }}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>

                  {isFailed && (
                    <div className="mt-2.5 text-destructive font-medium text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Incorrect. Please review the key information and select the correct answer.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
          <CardFooter className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Key Info
            </Button>
            <Button size="sm" onClick={handleComprehensionCheck} className="text-xs gap-1.5">
              Verify Answers & Proceed <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: EXPLICIT AGREEMENT */}
      {step === 3 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Explicit Participant Agreement
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm your voluntary agreement below. Boxes are deliberately left unchecked for your affirmative consent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium">
              &#10003; Comprehension check passed! You have demonstrated understanding of voluntary participation, data pseudonymization, and platform credit terms.
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  checked={affirmVoluntary}
                  onChange={(e) => setAffirmVoluntary(e.target.checked)}
                />
                <span className="text-foreground leading-relaxed">
                  I confirm that I am an adult (18 years or older) and that my decision to participate in this study is completely voluntary. I know I can withdraw at any time.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  checked={affirmUnderstood}
                  onChange={(e) => setAffirmUnderstood(e.target.checked)}
                />
                <span className="text-foreground leading-relaxed">
                  I understand that my responses are confidential and pseudonymized, and that any Tinat Credits earned are internal platform tokens with no cash redemption value.
                </span>
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Check
            </Button>
            <Button
              size="sm"
              disabled={submitting || !affirmVoluntary || !affirmUnderstood}
              onClick={handleFinalConsent}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recording Consent...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> I Consent and Begin Study
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
