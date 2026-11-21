"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Users,
  Stethoscope,
  Coins,
  Activity,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  Building2,
  Compass,
  ArrowUpRight,
} from "lucide-react";
import {
  ETHIOPIA_DOTS,
  INITIAL_ETHIOPIAN_HUBS,
  type EthiopianHub,
} from "./ethiopiaMapData";

interface EthiopiaGeographicMapProps {
  totalUsersCount?: number;
  researcherCount?: number;
  collectorCount?: number;
  participantCount?: number;
  activeStudiesCount?: number;
  totalResponsesCount?: number;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

type RoleFilter = "all" | "researchers" | "collectors" | "participants";

export function EthiopiaGeographicMap({
  totalUsersCount = 1250,
  researcherCount = 215,
  collectorCount = 188,
  participantCount = 847,
  activeStudiesCount = 67,
  totalResponsesCount = 3840,
  title = "Chapters and community",
  subtitle = "Young researchers, doctors, and field enumerators leading health investigations in their own towns and campuses.",
  compact = false,
}: EthiopiaGeographicMapProps) {
  const [selectedHubId, setSelectedHubId] = useState<string>("addis");
  const [hoveredHubId, setHoveredHubId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const activeHubId = hoveredHubId || selectedHubId;

  const hubs = useMemo(() => {
    return INITIAL_ETHIOPIAN_HUBS;
  }, []);

  const selectedHub = useMemo(() => {
    return hubs.find((h) => h.id === activeHubId) || hubs[0];
  }, [hubs, activeHubId]);

  // Center coordinates for radial radar rings (Addis Ababa hub)
  const centerHub = hubs[0]; // Addis: x=239.7, y=254.6

  // Filtered metrics for selected hub
  const hubMetrics = useMemo(() => {
    if (!selectedHub) return null;
    return {
      name: selectedHub.name,
      city: selectedHub.city,
      region: selectedHub.region,
      status: selectedHub.status,
      description: selectedHub.description,
      researchers: selectedHub.researchers,
      collectors: selectedHub.collectors,
      participants: selectedHub.participants,
      studies: selectedHub.activeStudies,
      total:
        selectedHub.researchers +
        selectedHub.collectors +
        selectedHub.participants,
    };
  }, [selectedHub]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-[#0d0e12] text-white shadow-2xl transition-all">
      {/* Background Ambience & Orbital Radial Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-teal-500/15 blur-[100px]"
      />

      {/* Header & Metrics Strip */}
      <div className="relative z-10 border-b border-white/10 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              <Compass className="h-3.5 w-3.5" />
              Nationwide Coverage &bull; Ethiopia
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-neutral-400 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Quick Metrics KPI Counters */}
          <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
              <p className="text-2xl font-black text-emerald-400">
                {totalUsersCount.toLocaleString()}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                Active Members
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
              <p className="text-2xl font-black text-white">
                {String(hubs.length).padStart(2, "0")}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                Active Chapters
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
              <p className="text-2xl font-black text-teal-400">
                {activeStudiesCount}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                Active Studies
              </p>
            </div>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                roleFilter === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              All Networks
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("researchers")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                roleFilter === "researchers"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Researchers &amp; Doctors
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("collectors")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                roleFilter === "collectors"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Field Enumerators (ETB)
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("participants")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                roleFilter === "participants"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Participants
            </button>
          </div>

          <span className="text-xs text-neutral-400">
            Click any chapter or pin to inspect regional health sentinel data
          </span>
        </div>
      </div>

      {/* Main Grid: Left Hubs List & Right Precision Dotted Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
        {/* Left Column: Chapters & Community Hub List (matching first screenshot) */}
        <div className="lg:col-span-5 p-6 sm:p-8 space-y-4 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              Regional Teaching &amp; Sentinel Hubs
            </h3>
            <p className="text-xs text-neutral-400">
              Coordinated university hospitals and door-to-door field clusters.
            </p>
          </div>

          {/* Hub Rows */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {hubs.map((hub) => {
              const isSelected = hub.id === activeHubId;
              const countForRole =
                roleFilter === "researchers"
                  ? hub.researchers
                  : roleFilter === "collectors"
                  ? hub.collectors
                  : roleFilter === "participants"
                  ? hub.participants
                  : hub.researchers + hub.collectors + hub.participants;

              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => setSelectedHubId(hub.id)}
                  onMouseEnter={() => setHoveredHubId(hub.id)}
                  onMouseLeave={() => setHoveredHubId(null)}
                  className={`w-full group flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                      : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <p
                      className={`text-xs font-bold transition-colors ${
                        isSelected
                          ? "text-emerald-400"
                          : "text-neutral-200 group-hover:text-white"
                      }`}
                    >
                      {hub.name}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {hub.region} &bull; {hub.activeStudies} active studies
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[11px] font-mono text-neutral-300 font-semibold">
                      {countForRole}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Planned Expansion Target Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              15 chapters planned by January 2027
            </span>
            <Link
              href="/admin/users"
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
            >
              View directory &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Precision Dotted Matrix Map of Ethiopia */}
        <div className="relative lg:col-span-7 p-6 sm:p-8 flex flex-col items-center justify-center min-h-[460px]">
          <div className="relative w-full max-w-[580px] aspect-[600/500]">
            <svg
              viewBox="0 0 600 500"
              className="w-full h-full select-none"
              style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))" }}
            >
              <defs>
                {/* Glow Filter for Active Location Pins */}
                <filter
                  id="pin-glow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Concentric Radar Guides around Addis Ababa */}
              <circle
                cx={centerHub.x}
                cy={centerHub.y}
                r={60}
                fill="none"
                stroke="rgba(16, 185, 129, 0.18)"
                strokeDasharray="3 4"
                strokeWidth={1}
              />
              <circle
                cx={centerHub.x}
                cy={centerHub.y}
                r={120}
                fill="none"
                stroke="rgba(16, 185, 129, 0.14)"
                strokeDasharray="4 5"
                strokeWidth={1}
              />
              <circle
                cx={centerHub.x}
                cy={centerHub.y}
                r={185}
                fill="none"
                stroke="rgba(16, 185, 129, 0.09)"
                strokeDasharray="4 6"
                strokeWidth={1}
              />
              <circle
                cx={centerHub.x}
                cy={centerHub.y}
                r={250}
                fill="none"
                stroke="rgba(16, 185, 129, 0.06)"
                strokeDasharray="5 7"
                strokeWidth={1}
              />

              {/* 649 Matrix Dots forming the exact silhouette of Ethiopia */}
              <g className="transition-opacity duration-300">
                {ETHIOPIA_DOTS.map(([x, y], idx) => {
                  // Check distance to selected hub to subtly highlight nearby dots
                  const dx = x - selectedHub.x;
                  const dy = y - selectedHub.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const isNear = dist < 45;

                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={isNear ? 2.1 : 1.6}
                      className={`transition-colors duration-300 ${
                        isNear
                          ? "fill-emerald-400/90"
                          : "fill-neutral-400/40 hover:fill-neutral-200"
                      }`}
                    />
                  );
                })}
              </g>

              {/* Connection Lines from Selected Hub to other Active Hubs */}
              {hubs.map((hub) => {
                if (hub.id === selectedHub.id) return null;
                return (
                  <line
                    key={`line-${hub.id}`}
                    x1={selectedHub.x}
                    y1={selectedHub.y}
                    x2={hub.x}
                    y2={hub.y}
                    stroke="rgba(16, 185, 129, 0.18)"
                    strokeWidth={0.8}
                    strokeDasharray="2 3"
                  />
                );
              })}

              {/* Glowing Location Pins for Ethiopian Hubs */}
              {hubs.map((hub) => {
                const isSelected = hub.id === activeHubId;

                return (
                  <g
                    key={hub.id}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => setSelectedHubId(hub.id)}
                    onMouseEnter={() => setHoveredHubId(hub.id)}
                    onMouseLeave={() => setHoveredHubId(null)}
                  >
                    {/* Animated Ping Radar Ring */}
                    {isSelected && (
                      <circle
                        cx={hub.x}
                        cy={hub.y}
                        r={14}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        className="animate-ping origin-center opacity-75"
                      />
                    )}

                    {/* Outer Glow Halo */}
                    <circle
                      cx={hub.x}
                      cy={hub.y}
                      r={isSelected ? 8 : 5}
                      fill={isSelected ? "#10b981" : "#059669"}
                      filter="url(#pin-glow)"
                      className="transition-all duration-300"
                    />

                    {/* White Core Dot */}
                    <circle
                      cx={hub.x}
                      cy={hub.y}
                      r={isSelected ? 3.5 : 2.5}
                      fill="#ffffff"
                    />

                    {/* Pin Label Box */}
                    <g
                      transform={`translate(${hub.x + 9}, ${hub.y - 10})`}
                      className="pointer-events-none"
                    >
                      <rect
                        x={0}
                        y={0}
                        width={hub.shortName.length * 6.5 + 16}
                        height={18}
                        rx={4}
                        fill={isSelected ? "#04241a" : "#0a1713"}
                        stroke={isSelected ? "#10b981" : "rgba(16,185,129,0.3)"}
                        strokeWidth={1}
                        className="transition-colors"
                      />
                      <text
                        x={8}
                        y={12.5}
                        fill={isSelected ? "#d1fae5" : "#e5e5e5"}
                        fontSize={9}
                        fontWeight={isSelected ? 700 : 600}
                        fontFamily="sans-serif"
                      >
                        {hub.shortName}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Floating Live Inspection Card (Bottom Right of Map) */}
            {hubMetrics && (
              <div className="absolute bottom-2 right-2 max-w-xs rounded-2xl border border-emerald-500/30 bg-[#071612]/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-400 truncate">
                      {hubMetrics.name}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {hubMetrics.region}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                    {hubMetrics.status}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-300 leading-snug mb-3">
                  {hubMetrics.description}
                </p>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-white/[0.04] p-1.5 border border-white/5">
                    <p className="text-xs font-bold text-white">
                      {hubMetrics.researchers}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-neutral-400">
                      Doctors
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-1.5 border border-white/5">
                    <p className="text-xs font-bold text-teal-400">
                      {hubMetrics.collectors}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-neutral-400">
                      Collectors
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-1.5 border border-white/5">
                    <p className="text-xs font-bold text-emerald-400">
                      {hubMetrics.studies}
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
      </div>
    </div>
  );
}
