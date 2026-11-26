"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Clock,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Layers3,
  Award,
  CheckCircle2,
  Check,
} from "lucide-react";
import { AcademyModule, LearningPath } from "@/lib/academy/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { cn } from "@/lib/utils";

interface AcademyCatalogClientProps {
  paths: LearningPath[];
  modules: AcademyModule[];
}

export function AcademyCatalogClient({ paths, modules }: AcademyCatalogClientProps) {
  const [selectedPathId, setSelectedPathId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [continueLesson, setContinueLesson] = useState<{
    moduleSlug: string;
    moduleTitle: string;
    lessonSlug: string;
    lessonTitle: string;
  } | null>(null);

  // Load last studied lesson from localStorage
  useEffect(() => {
    const lastVisited = localStorage.getItem("tinat_academy_last_visited");
    if (lastVisited) {
      try {
        const parsed = JSON.parse(lastVisited);
        const mod = modules.find((m) => m.slug === parsed.moduleSlug);
        const les = mod?.lessons.find((l) => l.slug === parsed.lessonSlug);
        if (mod && les) {
          setContinueLesson({
            moduleSlug: mod.slug,
            moduleTitle: mod.title,
            lessonSlug: les.slug,
            lessonTitle: les.title,
          });
        }
      } catch {}
    }
  }, [modules]);

  // Filter modules
  const filteredModules = modules.filter((m) => {
    const matchesPath = selectedPathId === "all" || m.pathId === selectedPathId;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lessons.some((l) => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPath && matchesSearch;
  });

  return (
    <div className="space-y-12">
      {/* Resume Learning Card if user has history */}
      {continueLesson && (
        <div className="rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-r from-emerald-500/10 via-card to-background p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                CONTINUE LEARNING WHERE YOU LEFT OFF
              </span>
              <h4 className="text-base font-bold text-foreground m-0">
                {continueLesson.lessonTitle}
              </h4>
              <p className="text-xs text-muted-foreground m-0">{continueLesson.moduleTitle}</p>
            </div>
          </div>
          <Link
            href={`/academy/${continueLesson.moduleSlug}/${continueLesson.lessonSlug}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 shadow-sm shrink-0"
          >
            Resume Lesson <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Path Selector & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        {/* Pathway Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedPathId("all")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              selectedPathId === "all"
                ? "bg-foreground text-background shadow-xs"
                : "border border-border text-muted-foreground hover:bg-muted"
            )}
          >
            All Modules ({modules.length})
          </button>
          {paths.map((path) => (
            <button
              key={path.id}
              type="button"
              onClick={() => setSelectedPathId(path.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer capitalize",
                selectedPathId === path.id
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "border border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {path.id} ({modules.filter((m) => m.pathId === path.id).length})
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons, methods, epidemiology..."
            className="w-full rounded-full border border-input bg-card pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
          />
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredModules.map((module) => (
          <Link
            key={module.slug}
            href={`/academy/${module.slug}`}
            className="group block h-full"
          >
            <Card className="h-full flex flex-col justify-between transition-all duration-200 group-hover:-translate-y-1 group-hover:border-emerald-600/50 group-hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    MODULE {module.number}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3" /> {module.duration}
                  </span>
                </div>
                <CardTitle className="text-base font-bold group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {module.summary}
                </p>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">
                    {module.lessons.length} lessons • {module.quiz?.questionBank?.length || 0} quiz Qs
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Start <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
