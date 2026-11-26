"use client";

import React from "react";
import { Lightbulb, Wrench, AlertTriangle, MapPin, Sparkles } from "lucide-react";
import { Callout, CalloutType } from "@/lib/academy/types";
import { AcademyMarkdown } from "./AcademyMarkdown";

const calloutConfig: Record<
  CalloutType,
  {
    icon: React.ComponentType<{ className?: string }>;
    badgeText: string;
  }
> = {
  "key-idea": {
    icon: Lightbulb,
    badgeText: "KEY PRINCIPLE",
  },
  "worked-example": {
    icon: Wrench,
    badgeText: "WORKED EXAMPLE",
  },
  "common-mistake": {
    icon: AlertTriangle,
    badgeText: "COMMON PITFALL",
  },
  "ethiopian-case-study": {
    icon: MapPin,
    badgeText: "ETHIOPIAN & AFRICAN CONTEXT",
  },
  "try-it": {
    icon: Sparkles,
    badgeText: "TRY IT YOURSELF",
  },
};

export function CalloutBox({ callout }: { callout: Callout }) {
  const cfg = calloutConfig[callout.type] || calloutConfig["key-idea"];
  const Icon = cfg.icon;

  return (
    <div
      className="my-6 rounded-md border border-border bg-muted/20 p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {cfg.badgeText}
        </span>
        <h3 className="m-0 text-sm font-semibold text-foreground">{callout.title}</h3>
      </div>
      <AcademyMarkdown content={callout.content} className="text-sm" />
    </div>
  );
}
