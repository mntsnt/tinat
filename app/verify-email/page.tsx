"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";
  const statusParam = searchParams.get("status") || "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(statusParam === "success");
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (statusParam === "success") {
      setSuccess(true);
      return;
    }

    if (tokenParam) {
      setLoading(true);
      fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenParam }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.isVerified) {
            setSuccess(true);
          } else {
            setError(data.error || "Verification link is invalid or expired.");
          }
        })
        .catch(() => {
          setError("Failed to connect to the server.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [tokenParam, statusParam]);

  // Handle countdown for resend button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !code.trim()) {
      setError("Please provide both your email and the 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email.trim()) {
      setError("Please enter your email address to receive a code.");
      return;
    }

    setError("");
    setResending(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        return;
      }

      setCooldown(60);
      if (data.debugCode) {
        setSimulatedCode(data.debugCode);
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 py-12 md:py-24">
      <Card className="w-full max-w-md shadow-lg border-border">
        {success ? (
          <div>
            <CardHeader className="text-center">
              <div className="mx-auto my-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-foreground">Email Verified!</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your email address has been successfully verified. Your account is now fully active.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-3 pt-4">
              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue to Sign In
              </Button>
            </CardFooter>
          </div>
        ) : (
          <div>
            <CardHeader className="text-center">
              <div className="mx-auto my-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl text-foreground">Verify Your Email</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter the 6-digit code sent to your email to verify your Tinat account.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleVerify}>
              <CardContent className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="flex h-12 w-full text-center tracking-[0.5em] font-mono font-bold text-xl rounded-md border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                    required
                  />
                </div>

                {simulatedCode && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-sm text-emerald-600 dark:text-emerald-400">
                    <p className="font-semibold">Development Code:</p>
                    <p className="font-mono text-lg font-bold tracking-widest">{simulatedCode}</p>
                    <button
                      type="button"
                      onClick={() => setCode(simulatedCode)}
                      className="text-xs underline mt-1 font-medium"
                    >
                      Click to autofill
                    </button>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive font-medium">
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" isLoading={loading}>
                  Verify Email
                </Button>

                <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                  <span>Didn't receive a code?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline transition-colors"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend Code"}
                  </button>
                </div>

                <div className="text-center text-sm text-muted-foreground pt-2">
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Back to Sign In
                  </Link>
                </div>
              </CardFooter>
            </form>
          </div>
        )}
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center p-8">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
