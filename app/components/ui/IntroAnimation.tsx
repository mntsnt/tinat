"use client";

import { useEffect, useState } from "react";

interface IntroAnimationProps {
  /** Force the animation to play even if already seen in this session */
  force?: boolean;
}

export function IntroAnimation({ force = false }: IntroAnimationProps) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion && !force) return;

    // Show on root "/" landing, or if ?intro=true in URL, or on first session visit
    const hasSeen = sessionStorage.getItem("tinat_intro_seen");
    const urlParams = new URLSearchParams(window.location.search);
    const forceIntroParam = urlParams.get("intro") === "true" || urlParams.get("intro") === "1";

    if (!force && !forceIntroParam && hasSeen) {
      return;
    }

    // Mount intro animation
    setMounted(true);
    sessionStorage.setItem("tinat_intro_seen", "true");

    // Start exit after 1.5s
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1600);

    // Complete unmount after transition
    const unmountTimer = setTimeout(() => {
      setMounted(false);
    }, 2300);

    // Keydown or click dismisses early
    const handleDismiss = () => {
      setIsExiting(true);
      setTimeout(() => setMounted(false), 500);
    };

    window.addEventListener("keydown", handleDismiss, { once: true });

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
      window.removeEventListener("keydown", handleDismiss);
    };
  }, [force]);

  if (!mounted) return null;

  return (
    <div
      onClick={() => {
        setIsExiting(true);
        setTimeout(() => setMounted(false), 400);
      }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background select-none cursor-pointer transition-all duration-700 ease-out ${
        isExiting
          ? "opacity-0 scale-[1.04] blur-sm pointer-events-none"
          : "opacity-100 scale-100 blur-0"
      }`}
      aria-label="Tinat Loading Splash"
      role="status"
    >
      <div className="flex flex-col items-center justify-center -translate-y-4">
        {/* Tinat White "T" on Black Squircle Logo */}
        <div className="relative mb-5 flex items-center justify-center animate-scholarxiv-pulse">
          {/* Subtle ambient backglow */}
          <div className="absolute -inset-2 rounded-3xl bg-black/5 dark:bg-white/10 blur-xl transition-all" />
          
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl sm:rounded-3xl bg-[#09090b] text-white shadow-2xl border border-zinc-800/80 transition-transform">
            <span className="font-extrabold text-4xl sm:text-5xl tracking-tight select-none">
              T
            </span>
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Tinat
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase mt-1">
            Research Ecosystem
          </p>
        </div>

        {/* ScholarXIV-inspired Indeterminate Double-Beam Loader */}
        <div
          className="relative h-1 w-28 sm:w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          style={{ clipPath: "inset(0 round 9999px)" }}
        >
          <div className="absolute top-0 bottom-0 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-scholarxiv-long" />
          <div className="absolute top-0 bottom-0 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-scholarxiv-short" />
        </div>

        {/* Skip hint */}
        <p className="mt-8 text-[10px] text-muted-foreground/60 tracking-tight">
          Click anywhere or press any key to skip
        </p>
      </div>
    </div>
  );
}
