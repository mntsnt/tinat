"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Users,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Activity,
  Coins,
  Clock,
  Building2,
} from "lucide-react";
import { TinatLogo } from "../components/ui/TinatLogo";
import { GoogleAuthButton } from "../components/GoogleAuthButton";

interface PublicStudyShowcase {
  id: string;
  category: string;
  title: string;
  institution: string;
  rewardCredits: number;
  durationMinutes: number;
  participantsCount: number;
  targetCount: number;
  eligibility: string;
  highlights: string[];
}

const FEATURED_PUBLIC_STUDIES: PublicStudyShowcase[] = [
  {
    id: "study-1",
    category: "Cardiovascular & Epidemiology",
    title: "Community Hypertension Screening & Lifestyle Registry",
    institution: "Addis Ababa Health Sciences Institute",
    rewardCredits: 25,
    durationMinutes: 8,
    participantsCount: 420,
    targetCount: 500,
    eligibility: "Adults aged 25–65 in urban & peri-urban health centers",
    highlights: ["Institutional Ethics Approved", "Instant TC payout upon verification", "Confidential & secure"],
  },
  {
    id: "study-2",
    category: "Maternal & Child Health",
    title: "Postnatal Nutrition Monitoring & Clinical Care Tracker",
    institution: "Regional Health Bureau & Clinical Partners",
    rewardCredits: 35,
    durationMinutes: 12,
    participantsCount: 285,
    targetCount: 300,
    eligibility: "Mothers within first 12 months postnatal with clinic follow-up",
    highlights: ["Maternal care protocol", "Clinical oversight", "Field collector supported"],
  },
  {
    id: "study-3",
    category: "Health Informatics & Access",
    title: "Digital Tele-triage Adoption & Primary Clinic Utilization",
    institution: "Health Innovation Research Alliance",
    rewardCredits: 20,
    durationMinutes: 6,
    participantsCount: 860,
    targetCount: 1000,
    eligibility: "Primary care clinic visitors & mobile health users",
    highlights: ["Direct health policy impact", "Instant verification", "Zero third-party data sharing"],
  },
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role")?.toUpperCase();

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

  // Active public study index in showcase
  const [activeStudyIndex, setActiveStudyIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStudyIndex((prev) => (prev + 1) % FEATURED_PUBLIC_STUDIES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

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
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 1: ROLE SELECTION SCREEN ("Join Tinat")
  // ─────────────────────────────────────────────────────────────
  if (selectedRole === "CHOOSE") {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 md:p-10">
        {/* Top Header Logo */}
        <header className="flex justify-center pt-2 sm:pt-4">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <TinatLogo size={24} showText variant="color" />
          </Link>
        </header>

        {/* Center Cards Container */}
        <div className="max-w-4xl w-full mx-auto my-auto py-8 sm:py-12 space-y-8 sm:space-y-12">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Join Tinat
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Select how you would like to participate in the health research ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card 1: Researcher */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground">
                    Sign up as a researcher
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Find verified participants, assign field data collectors, and administer clinical and public health research.
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => setSelectedRole("RESEARCHER")}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  Start recruiting <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 2: Participant */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-teal-500/50 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground">
                    Sign up as a participant
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Share your health insights, participate in ethical studies, and earn Tinat Credits (TC) rewards.
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => setSelectedRole("PARTICIPANT")}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm border border-border bg-background hover:bg-muted text-foreground transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  Browse studies <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Login Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
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

  // ─────────────────────────────────────────────────────────────
  // STEP 2: SPLIT SCREEN REGISTRATION
  // ─────────────────────────────────────────────────────────────
  const isParticipant = selectedRole === "PARTICIPANT";
  const currentStudy = FEATURED_PUBLIC_STUDIES[activeStudyIndex];
  const progressPercent = Math.min(
    100,
    Math.round((currentStudy.participantsCount / currentStudy.targetCount) * 100)
  );

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ── LEFT COLUMN: FORM ── */}
      <div className="flex-1 flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-20 py-8 lg:py-12 max-w-2xl w-full mx-auto lg:mx-0">
        <div>
          {/* Header & Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <TinatLogo size={24} showText variant="color" />
            </Link>
            <button
              type="button"
              onClick={() => setSelectedRole("CHOOSE")}
              className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isParticipant ? "Sign up to participate" : "Sign up to research"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isParticipant
                ? "Contribute to verified health research and earn Tinat Credits for your insights."
                : "Recruit verified participants, coordinate data collectors, and manage studies."}
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First & Last Name side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">First name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  autoComplete="given-name"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Last name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  autoComplete="family-name"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
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
            <div className="pt-2">
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
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="pt-3">
              <GoogleAuthButton
                role={selectedRole}
                label={`Continue with Google as ${isParticipant ? "Participant" : "Researcher"}`}
              />
            </div>
          </form>

          {/* Bottom Switch Links */}
          <div className="mt-8 pt-6 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
            <div>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
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
        <footer className="pt-8 text-xs text-muted-foreground">
          &copy; Tinat {new Date().getFullYear()} &bull; Research Ecosystem
        </footer>
      </div>

      {/* ── RIGHT COLUMN: PUBLIC STUDIES SHOWCASE & RESEARCH NETWORK ── */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-emerald-950 via-zinc-950 to-teal-950 p-10 xl:p-14 flex-col justify-between text-white border-l border-emerald-900/30 overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top tag */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300 backdrop-blur-md">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Tinat Research Network &bull; Public Studies
          </div>
          <span className="text-[11px] font-medium text-emerald-400/80">
            Verified Health Research
          </span>
        </div>

        {/* Center Study Card Showcase */}
        <div className="relative z-10 my-auto py-6 max-w-lg mx-auto w-full space-y-6 animate-in fade-in duration-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-400/15 text-emerald-300 border border-emerald-400/20">
                {currentStudy.category}
              </span>
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{currentStudy.durationMinutes} mins
              </span>
            </div>

            <h3 className="text-xl xl:text-2xl font-bold text-white tracking-tight leading-snug">
              {currentStudy.title}
            </h3>

            <p className="text-xs text-white/70 flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {currentStudy.institution}
            </p>
          </div>

          {/* Featured Study Box */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-white/60 font-semibold block">
                  Participant Reward
                </span>
                <span className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  {currentStudy.rewardCredits} TC
                  <span className="text-xs font-normal text-white/60">(Tinat Credits)</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-white/60 font-semibold block">
                  Enrolled
                </span>
                <span className="text-sm font-semibold text-white">
                  {currentStudy.participantsCount} / {currentStudy.targetCount}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-white/60">
                <span>Target Progress</span>
                <span className="font-semibold text-emerald-400">
                  {progressPercent}% Complete
                </span>
              </div>
            </div>

            {/* Criteria */}
            <div className="rounded-xl bg-white/[0.03] p-3 border border-white/5 space-y-1">
              <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wide block">
                Target Criteria
              </span>
              <p className="text-xs text-white/90 leading-relaxed">
                {currentStudy.eligibility}
              </p>
            </div>

            {/* Key Highlights */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              {currentStudy.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Study Switcher Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {FEATURED_PUBLIC_STUDIES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveStudyIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeStudyIndex === idx ? "w-7 bg-emerald-400" : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Show study ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveStudyIndex(
                    (prev) => (prev - 1 + FEATURED_PUBLIC_STUDIES.length) % FEATURED_PUBLIC_STUDIES.length
                  )
                }
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
                aria-label="Previous study"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/60 font-medium">
                {activeStudyIndex + 1} of {FEATURED_PUBLIC_STUDIES.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveStudyIndex((prev) => (prev + 1) % FEATURED_PUBLIC_STUDIES.length)
                }
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
                aria-label="Next study"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance Bar */}
        <div className="relative z-10 border-t border-white/10 pt-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-base font-bold text-white tracking-tight">15,400+</div>
            <div className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Responses Logged</div>
          </div>
          <div className="border-x border-white/10">
            <div className="text-base font-bold text-emerald-400 tracking-tight">100%</div>
            <div className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Ethics Compliant</div>
          </div>
          <div>
            <div className="text-base font-bold text-teal-300 tracking-tight">0%</div>
            <div className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Third-Party Data Sale</div>
          </div>
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
