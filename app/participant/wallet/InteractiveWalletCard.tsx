"use client";

import React, { useRef, useState, useCallback } from "react";
import { Sparkles, Wifi, Copy, Check } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  // 3D Tilt & lighting state
  const [transformStyle, setTransformStyle] = useState<React.CSSProperties>({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 30px -5px rgba(16, 185, 129, 0.2)",
  });

  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
    background: "none",
  });

  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = rect.width;
    const height = rect.height;

    // Normalized coordinates from center: -0.5 to +0.5
    const normX = mouseX / width - 0.5;
    const normY = mouseY / height - 0.5;

    // Elegant, smooth tilt limits (up to ~12deg for a realistic luxury feel)
    const maxTilt = 12;
    const rotX = -normY * maxTilt;
    const rotY = normX * maxTilt;

    // Light reflection coordinates (percentage)
    const glareX = (mouseX / width) * 100;
    const glareY = (mouseY / height) * 100;

    // Dynamic shadow reacting opposite to tilt
    const shadowX = -normX * 25;
    const shadowY = Math.max(15, 20 + normY * 20);

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      setTransformStyle({
        transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`,
        transition: "transform 0.08s ease-out, box-shadow 0.08s ease-out",
        boxShadow: `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px 45px -5px rgba(0, 0, 0, 0.75), 0 0 35px -5px rgba(16, 185, 129, 0.3)`,
      });

      setGlareStyle({
        opacity: 1,
        background: `radial-gradient(circle at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.06) 40%, transparent 75%)`,
      });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);

    setTransformStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 30px -5px rgba(16, 185, 129, 0.2)",
    });

    setGlareStyle({
      opacity: 0,
      transition: "opacity 0.6s ease-out",
    });
  }, []);

  const handleCopyCardNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`•••• •••• •••• ${cardMemberId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex justify-center lg:justify-start">
      {/* 3D Perspective Card Container */}
      <div
        ref={cardRef}
        className="relative w-full max-w-[430px] aspect-[1.586/1] rounded-2xl p-5 sm:p-6 text-white overflow-hidden border border-emerald-500/35 bg-[#06140e] select-none cursor-default"
        style={{
          ...transformStyle,
          willChange: "transform, box-shadow",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Deep Obsidian-Emerald Multi-Stop Metallic Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0e241b] via-[#071711] to-[#020a06]"
        />

        {/* Glowing Ambient Accent Orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -bottom-16 h-60 w-60 rounded-full bg-teal-500/15 blur-3xl"
        />

        {/* Micro Texture Matrix Pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:18px_18px]"
        />

        {/* Dynamic Interactive Specular Glare Layer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-150 z-20"
          style={glareStyle}
        />

        {/* Ambient Top-Right Sheen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_65%)]"
        />

        {/* ----------------- PRISTINE SINGLE CARD CONTENT ----------------- */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          {/* 1. Header: Brand, Pass Type, Verified & Contactless Icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-xs">
                <Sparkles className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-black tracking-[0.25em] text-white">TINAT</p>
                <p className="text-[8.5px] uppercase tracking-wider text-emerald-400 font-semibold leading-none mt-0.5">
                  {isCollector ? "Field Contributor Pass" : "Health Contributor Pass"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Verified
              </span>
              <Wifi className="h-4 w-4 rotate-90 text-white/70" />
            </div>
          </div>

          {/* 2. Middle Row: EMV Microchip & Available Balance */}
          <div className="my-auto flex items-center justify-between py-2">
            {/* Luxury Golden EMV Microchip with Real Circuit Paths */}
            <div className="relative h-9 w-12 sm:h-10 sm:w-13 rounded-md bg-gradient-to-br from-[#ffe082] via-[#fbc02d] to-[#d97706] p-1 shadow-md border border-amber-200/70 flex flex-col justify-between shrink-0">
              <div className="w-full h-px bg-amber-950/40" />
              <div className="flex justify-between items-center px-0.5">
                <div className="w-2.5 h-2.5 rounded-xs border border-amber-950/40 bg-amber-300/30" />
                <div className="w-2 h-2 rounded-full border border-amber-950/40" />
                <div className="w-2.5 h-2.5 rounded-xs border border-amber-950/40 bg-amber-300/30" />
              </div>
              <div className="w-full h-px bg-amber-950/40" />
            </div>

            {/* Clear, High-Contrast Available Balance */}
            <div className="text-right">
              <p className="text-[9.5px] uppercase tracking-wider text-emerald-400 font-bold">
                Available Balance
              </p>
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono mt-0.5">
                {formatCredits(balance)}{" "}
                <span className="text-xs font-bold text-emerald-400">TC</span>
              </p>
            </div>
          </div>

          {/* 3. Card Number with Copy Action */}
          <div className="flex items-center justify-between pt-1">
            <p className="font-mono text-sm sm:text-base tracking-[0.25em] text-white/95 font-medium select-all">
              •••• •••• •••• {cardMemberId}
            </p>

            <button
              type="button"
              onClick={handleCopyCardNumber}
              title={copied ? "Copied" : "Copy card ID"}
              className="opacity-70 hover:opacity-100 transition-opacity p-1 text-white/80 hover:text-white"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* 4. Footer: Cardholder, Valid Thru, and Mastercard Interlocking Circles */}
          <div className="flex items-end justify-between pt-2">
            <div className="min-w-0 pr-2">
              <p className="text-[8px] uppercase tracking-wider text-white/50 font-medium">
                Cardholder
              </p>
              <p className="text-xs font-bold tracking-wider uppercase text-white truncate max-w-[160px] sm:max-w-[200px] mt-0.5">
                {userName}
              </p>
            </div>

            <div className="text-center px-2">
              <p className="text-[8px] uppercase tracking-wider text-white/50 font-medium">
                Valid Thru
              </p>
              <p className="text-xs font-mono font-bold text-white mt-0.5">12/28</p>
            </div>

            {/* Authentic Mastercard-Style Interlocking Circles */}
            <div className="flex items-center -space-x-3 shrink-0">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-500/95 shadow-md border border-emerald-300/30" />
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-teal-300/90 mix-blend-screen shadow-md border border-teal-200/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
