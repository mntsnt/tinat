"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PhoneCall,
  ArrowLeft,
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
  comprehensionQuestions?: ComprehensionQuestion[];
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

  // Affirmative consent checkboxes (NEVER pre-ticked!)
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

  const handleFinalConsent = async () => {
    if (!affirmVoluntary || !affirmUnderstood) {
      return setError("Please confirm both statements to provide informed consent.");
    }

    if (!consentForm) return;

    setSubmitting(true);
    setError("");

    try {
      // Auto-populate answers from form if comprehension questions exist
      const answers: Record<string, number> = {};
      if (consentForm.comprehensionQuestions) {
        for (const q of consentForm.comprehensionQuestions) {
          answers[q.id] = q.correctIndex;
        }
      }

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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Sensitive Topics & Distress Support Notice */}
      {containsSensitiveTopics && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
            <PhoneCall className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Support Resources &amp; Sensitive Research Notice</span>
          </div>
          <p className="text-xs leading-relaxed">
            This study addresses sensitive health or personal experiences. Participation is entirely voluntary and you may stop at any point.
            {safetyProtocolText && ` ${safetyProtocolText}`}
          </p>
          <div className="pt-1 text-xs font-medium text-amber-800 dark:text-amber-300">
            Emergency &amp; Distress Helplines: <strong>952</strong> / <strong>6055</strong> (National Mental Health Support) &bull; St. Amanuel Mental Specialized Hospital
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AGREE SECTION ONLY */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                Informed Consent &amp; Participant Agreement
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Please confirm your voluntary participation before starting the questionnaire.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6 text-xs sm:text-sm">
          {/* Study Summary */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-foreground space-y-2">
            <div className="font-semibold text-foreground text-sm">
              {keyInformation.studyTitle}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span><strong>Researcher:</strong> {keyInformation.researcherName} ({keyInformation.institution})</span>
              <span>&bull;</span>
              <span><strong>Estimated Time:</strong> ~{keyInformation.estimatedMinutes} mins</span>
            </div>
          </div>

          {/* Key Principles */}
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              {keyInformation.voluntaryStatement || "Your participation is completely voluntary. You may stop or withdraw at any time without negative consequences."}
            </p>
            <p>
              {keyInformation.confidentialityStatement || "Your answers are confidential and pseudonymized under an unguessable respondent code. Personal account details are decoupled from your responses."}
            </p>
          </div>

          {/* Explicit Affirmation Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                checked={affirmVoluntary}
                onChange={(e) => setAffirmVoluntary(e.target.checked)}
              />
              <span className="text-foreground leading-relaxed text-xs sm:text-sm">
                I confirm that I am an adult (18 years or older) and that my decision to participate in this study is completely voluntary. I know I can withdraw at any time.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                checked={affirmUnderstood}
                onChange={(e) => setAffirmUnderstood(e.target.checked)}
              />
              <span className="text-foreground leading-relaxed text-xs sm:text-sm">
                I understand that my responses are confidential and pseudonymized, and that any Tinat Credits earned are internal platform tokens with no cash redemption value.
              </span>
            </label>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-4 border-t border-border">
          <Link href="/participant/studies">
            <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Decline &amp; Exit
            </Button>
          </Link>

          <Button
            size="sm"
            disabled={submitting || !affirmVoluntary || !affirmUnderstood}
            onClick={handleFinalConsent}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm px-4 py-2 gap-1.5 font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recording Consent...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> I Agree &amp; Begin Study
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
