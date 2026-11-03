"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { PlatformAgreementPanel } from "../components/auth/PlatformAgreementPanel";
import { getPlatformDocumentPayload } from "@/lib/legal/platformDocuments";
import { ShieldCheck, Lock } from "lucide-react";

function AgreementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

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
  }, [redirectTarget, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!termsAccepted) {
      setError("Please review and agree to the Terms of Use and Privacy Notice to proceed.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
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
        return;
      }

      router.replace(redirectTarget);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
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
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isReacceptance ? "Updated Platform Legal Agreements" : "Platform Legal Agreement"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm max-w-md mx-auto">
            {isReacceptance
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
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              isLoading={submitting}
              disabled={!termsAccepted || submitting}
            >
              Accept Agreements & Continue
            </Button>

            <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Compliant with Ethiopian Proclamation No. 1321/2024</span>
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
