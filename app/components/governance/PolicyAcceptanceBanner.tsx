"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";

interface PolicyAcceptanceBannerProps {
  policyKey: "terms" | "charter" | "code-of-conduct" | "dpa" | "privacy";
  policyName: string;
  version: string;
}

export function PolicyAcceptanceBanner({
  policyKey,
  policyName,
  version,
}: PolicyAcceptanceBannerProps) {
  const [loading, setLoading] = useState(true);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/user/policy-acceptance")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.acceptances) {
          setIsAuthenticated(true);
          const fieldMap: Record<string, string | null> = {
            terms: data.acceptances.termsAcceptedAt,
            charter: data.acceptances.charterAcceptedAt,
            "code-of-conduct": data.acceptances.codeOfConductAcceptedAt,
            dpa: data.acceptances.dpaAcceptedAt,
          };
          setAcceptedAt(fieldMap[policyKey] || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [policyKey]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/policy-acceptance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy: policyKey, version }),
      });
      if (res.ok) {
        setAcceptedAt(new Date().toISOString());
      }
    } catch (err) {
      console.error("Failed to accept policy", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 my-6">
      {/* Lawyer Review Alert */}
      <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs sm:text-sm">
          <strong className="font-semibold block mb-0.5">
            DRAFT FOR LAWYER REVIEW &bull; ETHIOPIAN HEALTH DATA GOVERNANCE
          </strong>
          This document is an administrative policy draft formulated in accordance with the
          Ethiopian Personal Data Protection Proclamation No. 1321/2024 and National Health
          Research Ethics guidelines. It does not replace independent institutional legal advice.
        </div>
      </div>

      {/* Acceptance state for logged in researchers/users */}
      {isAuthenticated && policyKey !== "privacy" && (
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {acceptedAt ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            <div>
              <div className="text-sm font-semibold text-foreground">
                {policyName} Acceptance Status
              </div>
              <div className="text-xs text-muted-foreground">
                {acceptedAt ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Accepted on {new Date(acceptedAt).toLocaleDateString()} (Version {version})
                  </span>
                ) : (
                  <span>You have not yet recorded acceptance of version {version}.</span>
                )}
              </div>
            </div>
          </div>

          {!acceptedAt && (
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={submitting}
              className="bg-primary text-primary-foreground text-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Recording...
                </>
              ) : (
                `Acknowledge & Accept ${policyName}`
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
