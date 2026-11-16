"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Users,
  Eye,
  EyeOff,
  ChevronLeft,
  ArrowRight,
  Loader2,
  Coins,
  Clock,
} from "lucide-react";
import { TinatLogo } from "../components/ui/TinatLogo";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { getSafeInternalRedirectPath } from "@/lib/safeRedirect";

const EXAMPLE_STUDY: {
  category: string;
  title: string;
  rewardCredits: number;
  durationMinutes: number;
  eligibility: string;
} = {
  category: "Community health",
  title: "Community blood pressure survey",
  rewardCredits: 25,
  durationMinutes: 8,
  eligibility: "Adults aged 25–65 living in the study area.",
};

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role")?.toUpperCase();
  const redirectTarget = getSafeInternalRedirectPath(searchParams.get("redirect"));

  const [selectedRole, setSelectedRole] = useState<"CHOOSE" | "PARTICIPANT" | "RESEARCHER">(
    initialRoleParam === "RESEARCHER"
      ? "RESEARCHER"
      : initialRoleParam === "PARTICIPANT"
      ? "PARTICIPANT"
      : "CHOOSE"
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!agreed) {
      setError("Please agree to Tinat's Terms and conditions and Privacy Policy to continue.");
      return;
    }

    setSubmitting(true);

    try {
      const roleToSend = selectedRole === "RESEARCHER" ? "RESEARCHER" : "PARTICIPANT";
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: email.trim().toLowerCase(),
          password,
          role: roleToSend,
          termsAccepted: true,
          optionalContactConsent: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed. Please check your details.");
      }

      // Automatically forward to email verification
      const verificationParams = new URLSearchParams({
        email: email.trim().toLowerCase(),
      });
      if (redirectTarget) verificationParams.set("redirect", redirectTarget);
      router.push(`/verify-email?${verificationParams.toString()}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  // Role selection
  if (selectedRole === "CHOOSE") {
    return (
      <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background flex flex-col justify-between p-4 sm:p-6 md:p-8">
        {/* Top Header Logo */}
        <header className="flex justify-center pt-2 sm:pt-4">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <TinatLogo size={26} showText variant="color" />
          </Link>
        </header>

        {/* Center Cards Container */}
        <div className="max-w-4xl w-full mx-auto my-auto py-6 sm:py-8 space-y-6 sm:space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Join Tinat
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Choose how you want to take part in health research.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card 1: Researcher */}
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:border-emerald-600/50 transition-colors">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-muted text-foreground flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground">
                    Sign up as a researcher
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Create and manage health studies, recruit participants, and coordinate data collection.
                  </p>
                </div>
              </div>

              <div className="pt-6 sm:pt-8">
                <button
                  type="button"
                  onClick={() => setSelectedRole("RESEARCHER")}
                  className="w-full py-3 px-5 rounded-lg font-semibold text-sm bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2"
                >
                  Continue as researcher <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 2: Participant */}
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:border-emerald-600/50 transition-colors">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-muted text-foreground flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground">
                    Sign up as a participant
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Find studies that interest you, share your perspective, and earn credits for eligible responses.
                  </p>
                </div>
              </div>

              <div className="pt-6 sm:pt-8">
                <button
                  type="button"
                  onClick={() => setSelectedRole("PARTICIPANT")}
                  className="w-full py-3 px-5 rounded-lg font-semibold text-sm border border-border hover:bg-muted text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  Continue as participant <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Login Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : "/login"}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <footer className="text-center pb-2 text-xs text-muted-foreground">
          &copy; Tinat {new Date().getFullYear()} &bull; Research Ecosystem
        </footer>
      </div>
    );
  }

  // Registration form
  const isParticipant = selectedRole === "PARTICIPANT";
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background flex flex-col lg:flex-row">
      {/* ── LEFT COLUMN: FORM (Smooth internal scrolling on desktop) ── */}
      <div className="flex-1 flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-20 py-8 lg:py-10 max-w-2xl w-full mx-auto lg:mx-0 lg:h-full lg:overflow-y-auto lg:[scrollbar-gutter:stable]">
        <div>
          {/* Header & Logo */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <TinatLogo size={24} showText variant="color" />
            </Link>
            <button
              type="button"
              onClick={() => setSelectedRole("CHOOSE")}
              className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Change role</span>
            </button>
          </div>

          {/* Title & Role Indicator */}
          <div className="space-y-2 mb-6 sm:mb-8">
            <span className="text-xs font-medium text-muted-foreground">
              {isParticipant ? "Participant Registration" : "Researcher Registration"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isParticipant ? "Sign up to participate" : "Sign up to research"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isParticipant
                ? "Contribute to verified health research and earn Tinat Credits for your insights."
                : "Recruit verified participants, coordinate data collectors, and administer studies."}
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First & Last Name side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="first-name" className="text-xs font-semibold text-foreground/90">First name *</label>
                <input
                  id="first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  autoComplete="given-name"
                  className="w-full h-11 rounded-lg border border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="last-name" className="text-xs font-semibold text-foreground/90">Last name *</label>
                <input
                  id="last-name"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  autoComplete="family-name"
                  className="w-full h-11 rounded-lg border border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="registration-email" className="text-xs font-semibold text-foreground/90">Email *</label>
              <input
                id="registration-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full h-11 rounded-lg border border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="registration-password" className="text-xs font-semibold text-foreground/90">Password *</label>
              <div className="relative">
                <input
                  id="registration-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full h-11 rounded-lg border border-input bg-background px-3.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">Must be at least 8 characters.</p>
            </div>

            {/* Agreement Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input text-emerald-600 focus:ring-emerald-500/30"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to Tinat&apos;s{" "}
                  <Link href="/terms" target="_blank" className="font-medium text-foreground underline underline-offset-2">
                    Terms and conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="font-medium text-foreground underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            {/* Continue Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 px-6 rounded-lg font-semibold text-sm bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>

            {/* Google Alternative */}
            <div className="pt-2">
              <GoogleAuthButton
                role={selectedRole}
                redirect={redirectTarget || undefined}
                label={`Continue with Google as ${isParticipant ? "Participant" : "Researcher"}`}
              />
            </div>
          </form>

          {/* Bottom Switch Links */}
          <div className="mt-6 pt-5 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
            <div>
              Already have an account?{" "}
              <Link
                href={redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : "/login"}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Log in
              </Link>
            </div>
            <div>
              {isParticipant ? (
                <>
                  Not a participant?{" "}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("RESEARCHER")}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Sign up as a researcher
                  </button>
                </>
              ) : (
                <>
                  Not a researcher?{" "}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("PARTICIPANT")}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Sign up as a participant
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <footer className="pt-6 pb-2 text-xs text-muted-foreground">
          &copy; Tinat {new Date().getFullYear()} &bull; Research Ecosystem
        </footer>
      </div>

      {/* Example study preview */}
      <div className="hidden lg:flex flex-1 items-center justify-center border-l border-border bg-muted/30 p-10 xl:p-14">
        <div className="w-full max-w-lg space-y-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Example study</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              A preview of a study listing
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This sample shows the kind of details a study may include.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{EXAMPLE_STUDY.category}</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{EXAMPLE_STUDY.title}</h3>
              </div>
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                Sample
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <p className="text-xs text-muted-foreground">Estimated time</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {EXAMPLE_STUDY.durationMinutes} minutes
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Example reward</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  {EXAMPLE_STUDY.rewardCredits} TC
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground">Who can take part</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{EXAMPLE_STUDY.eligibility}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Sample information only. Actual study details, eligibility, and rewards vary.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
