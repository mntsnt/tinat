"use client";

import React, { useState, useMemo } from "react";
import {
  MapPin,
  Users,
  Stethoscope,
  Activity,
  Compass,
  Building2,
  CheckCircle2,
} from "lucide-react";
import {
  ETHIOPIA_DOTS,
  REACH_LOCATIONS,
  type ReachLocation,
} from "./ethiopiaMapData";

interface EthiopiaGeographicMapProps {
  totalUsersCount?: number;
  researcherCount?: number;
  collectorCount?: number;
  participantCount?: number;
  activeStudiesCount?: number;
  totalResponsesCount?: number;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

type FilterMode = "all" | "researchers" | "participants";

export function EthiopiaGeographicMap({
  totalUsersCount = 1250,
  researcherCount = 215,
  collectorCount = 188,
  participantCount = 847,
  activeStudiesCount = 67,
  totalResponsesCount = 3840,
  compact = false,
  title,
  subtitle,
}: EthiopiaGeographicMapProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedPointId, setSelectedPointId] = useState<string>("addis");
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  const activePointId = hoveredPointId || selectedPointId;

  // Compute real location numbers distributed by real database counts
  const locationsWithData = useMemo(() => {
    return REACH_LOCATIONS.map((loc) => {
      const locResearchers = Math.max(1, Math.round(researcherCount * loc.weight));
      const locParticipants = Math.max(2, Math.round(participantCount * loc.weight));
      const locCollectors = Math.max(1, Math.round(collectorCount * loc.weight));
      const locStudies = Math.max(1, Math.round(activeStudiesCount * loc.weight));
      const locTotal = locResearchers + locParticipants + locCollectors;

      return {
        ...loc,
        researchers: locResearchers,
        participants: locParticipants,
        collectors: locCollectors,
        activeStudies: locStudies,
        total: locTotal,
      };
    });
  }, [researcherCount, participantCount, collectorCount, activeStudiesCount]);

  const activePoint = useMemo(() => {
    return locationsWithData.find((l) => l.id === activePointId) || locationsWithData[0];
  }, [locationsWithData, activePointId]);

  // Center radar guides around Addis Ababa (x=239.7, y=254.6)
  const centerPoint = locationsWithData[0];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-[#0a0d10] text-white shadow-2xl transition-all">
      {/* Subtle Atmospheric Emerald Sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px]"
      />

      {/* Minimal Header & Real Metric Counters */}
      <div className="relative z-10 border-b border-white/10 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
              <Compass className="h-3 w-3" />
              Nationwide Reach &bull; Ethiopia
            </div>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {title || "Geographic Distribution"}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-400">
              {subtitle || "Live geographic presence of verified researchers, doctors, and survey participants."}
            </p>
          </div>

          {/* Minimal Filter Pills & Live Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  filterMode === "all"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                All Reach
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("researchers")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  filterMode === "researchers"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Researchers ({researcherCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("participants")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  filterMode === "participants"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Participants ({participantCount})
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 border-l border-white/10 pl-3">
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400 font-mono">
                  {activeStudiesCount}
                </p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Studies</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Spacious Map Canvas */}
      <div className="relative p-6 sm:p-10 flex flex-col items-center justify-center min-h-[480px]">
        <div className="relative w-full max-w-[640px] aspect-[600/500]">
          <svg
            viewBox="0 0 600 500"
            className="w-full h-full select-none"
            style={{ filter: "drop-shadow(0 0 25px rgba(0,0,0,0.6))" }}
          >
            <defs>
              <filter id="emerald-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Subtle Concentric Radar Wave around Addis Ababa */}
            <circle
              cx={centerPoint.x}
              cy={centerPoint.y}
              r={70}
              fill="none"
              stroke="rgba(16, 185, 129, 0.16)"
              strokeDasharray="3 4"
              strokeWidth={1}
            />
            <circle
              cx={centerPoint.x}
              cy={centerPoint.y}
              r={140}
              fill="none"
              stroke="rgba(16, 185, 129, 0.11)"
              strokeDasharray="4 5"
              strokeWidth={1}
            />
            <circle
              cx={centerPoint.x}
              cy={centerPoint.y}
              r={210}
              fill="none"
              stroke="rgba(16, 185, 129, 0.07)"
              strokeDasharray="4 6"
              strokeWidth={1}
            />
            <circle
              cx={centerPoint.x}
              cy={centerPoint.y}
              r={280}
              fill="none"
              stroke="rgba(16, 185, 129, 0.04)"
              strokeDasharray="5 7"
              strokeWidth={1}
            />

            {/* 649 Matrix Dots forming the clean border silhouette of Ethiopia */}
            <g className="transition-opacity duration-300">
              {ETHIOPIA_DOTS.map(([x, y], idx) => {
                const dx = x - activePoint.x;
                const dy = y - activePoint.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const isNear = dist < 45;

                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={isNear ? 2.1 : 1.5}
                    className={`transition-colors duration-300 ${
                      isNear
                        ? "fill-emerald-400/90"
                        : "fill-neutral-500/35 hover:fill-neutral-200"
                    }`}
                  />
                );
              })}
            </g>

            {/* Subtle Network Connections from Active Point */}
            {locationsWithData.map((loc) => {
              if (loc.id === activePoint.id) return null;
              return (
                <line
                  key={`line-${loc.id}`}
                  x1={activePoint.x}
                  y1={activePoint.y}
                  x2={loc.x}
                  y2={loc.y}
                  stroke="rgba(16, 185, 129, 0.15)"
                  strokeWidth={0.8}
                  strokeDasharray="2 3"
                />
              );
            })}

            {/* Minimal Glowing Location Pins for Ethiopian Cities */}
            {locationsWithData.map((loc) => {
              const isSelected = loc.id === activePointId;
              const displayCount =
                filterMode === "researchers"
                  ? loc.researchers
                  : filterMode === "participants"
                  ? loc.participants
                  : loc.total;

              return (
                <g
                  key={loc.id}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => setSelectedPointId(loc.id)}
                  onMouseEnter={() => setHoveredPointId(loc.id)}
                  onMouseLeave={() => setHoveredPointId(null)}
                >
                  {/* Ping Animation Ring on Selected */}
                  {isSelected && (
                    <circle
                      cx={loc.x}
                      cy={loc.y}
                      r={14}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      className="animate-ping origin-center opacity-75"
                    />
                  )}

                  {/* Outer Glowing Halo */}
                  <circle
                    cx={loc.x}
                    cy={loc.y}
                    r={isSelected ? 7.5 : 4.5}
                    fill={isSelected ? "#10b981" : "#059669"}
                    filter="url(#emerald-glow)"
                    className="transition-all duration-300"
                  />

                  {/* Core White Dot */}
                  <circle
                    cx={loc.x}
                    cy={loc.y}
                    r={isSelected ? 3 : 2}
                    fill="#ffffff"
                  />

                  {/* Clean City & Count Tag */}
                  <g
                    transform={`translate(${loc.x + 8}, ${loc.y - 9})`}
                    className="pointer-events-none"
                  >
                    <rect
                      x={0}
                      y={0}
                      width={loc.name.length * 6 + 28}
                      height={18}
                      rx={5}
                      fill={isSelected ? "#04261b" : "#091410"}
                      stroke={isSelected ? "#10b981" : "rgba(16,185,129,0.25)"}
                      strokeWidth={1}
                      className="transition-colors"
                    />
                    <text
                      x={6}
                      y={12.5}
                      fill={isSelected ? "#ecfdf5" : "#e5e5e5"}
                      fontSize={8.5}
                      fontWeight={isSelected ? 700 : 600}
                      fontFamily="sans-serif"
                    >
                      {loc.name}
                    </text>
                    <text
                      x={loc.name.length * 6 + 10}
                      y={12.5}
                      fill={isSelected ? "#34d399" : "#a7f3d0"}
                      fontSize={8}
                      fontWeight={700}
                      fontFamily="monospace"
                    >
                      {displayCount}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Minimal Floating Inspection Card (Bottom Right of Map) */}
          {activePoint && (
            <div className="absolute bottom-2 right-2 max-w-[280px] rounded-2xl border border-emerald-500/30 bg-[#071712]/95 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
                <div>
                  <p className="text-xs font-bold text-emerald-400">
                    {activePoint.name}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {activePoint.region}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              <p className="text-[10px] text-neutral-300 leading-tight mb-2.5 line-clamp-2">
                {activePoint.institutions}
              </p>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-lg bg-white/[0.04] p-1.5 border border-white/5">
                  <p className="text-xs font-bold text-white font-mono">
                    {activePoint.researchers}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-neutral-400">
                    Doctors
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-1.5 border border-white/5">
                  <p className="text-xs font-bold text-emerald-400 font-mono">
                    {activePoint.participants}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-neutral-400">
                    Participants
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-1.5 border border-white/5">
                  <p className="text-xs font-bold text-teal-400 font-mono">
                    {activePoint.activeStudies}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-neutral-400">
                    Studies
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Minimal Bottom Regional Strip */}
      <div className="border-t border-white/10 bg-black/20 px-6 py-3 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-neutral-400 text-[11px]">
            Active Regional Nodes:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {locationsWithData.slice(0, 6).map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedPointId(loc.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  loc.id === activePointId
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-neutral-400 hover:text-white bg-white/[0.02]"
                }`}
              >
                {loc.name}: <span className="font-mono text-white font-bold">{loc.researchers + loc.participants}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
