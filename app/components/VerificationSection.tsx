"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { ShieldAlert, ShieldCheck, FileClock, ClipboardList, BookOpen } from "lucide-react";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

interface Verification {
  id: string;
  status: VerificationStatus;
  verificationType: "RESEARCHER" | "DATA_COLLECTOR";
  rejectionReason?: string;
}

export function VerificationSection({ role }: { role: string }) {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  const targetType = role === "RESEARCHER" ? "RESEARCHER" : "DATA_COLLECTOR";

  useEffect(() => {
    fetchVerification();
  }, []);

  const fetchVerification = async () => {
    try {
      const res = await fetch("/api/verification");
      if (res.ok) {
        const data = await res.json();
        const existing = data.verifications?.find((v: any) => v.verificationType === targetType);
        if (existing) {
          setVerification(existing);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError("National ID / FAN is required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationType: targetType,
          verificationReference: reference
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setVerification(data.verification);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  const isCollector = targetType === "DATA_COLLECTOR";
  const title = isCollector ? "Become a Data Collector" : "Researcher Verification";
  const description = isCollector
    ? "Data collectors help researchers gather offline field data from communities without digital access. You will earn Tinat Credits for each valid response collected."
    : "Verified researchers can publish studies and assign data collectors to conduct field research on their behalf.";
  const icon = isCollector ? <ClipboardList className="w-5 h-5 text-emerald-500" /> : <BookOpen className="w-5 h-5 text-primary" />;

  if (verification?.status === "APPROVED") {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-900/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-1">
                Verified {isCollector ? "Data Collector" : "Researcher"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Your identity has been verified. You now have full access to {isCollector ? "field collection assignments." : "study publishing and field collection tools."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (verification?.status === "PENDING") {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
              <FileClock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Verification Pending</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your application to become a {isCollector ? "Data Collector" : "Researcher"} is currently under review by platform administrators.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">
                This process usually takes 1-2 business days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {verification?.status === "REJECTED" && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive mb-1">Application Rejected</p>
              <p className="text-xs text-destructive/90">{verification.rejectionReason || "Please verify your information and try again."}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              National ID (FAN)
            </label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter your National ID (FAN) number"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground mt-2 max-w-md">
              For your privacy, this number is encrypted. It will never be visible on your public profile or shared with {isCollector ? "researchers" : "participants"}.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" isLoading={submitting} disabled={!reference.trim()}>
            Submit Verification
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
