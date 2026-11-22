"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  MapPin,
  Users,
  Stethoscope,
  Activity,
  Building2,
  ChevronRight,
  Database,
  ArrowUpRight,
  Radio,
  Search,
  Filter,
} from "lucide-react";
import {
  ETHIOPIA_DOTS,
  REACH_LOCATIONS,
  type ReachLocation,
} from "../../components/admin/ethiopiaMapData";

interface GeographicReachClientProps {
  totalUsersCount: number;
  researcherCount: number;
  collectorCount: number;
  participantCount: number;
  activeStudiesCount: number;
  totalResponsesCount: number;
}

type FilterMode = "all" | "researchers" | "participants";
type MobileTab = "map" | "list";

export function GeographicReachClient({
  totalUsersCount,
  researcherCount,
  collectorCount,
  participantCount,
  activeStudiesCount,
  totalResponsesCount,
}: GeographicReachClientProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedPointId, setSelectedPointId] = useState<string>("addis");
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("map");

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const activePointId = hoveredPointId || selectedPointId;

  // Compute location numbers based on database counts and regional weights
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
    return (
      locationsWithData.find((l) => l.id === activePointId) ||
      locationsWithData[0]
    );
  }, [locationsWithData, activePointId]);

  // Center radar guides around Addis Ababa (x=239.7, y=254.6)
  const centerPoint = locationsWithData[0];

  // Filter regional centers for the search bar in the right pane
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locationsWithData;
    const q = searchQuery.toLowerCase();
    return locationsWithData.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.region.toLowerCase().includes(q) ||
        loc.institutions.toLowerCase().includes(q)
    );
  }, [locationsWithData, searchQuery]);

  // Auto-scroll the list to the selected item when changed from the map
  const selectHub = (id: string) => {
    setSelectedPointId(id);
    const targetEl = document.getElementById(`hub-item-${id}`);
    if (targetEl && listContainerRef.current) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const totalNetworkReach = researcherCount + participantCount + collectorCount;

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-background p-3 sm:p-5 md:p-6 gap-3 sm:gap-4 max-w-[1680px] mx-auto">
      {/* 1. Sleek Compact Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link
              href="/admin"
              className="hover:text-foreground transition-colors"
            >
              Admin
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Geographic Reach</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Geographic Reach
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              10 Regional Hubs Across Ethiopia
            </span>
          </div>
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Segmented Filter Pills */}
          <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`rounded-lg px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all ${
                filterMode === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Reach ({totalNetworkReach})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("researchers")}
              className={`rounded-lg px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all ${
                filterMode === "researchers"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Researchers ({researcherCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("participants")}
              className={`rounded-lg px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all ${
                filterMode === "participants"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Participants ({participantCount})
            </button>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden rounded-xl border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setMobileTab("map")}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                mobileTab === "map"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Map View
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("list")}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                mobileTab === "list"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Hubs List (10)
            </button>
          </div>

          {/* Quick link button on desktop */}
          <Link
            href="/admin/users"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-muted transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            User Directory
          </Link>
        </div>
      </header>

      {/* 2. Main Two-Column Fixed Viewport */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Interactive Dotted Ethiopia Map Canvas (8 cols on desktop) */}
        <div
          className={`lg:col-span-8 flex flex-col h-full min-h-0 rounded-2xl border border-border/80 bg-[#070b0e] text-white shadow-xl overflow-hidden relative ${
            mobileTab === "list" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Subtle Ambient Glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-500/10 blur-[100px]"
          />

          {/* Map Sub-Header Strip */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-4 py-2.5 sm:px-6 bg-black/30 shrink-0">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">
                Live Spatial Distribution
              </span>
              <span className="text-[11px] text-neutral-400 hidden sm:inline">
                &bull; Active Medical Nodes
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-[11px] text-neutral-400 hidden sm:inline">
                Selected:
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {activePoint.name}
              </span>
            </div>
          </div>

          {/* SVG Canvas Area (Fills available height) */}
          <div className="flex-1 min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div className="relative w-full h-full max-h-[calc(100vh-270px)] sm:max-h-[calc(100vh-250px)] aspect-[600/500] flex items-center justify-center">
              <svg
                viewBox="0 0 600 500"
                className="w-full h-full select-none max-h-full"
                style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.7))" }}
              >
                <defs>
                  <filter
                    id="emerald-glow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Concentric Radar Rings around Addis Ababa */}
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

                {/* 649 Matrix Dots forming Ethiopia's Geographical Silhouette */}
                <g className="transition-opacity duration-300">
                  {ETHIOPIA_DOTS.map(([x, y], idx) => {
                    const dx = x - activePoint.x;
                    const dy = y - activePoint.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const isNear = dist < 42;

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

                {/* Dotted Network Connection Lines from Active Hub */}
                {locationsWithData.map((loc) => {
                  if (loc.id === activePoint.id) return null;
                  return (
                    <line
                      key={`line-${loc.id}`}
                      x1={activePoint.x}
                      y1={activePoint.y}
                      x2={loc.x}
                      y2={loc.y}
                      stroke="rgba(16, 185, 129, 0.18)"
                      strokeWidth={0.8}
                      strokeDasharray="2 3"
                    />
                  );
                })}

                {/* Interactive Glowing City Pins */}
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
                      onClick={() => selectHub(loc.id)}
                      onMouseEnter={() => setHoveredPointId(loc.id)}
                      onMouseLeave={() => setHoveredPointId(null)}
                    >
                      {/* Pulse Ping Ring on Active */}
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

                      {/* Glowing Halo */}
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

                      {/* City Name & Count Label Pill */}
                      <g
                        transform={`translate(${loc.x + 8}, ${loc.y - 9})`}
                        className="pointer-events-none select-none"
                      >
                        <rect
                          x={0}
                          y={0}
                          width={loc.name.length * 6 + 28}
                          height={18}
                          rx={5}
                          fill={isSelected ? "#04261b" : "#091410"}
                          stroke={
                            isSelected ? "#10b981" : "rgba(16,185,129,0.25)"
                          }
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
            </div>
          </div>

          {/* Docked Active Hub Insight Bar (Pinned at bottom of map card) */}
          <div className="relative z-10 border-t border-white/10 bg-black/40 px-4 py-2.5 sm:px-6 backdrop-blur-md shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {activePoint.name}
                  </span>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-semibold text-emerald-400">
                    {activePoint.region}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 truncate mt-0.5" title={activePoint.institutions}>
                  {activePoint.institutions}
                </p>
              </div>

              {/* Quick Stat Chips */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="rounded-lg bg-white/[0.04] px-2.5 py-1 border border-white/5 text-center">
                  <span className="text-xs font-bold text-white font-mono">
                    {activePoint.researchers}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 ml-1">
                    Doctors
                  </span>
                </div>
                <div className="rounded-lg bg-white/[0.04] px-2.5 py-1 border border-white/5 text-center">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {activePoint.participants}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 ml-1">
                    Participants
                  </span>
                </div>
                <div className="rounded-lg bg-white/[0.04] px-2.5 py-1 border border-white/5 text-center">
                  <span className="text-xs font-bold text-teal-400 font-mono">
                    {activePoint.activeStudies}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 ml-1">
                    Studies
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Regional Hubs Directory & Breakdown (4 cols on desktop) */}
        <div
          className={`lg:col-span-4 flex flex-col h-full min-h-0 rounded-2xl border border-border bg-card shadow-xs overflow-hidden ${
            mobileTab === "map" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Header & Search */}
          <div className="p-3.5 border-b border-border bg-muted/20 shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Regional Medical Hubs
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  University teaching hospitals & research centers
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {locationsWithData.length} Hubs
              </span>
            </div>

            {/* Quick Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, region, or hospital..."
                className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Internal Scrollable List of 10 Centers */}
          <div
            ref={listContainerRef}
            className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 divide-y divide-border/30 [scrollbar-gutter:stable]"
          >
            {filteredLocations.map((loc) => {
              const isSelected = loc.id === activePointId;
              const percentShare = Math.round(loc.weight * 100);

              return (
                <button
                  key={loc.id}
                  id={`hub-item-${loc.id}`}
                  type="button"
                  onClick={() => selectHub(loc.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all pt-2.5 ${
                    isSelected
                      ? "border-emerald-500/50 bg-emerald-500/10 shadow-xs"
                      : "border-transparent hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isSelected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
                          }`}
                        />
                        <span className="text-xs font-bold text-foreground truncate">
                          {loc.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          &bull; {loc.region}
                        </span>
                      </div>
                      <p
                        className="text-[11px] text-muted-foreground truncate mt-0.5"
                        title={loc.institutions}
                      >
                        {loc.institutions}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono text-foreground">
                        {filterMode === "researchers"
                          ? loc.researchers
                          : filterMode === "participants"
                          ? loc.participants
                          : loc.total}
                      </span>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {percentShare}% share
                      </span>
                    </div>
                  </div>

                  {/* Share Progress Bar */}
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected
                          ? "bg-emerald-500"
                          : "bg-emerald-600/40 dark:bg-emerald-400/40"
                      }`}
                      style={{ width: `${Math.min(100, percentShare * 2.5)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fixed Footer Links */}
          <div className="p-2.5 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between text-xs">
            <Link
              href="/admin/studies"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Database className="h-3 w-3" />
              Active Studies ({activeStudiesCount})
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View All Directory
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
