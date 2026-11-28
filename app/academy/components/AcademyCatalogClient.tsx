"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  ArrowRight,
} from "lucide-react";
import { AcademyModule, LearningPath } from "@/lib/academy/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
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
    <div className="space-y-8">
      {/* Resume Learning Card if user has history */}
      {continueLesson && (
        <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Continue learning
              </span>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                {continueLesson.lessonTitle}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{continueLesson.moduleTitle}</p>
            </div>
          </div>
          <Link
            href={`/academy/${continueLesson.moduleSlug}/${continueLesson.lessonSlug}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Resume lesson <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Path Selector & Search Bar */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
        {/* Pathway Pills */}
        <div className="flex flex-wrap gap-2" aria-label="Filter modules by pathway">
          <button
            type="button"
            onClick={() => setSelectedPathId("all")}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              selectedPathId === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            All ({modules.length})
          </button>
          {paths.map((path) => (
            <button
              key={path.id}
              type="button"
              onClick={() => setSelectedPathId(path.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                selectedPathId === path.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {path.id} ({modules.filter((m) => m.pathId === path.id).length})
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search courses"
            placeholder="Search courses or lessons"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Module Grid */}
      {filteredModules.length ? (
      <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-2 @4xl:grid-cols-3">
        {filteredModules.map((module, idx) => (
          <Link
            key={module.slug}
            href={`/academy/${module.slug}`}
            className="group block h-full"
          >
            <Card className="flex h-full flex-col justify-between overflow-hidden transition-all duration-200 group-hover:border-foreground/40 group-hover:shadow-md">
              {module.coverImage && (
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <img
                    src={module.coverImage}
                    alt={module.title}
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    loading={idx < 3 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={idx < 3 ? "high" : "low"}
                  />
                  <div className="absolute top-2.5 left-2.5 rounded-md border border-border/50 bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-xs">
                    MODULE {module.number}
                  </div>
                </div>
              )}
              <CardHeader className={module.coverImage ? "pb-2 pt-4" : "pb-3"}>
                {!module.coverImage && (
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      MODULE {module.number}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {module.duration}
                    </span>
                  </div>
                )}
                {module.coverImage && (
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{module.pathId} Pathway</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {module.duration}
                    </span>
                  </div>
                )}
                <CardTitle className="text-base font-semibold leading-snug group-hover:text-foreground">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {module.summary}
                </p>

                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">
                    {module.lessons.length} lessons
                  </span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    View module <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      ) : (
        <p className="rounded-md border border-border px-4 py-6 text-sm text-muted-foreground">
          No courses match your search. Try another term or pathway.
        </p>
      )}
    </div>
  );
}
