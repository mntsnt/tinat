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
  Star,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { TinatLogo } from "../components/ui/TinatLogo";
import { GoogleAuthButton } from "../components/GoogleAuthButton";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  initials: string;
  avatarColor: string;
}

const PARTICIPANT_TESTIMONIALS: Testimonial[] = [
  {
    quote: "It's a cool way of spending quality time and earn some money as well as helping to shape decisions.",
    author: "Lori Bryson",
    role: "Health Contributor",
    initials: "LB",
    avatarColor: "bg-emerald-600",
  },
  {
    quote: "Contributing to real university medical studies in Ethiopia from my phone while earning Tinat Credits is super rewarding.",
    author: "Amanuel Tadesse",
    role: "Verified Contributor",
    initials: "AT",
    avatarColor: "bg-teal-600",
  },
  {
    quote: "The studies are well designed, safe, and confidential. It feels great to make a difference in African health research.",
    author: "Selamawit Desta",
    role: "Community Participant",
    initials: "SD",
    avatarColor: "bg-indigo-600",
  },
];

const RESEARCHER_TESTIMONIALS: Testimonial[] = [
  {
    quote: "Recruiting verified participants across clinical centers and tracking real-time field data saved us months of research time.",
    author: "Dr. Meron Kebede",
    role: "Principal Investigator",
    initials: "MK",
    avatarColor: "bg-indigo-600",
  },
  {
    quote: "The ability to assign field data collectors with full ethics compliance and verify entries instantly revolutionized our workflow.",
    author: "Ermias Haile",
    role: "Clinical Epidemiology Lead",
    initials: "EH",
    avatarColor: "bg-teal-600",
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

  // Testimonial Carousel State
  const [activeSlide, setActiveSlide] = useState(0);
  const testimonials =
    selectedRole === "RESEARCHER" ? RESEARCHER_TESTIMONIALS : PARTICIPANT_TESTIMONIALS;

  useEffect(() => {
    setActiveSlide(0);
  }, [selectedRole]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

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
            <TinatLogo size={36} showText variant="color" />
          </Link>
        </header>

        {/* Center Cards Container */}
        <div className="max-w-4xl w-full mx-auto my-auto py-8 sm:py-12 space-y-8 sm:space-y-12">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Join Tinat
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Select how you would like to participate in the research ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card 1: Researcher */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-primary/50 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground">
                    Sign up as a researcher
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Find the right participants, administer field studies, and run better research.
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => setSelectedRole("RESEARCHER")}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  Start recruiting <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 2: Participant */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground">
                    Sign up as a participant
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Share your expertise, take part in verified studies, and get paid for research opportunities.
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
              <Link href="/login" className="font-semibold text-primary hover:underline">
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
  // STEP 2: SPLIT SCREEN REGISTRATION (Respondent.io inspired)
  // ─────────────────────────────────────────────────────────────
  const isParticipant = selectedRole === "PARTICIPANT";

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ── LEFT COLUMN: FORM ── */}
      <div className="flex-1 flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-20 py-8 lg:py-12 max-w-2xl w-full mx-auto lg:mx-0">
        <div>
          {/* Header & Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <TinatLogo size={32} showText variant="color" />
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
                ? "Get paid for sharing valuable insights and help shape world-class health research."
                : "Find verified participants, administer field studies, and run better research."}
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
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
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
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
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
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
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
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
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
                  className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/40"
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
                className="w-full py-3 px-6 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
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
              <Link href="/login" className="font-semibold text-primary hover:underline">
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
                    className="font-semibold text-primary hover:underline"
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
                    className="font-semibold text-primary hover:underline"
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
          &copy; Tinat {new Date().getFullYear()}
        </footer>
      </div>

      {/* ── RIGHT COLUMN: TESTIMONIALS CAROUSEL ── */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 p-12 xl:p-16 flex-col justify-between text-white overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top tag */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide border border-white/10 text-white/90">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Health Research
          </div>
        </div>

        {/* Center Quote & Testimonial Card */}
        <div className="relative z-10 max-w-lg mx-auto w-full my-auto space-y-8 animate-in fade-in duration-300">
          {/* Star Rating */}
          <div className="flex items-center justify-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400" />
            ))}
          </div>

          {/* Testimonial Quote */}
          <blockquote className="text-xl xl:text-2xl font-medium text-center leading-relaxed text-white/95">
            &ldquo;{testimonials[activeSlide].quote}&rdquo;
          </blockquote>

          {/* Author info */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-2">
            <div className={`w-14 h-14 rounded-full ${testimonials[activeSlide].avatarColor} text-white font-bold text-lg flex items-center justify-center shadow-lg ring-4 ring-white/10`}>
              {testimonials[activeSlide].initials}
            </div>
            <div className="text-center">
              <p className="font-bold text-base text-white">{testimonials[activeSlide].author}</p>
              <p className="text-xs text-white/70 font-medium">{testimonials[activeSlide].role}</p>
            </div>
          </div>
        </div>

        {/* Carousel Dots & Controls */}
        <div className="relative z-10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() =>
              setActiveSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length)
            }
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  activeSlide === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev + 1) % testimonials.length)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
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
