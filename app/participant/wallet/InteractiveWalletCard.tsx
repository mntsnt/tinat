"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Sparkles, Wifi, ShieldCheck, RefreshCw, Copy, Check } from "lucide-react";
import { formatCredits } from "@/lib/config/features";

interface InteractiveWalletCardProps {
  balance: number;
  cardMemberId: string;
  userName: string;
  isCollector?: boolean;
}

export function InteractiveWalletCard({
  balance,
  cardMemberId,
  userName,
  isCollector = false,
}: InteractiveWalletCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  // 3D Tilt & lighting state
  const [transformStyle, setTransformStyle] = useState<React.CSSProperties>({
    transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 30px -5px rgba(16, 185, 129, 0.2)",
  });

  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });

  const [rainbowAngle, setRainbowAngle] = useState(135);

  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const width = rect.width;
      const height = rect.height;

      // Normalized coordinates from center: -0.5 to +0.5
      const normX = (mouseX / width) - 0.5;
      const normY = (mouseY / height) - 0.5;

      // Realistic tilt limits: up to ~14deg
      const maxTilt = 14;
      const rotX = -normY * maxTilt;
      const rotY = normX * maxTilt;

      // Base flip rotation: if flipped, add 180deg
      const baseRotY = isFlipped ? 180 : 0;
      const finalRotY = baseRotY + (isFlipped ? -rotY : rotY);

      // Light reflection & glare coordinates (percentage)
      const glareX = (mouseX / width) * 100;
      const glareY = (mouseY / height) * 100;

      // Dynamic shadow reacting against tilt angle
      const shadowX = -normX * 30;
      const shadowY = Math.max(15, 20 + normY * 25);

      // Calculate angle of light for holographic foil
      const angle = Math.round(Math.atan2(mouseY - height / 2, mouseX - width / 2) * (180 / Math.PI) + 180);

      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        setTransformStyle({
          transform: `perspective(1200px) rotateX(${rotX.toFixed(2)}deg) rotateY(${finalRotY.toFixed(2)}deg) scale3d(1.035, 1.035, 1.035)`,
          transition: "transform 0.08s ease-out, box-shadow 0.08s ease-out",
          boxShadow: `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px 45px -5px rgba(0, 0, 0, 0.75), 0 0 45px -5px rgba(16, 185, 129, 0.35)`,
        });

        setGlareStyle({
          opacity: 1,
          background: `radial-gradient(circle at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.08) 40%, transparent 75%)`,
        });

        setRainbowAngle(angle);
      });
    },
    [isFlipped]
  );

  const handleMouseEnter = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);

    const baseRotY = isFlipped ? 180 : 0;
    setTransformStyle({
      transform: `perspective(1200px) rotateX(0deg) rotateY(${baseRotY}deg) scale3d(1, 1, 1)`,
      transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 30px -5px rgba(16, 185, 129, 0.2)",
    });

    setGlareStyle({
      opacity: 0,
      transition: "opacity 0.6s ease-out",
    });
  }, [isFlipped]);

  // Update transform when flip state changes
  useEffect(() => {
    const baseRotY = isFlipped ? 180 : 0;
    setTransformStyle((prev) => ({
      ...prev,
      transform: `perspective(1200px) rotateX(0deg) rotateY(${baseRotY}deg) scale3d(1, 1, 1)`,
      transition: "transform 0.7s cubic-bezier(0.2, 0.85, 0.32, 1.2), box-shadow 0.7s ease-out",
    }));
  }, [isFlipped]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only flip if not clicking a button
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    setIsFlipped((prev) => !prev);
  };

  const handleCopyCardNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`•••• •••• •••• ${cardMemberId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Perspective Card Wrapper */}
      <div
        className="w-full max-w-[430px] aspect-[1.586/1] cursor-pointer select-none group"
        style={{ perspective: "1200px" }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
      >
        {/* Animated 3D Card Shell */}
        <div
          ref={cardRef}
          className="relative w-full h-full rounded-2xl text-white overflow-hidden border border-emerald-500/35 bg-[#07130e]"
          style={{
            ...transformStyle,
            transformStyle: "preserve-3d",
            willChange: "transform, box-shadow",
          }}
        >
          {/* ============================================================== */}
          {/* FRONT FACE                                                     */}
          {/* ============================================================== */}
          <div
            className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Deep Obsidian-Emerald Multi-Stop Metallic Background */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0e2119] via-[#081812] to-[#030907]"
            />

            {/* Glowing Accent Orbs */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"
            />

            {/* Micro Circuit Trace Pattern */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]"
            />

            {/* Dynamic Holographic Foil Overlay (shifts with mouse movement angle) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-20 mix-blend-color-dodge transition-opacity duration-300"
              style={{
                backgroundImage: `linear-gradient(${rainbowAngle}deg, rgba(52, 211, 153, 0.25) 0%, rgba(56, 189, 248, 0.2) 25%, rgba(232, 121, 249, 0.2) 50%, rgba(251, 191, 36, 0.25) 75%, rgba(52, 211, 153, 0.25) 100%)`,
              }}
            />

            {/* Interactive Dynamic Specular Glare Layer */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-200"
              style={glareStyle}
            />

            {/* Ambient Metallic Edge Sheen */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)]"
            />

            {/* ----------------- FRONT CONTENT (3D PARALLAX LAYERS) ----------------- */}

            {/* Header: Tinat Pass Brand & Contactless Symbol */}
            <div
              className="relative z-10 flex items-center justify-between"
              style={{ transform: "translateZ(26px)" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-xs">
                  <Sparkles className="h-4 w-4 text-emerald-300 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black tracking-[0.25em] text-white">TINAT</p>
                  <p className="text-[8.5px] uppercase tracking-wider text-emerald-400 font-semibold leading-none mt-0.5">
                    {isCollector ? "Field Contributor Pass" : "Health Contributor Pass"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-300/80 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Verified
                </span>
                <Wifi className="h-4 w-4 rotate-90 text-white/80" />
              </div>
            </div>

            {/* EMV Microchip & Available Balance */}
            <div
              className="relative z-10 my-auto flex items-center justify-between py-2"
              style={{ transform: "translateZ(32px)" }}
            >
              {/* Luxury EMV Microchip with Real Circuit Lines */}
              <div className="relative h-9 w-12 sm:h-10 sm:w-13 rounded-md bg-gradient-to-br from-[#ffe599] via-[#fcd34d] to-[#d97706] p-1 shadow-md border border-amber-200/80 flex flex-col justify-between">
                <div className="w-full h-px bg-amber-900/45" />
                <div className="flex justify-between items-center px-0.5">
                  <div className="w-2.5 h-2.5 rounded-xs border border-amber-900/45 bg-amber-400/30" />
                  <div className="w-2 h-2 rounded-full border border-amber-900/45" />
                  <div className="w-2.5 h-2.5 rounded-xs border border-amber-900/45 bg-amber-400/30" />
                </div>
                <div className="w-full h-px bg-amber-900/45" />
              </div>

              {/* Balance Display */}
              <div className="text-right">
                <p className="text-[9.5px] uppercase tracking-wider text-emerald-400 font-bold">
                  Available Balance
                </p>
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono drop-shadow-md">
                  {formatCredits(balance)}{" "}
                  <span className="text-xs font-bold text-emerald-400">TC</span>
                </p>
              </div>
            </div>

            {/* Card Number & Copy */}
            <div
              className="relative z-10 flex items-center justify-between"
              style={{ transform: "translateZ(24px)" }}
            >
              <p className="font-mono text-sm sm:text-base tracking-[0.22em] text-white/95 font-medium drop-shadow-xs">
                •••• •••• •••• {cardMemberId}
              </p>

              <button
                type="button"
                onClick={handleCopyCardNumber}
                title="Copy Card ID"
                className="opacity-70 hover:opacity-100 transition-opacity p-1 text-white/80 hover:text-white"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Footer: Cardholder, Valid Date, and Mastercard Circles */}
            <div
              className="relative z-10 flex items-end justify-between pt-1"
              style={{ transform: "translateZ(28px)" }}
            >
              <div className="min-w-0 pr-2">
                <p className="text-[8px] uppercase tracking-wider text-white/50 font-medium">
                  Cardholder
                </p>
                <p className="text-xs font-bold tracking-wider uppercase text-white truncate max-w-[170px] drop-shadow-xs">
                  {userName}
                </p>
              </div>

              <div className="text-center px-2">
                <p className="text-[8px] uppercase tracking-wider text-white/50 font-medium">
                  Valid Thru
                </p>
                <p className="text-xs font-mono font-bold text-white drop-shadow-xs">12/28</p>
              </div>

              {/* Luxury Mastercard-Style Interlocking Glossy Circles */}
              <div className="flex items-center -space-x-3 shrink-0">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-500/95 shadow-lg border border-emerald-300/30" />
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-teal-300/90 mix-blend-screen shadow-lg border border-teal-200/40" />
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* BACK FACE (180deg FLIPPED)                                     */}
          {/* ============================================================== */}
          <div
            className="absolute inset-0 flex flex-col justify-between overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Deep Obsidian Background */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-[#0a1813] via-[#05110d] to-[#020605]"
            />

            {/* Dynamic Specular Glare on Back */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-200"
              style={glareStyle}
            />

            {/* Top Spacer / Magnetic Stripe */}
            <div className="w-full pt-6">
              {/* Realistic Black Magnetic Stripe */}
              <div className="w-full h-10 sm:h-11 bg-gradient-to-r from-neutral-900 via-black to-neutral-900 border-y border-white/10 shadow-inner" />
            </div>

            {/* Signature Strip & CVV Section */}
            <div className="px-5 sm:px-6 space-y-3" style={{ transform: "translateZ(20px)" }}>
              <div className="flex items-center gap-3">
                {/* White Signature Panel */}
                <div className="flex-1 h-8 bg-neutral-100 rounded-sm flex items-center justify-between px-3 text-neutral-800 shadow-inner overflow-hidden border border-neutral-300">
                  <span className="font-serif italic text-xs text-neutral-600 tracking-wider truncate">
                    {userName}
                  </span>
                  <div className="flex gap-1 opacity-20">
                    <div className="w-2 h-4 bg-neutral-400 rotate-12" />
                    <div className="w-2 h-4 bg-neutral-400 rotate-12" />
                    <div className="w-2 h-4 bg-neutral-400 rotate-12" />
                  </div>
                </div>

                {/* CVV Security Box */}
                <div className="w-12 h-8 rounded-sm bg-neutral-900 border border-emerald-500/40 flex flex-col items-center justify-center">
                  <span className="text-[7.5px] uppercase text-emerald-400 font-bold leading-none">
                    CVV
                  </span>
                  <span className="font-mono text-xs font-black tracking-widest text-white">
                    742
                  </span>
                </div>
              </div>

              {/* Security and Network Disclaimers */}
              <p className="text-[8px] leading-relaxed text-neutral-400/80">
                This digital pass certifies active participation in verified Ethiopian clinical studies and health research. Issued by Tinat Health Network.
              </p>
            </div>

            {/* Back Footer */}
            <div
              className="px-5 sm:px-6 pb-4 sm:pb-5 flex items-center justify-between text-neutral-400"
              style={{ transform: "translateZ(18px)" }}
            >
              <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Encrypted &bull; 256-bit Token</span>
              </div>
              <span className="text-[9px] font-mono text-neutral-400">
                tinat.et
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Flip Hint Button */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => setIsFlipped((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-foreground hover:bg-muted hover:border-emerald-500/40 transition-all shadow-xs"
        >
          <RefreshCw className={`h-3 w-3 text-emerald-500 transition-transform duration-500 ${isFlipped ? "rotate-180" : ""}`} />
          <span>{isFlipped ? "Flip to Front" : "Click to Flip Card"}</span>
        </button>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          &bull; Move cursor to tilt in 3D
        </span>
      </div>
    </div>
  );
}
