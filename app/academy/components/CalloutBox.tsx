"use client";

import React from "react";
import { Lightbulb, Wrench, AlertTriangle, MapPin, Sparkles } from "lucide-react";
import { Callout, CalloutType } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

const calloutConfig: Record<
  CalloutType,
  {
    icon: React.ComponentType<{ className?: string }>;
    badgeText: string;
    containerClass: string;
    badgeClass: string;
    titleClass: string;
  }
> = {
  "key-idea": {
    icon: Lightbulb,
    badgeText: "KEY PRINCIPLE",
    containerClass: "border-emerald-600/30 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100",
    badgeClass: "bg-emerald-600 text-white dark:bg-emerald-500",
    titleClass: "text-emerald-900 dark:text-emerald-300",
  },
  "worked-example": {
    icon: Wrench,
    badgeText: "WORKED EXAMPLE",
    containerClass: "border-sky-600/30 bg-sky-50/70 dark:bg-sky-950/20 text-sky-950 dark:text-sky-100",
    badgeClass: "bg-sky-600 text-white dark:bg-sky-500",
    titleClass: "text-sky-900 dark:text-sky-300",
  },
  "common-mistake": {
    icon: AlertTriangle,
    badgeText: "COMMON PITFALL",
    containerClass: "border-amber-600/30 bg-amber-50/70 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100",
    badgeClass: "bg-amber-600 text-white dark:bg-amber-500",
    titleClass: "text-amber-900 dark:text-amber-300",
  },
  "ethiopian-case-study": {
    icon: MapPin,
    badgeText: "ETHIOPIAN & AFRICAN CONTEXT",
    containerClass: "border-teal-600/30 bg-teal-50/70 dark:bg-teal-950/20 text-teal-950 dark:text-teal-100",
    badgeClass: "bg-teal-700 text-white dark:bg-teal-600",
    titleClass: "text-teal-900 dark:text-teal-300",
  },
  "try-it": {
    icon: Sparkles,
    badgeText: "TRY IT YOURSELF",
    containerClass: "border-indigo-600/30 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-100",
    badgeClass: "bg-indigo-600 text-white dark:bg-indigo-500",
    titleClass: "text-indigo-900 dark:text-indigo-300",
  },
};

export function CalloutBox({ callout }: { callout: Callout }) {
  const cfg = calloutConfig[callout.type] || calloutConfig["key-idea"];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "my-6 overflow-hidden rounded-xl border p-5 shadow-xs transition-colors",
        cfg.containerClass
      )}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase",
            cfg.badgeClass
          )}
        >
          <Icon className="h-3 w-3" />
          {cfg.badgeText}
        </span>
        <h4 className={cn("text-sm font-bold m-0", cfg.titleClass)}>{callout.title}</h4>
      </div>
      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line opacity-95">
        {callout.content}
      </div>
    </div>
  );
}
