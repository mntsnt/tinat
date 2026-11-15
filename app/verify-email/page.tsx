"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { AuthStepper } from "../components/auth/AuthStepper";
import { TinatLogo } from "../components/ui/TinatLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { getSafeInternalRedirectPath } from "@/lib/safeRedirect";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const redirectTarget = getSafeInternalRedirectPath(searchParams.get("redirect"));
  const loginHref = redirectTarget
    ? `/login?redirect=${encodeURIComponent(redirectTarget)}`
    : "/login";
  const tokenParam = searchParams.get("token") || "";
  const statusParam = searchParams.get("status") || "";
  const deliveryWarningParam = searchParams.get("deliveryWarning") === "1";
  const autoVerificationToken = useRef<string | null>(null);

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [deliveryWarning, setDeliveryWarning] = useState(deliveryWarningParam);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState(() => {
    if (statusParam === "expired") {
      return "This verification link has expired. Request a fresh code to continue.";
    }
    if (statusParam === "invalid") {
      return "This verification link is not valid. Request a fresh code to continue.";
    }
    if (statusParam === "error") {
      return "We couldn’t verify your email just now. Please try again.";
    }
    return "";
  });
  const [success, setSuccess] = useState(statusParam === "success");
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    if (emailParam && !email) setEmail(emailParam);
  }, [emailParam, email]);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (statusParam === "success") {
      setSuccess(true);
      return;
    }

    if (!tokenParam || autoVerificationToken.current === tokenParam) return;

    autoVerificationToken.current = tokenParam;
    setTokenVerifying(true);
    setError("");
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
          setError(data.error || "This verification link is not valid. Request a fresh code to continue.");
        }
      })
      .catch(() => {
        setError("We couldn’t reach Tinat just now. Check your connection and try again.");
      })
      .finally(() => {
        setTokenVerifying(false);
      });
  }, [tokenParam, statusParam]);

  // Handle countdown for resend button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Verification does not create an authenticated session, so continue to sign-in.
  useEffect(() => {
    if (success) {
      if (redirectCountdown > 0) {
        const timer = setTimeout(() => setRedirectCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        router.replace(loginHref);
      }
    }
  }, [success, redirectCountdown, router, loginHref]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !code.trim()) {
      setError("Please provide both your email and the 6-digit code.");
      return;
    }

    setError("");
    setResendSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "That code couldn’t be verified. Check it and try again.");
        return;
      }

      setResendSuccess(false);
      setSuccess(true);
    } catch {
      setError("We couldn’t reach Tinat just now. Check your connection and try again.");
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
    setResendSuccess(false);
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

      if (data.isVerified) {
        setSuccess(true);
        return;
      }

      setCooldown(60);
      setResendSuccess(true);
      setDeliveryWarning(false);
    } catch {
      setError("We couldn’t reach Tinat just now. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-emerald-50/70 via-background to-background dark:from-emerald-950/20">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-emerald-900/[0.06] dark:border-emerald-100/[0.06]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-36 h-[28rem] w-[28rem] rounded-full border border-emerald-900/[0.06] dark:border-emerald-100/[0.06]" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <TinatLogo size={30} showText variant="color" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-700/15 bg-background/70 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-300/20 dark:text-emerald-300 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure account verification
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 px-4 pb-10 pt-2 sm:px-6 lg:min-h-[calc(100vh-78px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-8">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <MailCheck className="h-4 w-4" />
            YOUR ACCOUNT, ONE LAST STEP
          </div>
          <h1 className="mt-6 max-w-lg text-4xl font-bold leading-tight tracking-tight text-foreground xl:text-5xl">
            A quick check before you begin.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
            Verify your email to secure your account and continue to Tinat&apos;s health research community.
          </p>

          <div className="mt-8 rounded-2xl border border-border/80 bg-card/90 p-5 shadow-lg shadow-emerald-950/[0.04]">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Your six-digit code</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Enter the code from your Tinat email. If it&apos;s not in your inbox, check spam or request another one.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Your verification code should only be entered on Tinat.
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-xl">
          <Card className="overflow-hidden rounded-2xl border-border/80 bg-card/95 shadow-xl shadow-emerald-950/[0.07]">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />

            {!success && (
              <div className="px-5 pt-5 sm:px-8 sm:pt-6">
                <AuthStepper currentStep={3} />
              </div>
            )}

            {tokenVerifying && !success ? (
              <div role="status" className="px-6 py-14 text-center sm:px-10">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </span>
                <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">
                  Confirming your email
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  We&apos;re checking your secure verification link. This should only take a moment.
                </p>
              </div>
            ) : success ? (
              <div>
                <CardHeader className="items-center px-6 pb-3 pt-9 text-center sm:px-10">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-9 w-9" />
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Email confirmed
                  </span>
                  <CardTitle className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    You&apos;re all set.
                  </CardTitle>
                  <CardDescription className="max-w-sm text-sm leading-6 text-muted-foreground">
                    Your email is verified. Continue to sign in and get started with Tinat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pt-2 sm:px-10">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-[width] duration-1000 ease-linear dark:bg-emerald-400"
                      style={{ width: `${((3 - redirectCountdown) / 3) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Continuing to sign in in {redirectCountdown} seconds
                  </p>
                </CardContent>
                <CardFooter className="flex-col px-6 pb-8 pt-5 sm:px-10">
                  <Button
                    onClick={() => router.replace(loginHref)}
                    className="h-11 w-full rounded-xl"
                  >
                    Continue to sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </div>
            ) : (
              <div>
                <CardHeader className="items-start px-6 pb-4 pt-5 text-left sm:px-8">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MailCheck className="h-5 w-5" />
                  </span>
                  <CardTitle className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    Verify your email
                  </CardTitle>
                  <CardDescription className="max-w-md text-sm leading-6 text-muted-foreground">
                    Enter the six-digit code we sent you to confirm your address and continue setting up your Tinat account.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleVerify}>
                  <CardContent className="space-y-5 px-6 sm:px-8">
                    {deliveryWarning && (
                      <div role="status" className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-sm text-amber-800 dark:text-amber-300">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="leading-5">
                          Tinat couldn&apos;t deliver your first email yet. Check your spam folder, or request a new code below.
                        </p>
                      </div>
                    )}

                    {resendSuccess && (
                      <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 text-sm text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="leading-5">A fresh verification code is on its way to your inbox.</p>
                      </div>
                    )}

                    {error && (
                      <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="leading-5">{error}</p>
                      </div>
                    )}

                    <Input
                      label="Email address"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 rounded-xl"
                    />

                    <div>
                      <label htmlFor="verification-code" className="mb-1.5 block text-sm font-medium text-foreground">
                        Verification code
                      </label>
                      <input
                        id="verification-code"
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        aria-describedby="verification-code-help"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        className="flex h-14 w-full rounded-xl border border-input bg-background px-3 py-2 text-center font-mono text-2xl font-bold tracking-[0.65em] text-foreground placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                        required
                      />
                      <p id="verification-code-help" className="mt-2 text-xs leading-5 text-muted-foreground">
                        Enter the six numbers from your email.
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter className="flex-col gap-5 px-6 pb-7 pt-1 sm:px-8">
                    <Button type="submit" className="h-11 w-full rounded-xl" isLoading={loading}>
                      {loading ? "Verifying..." : "Verify email"}
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>

                    <div className="flex w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-sm text-muted-foreground">
                      <span>Didn&apos;t receive a code?</span>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || cooldown > 0}
                        className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                      >
                        {resending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Send a new code"}
                      </button>
                    </div>

                    <div className="w-full border-t border-border pt-4 text-center">
                      <Link href={loginHref} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        Back to sign in
                      </Link>
                    </div>
                  </CardFooter>
                </form>
              </div>
            )}
          </Card>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Need a hand?{" "}
            <a href="mailto:contact.tinatapp@gmail.com" className="font-medium text-primary hover:underline">
              Contact Tinat support
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div role="status" className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Preparing secure verification...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
