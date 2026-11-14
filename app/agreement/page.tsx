"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { PlatformAgreementPanel } from "../components/auth/PlatformAgreementPanel";
import { AuthStepper } from "../components/auth/AuthStepper";
import { getPlatformDocumentPayload } from "@/lib/legal/platformDocuments";
import { ShieldCheck, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { TinatLogo } from "../components/ui/TinatLogo";
import { getSafeInternalRedirectPath } from "@/lib/safeRedirect";

interface RegistrationDraft {
  name: string;
  email: string;
  password: string;
  role: "PARTICIPANT" | "RESEARCHER";
}

function AgreementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow = searchParams.get("flow");
  const isSignupFlow = flow === "signup";
  const redirectTarget =
    getSafeInternalRedirectPath(searchParams.get("redirect")) || "/dashboard";

  const [signupDraft, setSignupDraft] = useState<RegistrationDraft | null>(null);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [optionalContactConsent, setOptionalContactConsent] = useState(false);
  const [documentHash, setDocumentHash] = useState("");
  const [diffHighlights, setDiffHighlights] = useState<string[]>([]);
  const [isReacceptance, setIsReacceptance] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const payload = getPlatformDocumentPayload();
    setDocumentHash(payload.documentHash);

    if (isSignupFlow) {
      try {
        const raw = sessionStorage.getItem("tinat_registration_draft");
        if (!raw) {
          router.replace("/register");
          return;
        }
        const parsed = JSON.parse(raw);
        if (!parsed.email || !parsed.password) {
          router.replace("/register");
          return;
        }
        setSignupDraft(parsed);
      } catch {
        router.replace("/register");
        return;
      } finally {
        setLoading(false);
      }
    } else {
      fetch("/api/user/platform-consent")
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            const status = data.consentStatus;
            if (status.hasValidConsent) {
              router.replace(redirectTarget);
              return;
            }
            if (status.needsReacceptance && status.diffSummary) {
              setIsReacceptance(true);
              setDiffHighlights(status.diffSummary);
            }
          }
        })
        .catch(() => {
          // Continue and show panel
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isSignupFlow, redirectTarget, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!termsAccepted) {
      setError("Please review and agree to the Terms of Use and Privacy Notice to proceed.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      if (isSignupFlow) {
        if (!signupDraft) {
          setError("Registration session expired. Please start registration again.");
          setSubmitting(false);
          return;
        }

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: signupDraft.name,
            email: signupDraft.email,
            password: signupDraft.password,
            role: signupDraft.role,
            termsAccepted: true,
            optionalContactConsent,
            documentHash,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Registration failed. Please check your details.");
          setSubmitting(false);
          return;
        }

        // Successfully created user and recorded consent
        try {
          sessionStorage.removeItem("tinat_registration_draft");
        } catch {
          // Ignore storage clear error
        }

        const queryParams = new URLSearchParams();
        queryParams.set("email", signupDraft.email);
        if (redirectTarget) queryParams.set("redirect", redirectTarget);
        if (data.emailSent === false) {
          queryParams.set("deliveryWarning", "1");
        }

        router.push(`/verify-email?${queryParams.toString()}`);
      } else {
        const res = await fetch("/api/user/platform-consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            termsAccepted,
            optionalContactConsent,
            documentHash,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to record agreement.");
          setSubmitting(false);
          return;
        }

        router.replace(redirectTarget);
      }
    } catch {
      setError("Unable to connect to the server.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center p-4 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Verifying platform agreement status...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 py-8 md:py-12 bg-muted/20">
      <Card className="w-full max-w-2xl shadow-xl border-border bg-card">
        <CardHeader className="text-center pb-3">
          {isSignupFlow ? (
            <>
              <div className="flex justify-center mb-3">
                <Link href="/" className="transition-transform hover:scale-105">
                  <TinatLogo size={52} variant="color" />
                </Link>
              </div>
              <AuthStepper currentStep={2} />
              <div className="flex items-center justify-between text-left mb-1">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Account Details</span>
                </Link>
                {signupDraft?.email && (
                  <span className="text-xs text-muted-foreground font-medium">
                    Registering: <strong className="text-foreground">{signupDraft.email}</strong>
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          )}

          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignupFlow
              ? "Platform Agreement & Legal Documents"
              : isReacceptance
              ? "Updated Platform Legal Agreements"
              : "Platform Legal Agreement"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm max-w-lg mx-auto">
            {isSignupFlow
              ? "Please read and accept Tinat's Terms of Use and Privacy Notice to proceed to verification."
              : isReacceptance
              ? "Tinat has updated its platform terms and privacy guidelines. Please review and accept the latest versions to continue."
              : "Before accessing studies and platform features, please review and accept Tinat's Terms of Use and Privacy Notice."}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <PlatformAgreementPanel
              requireScrollToEnd={true}
              requiredChecked={termsAccepted}
              onRequiredCheckedChange={setTermsAccepted}
              optionalContactChecked={optionalContactConsent}
              onOptionalContactCheckedChange={setOptionalContactConsent}
              diffHighlights={diffHighlights}
            />

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
                {isSignupFlow && (
                  <div className="mt-2 text-xs">
                    <Link href="/register" className="underline font-semibold mr-3">
                      Edit registration details
                    </Link>
                    <Link
                      href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
                      className="underline font-semibold"
                    >
                      Sign in instead
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
              isLoading={submitting}
              disabled={!termsAccepted || submitting}
            >
              <span>{isSignupFlow ? "Accept & Continue to Email Verification" : "Accept Agreements & Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>National Research Ethics & Data Protection Standards</span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

export default function AgreementPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center p-4 min-h-[60vh]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading legal agreement...</span>
          </div>
        </main>
      }
    >
      <AgreementContent />
    </Suspense>
  );
}
