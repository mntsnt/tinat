import React from "react";
import Link from "next/link";
import { Layers, Sparkles, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";

interface LinkedStudyItem {
  id: string;
  title: string;
  status: string;
  format: "STANDARD" | "TINTOK";
  responsesCount: number;
}

interface LinkedStudiesPanelProps {
  currentStudyId: string;
  currentStudyFormat: "STANDARD" | "TINTOK";
  currentResponsesCount: number;
  parentStudy?: LinkedStudyItem | null;
  tintokChildStudy?: LinkedStudyItem | null;
}

export function LinkedStudiesPanel({
  currentStudyId,
  currentStudyFormat,
  currentResponsesCount,
  parentStudy,
  tintokChildStudy,
}: LinkedStudiesPanelProps) {
  const isTintok = currentStudyFormat === "TINTOK";
  const linkedItem = isTintok ? parentStudy : tintokChildStudy;

  if (!linkedItem) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-2xs" data-testid="linked-studies-panel">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          {isTintok ? (
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Layers className="w-4 h-4 text-primary" />
          )}
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isTintok ? "Parent Comprehensive Study" : "Connected Tintok Version"}
          </h3>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          Mode Pairing
        </span>
      </div>

      {/* Comparison Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Current Study Card */}
        <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Current Study ({currentStudyFormat === "TINTOK" ? "Tintok Card Format" : "Standard Survey"})
            </span>
            <span className="text-xs font-bold text-foreground tabular-nums">
              {currentResponsesCount} {currentResponsesCount === 1 ? "response" : "responses"}
            </span>
          </div>
          <p className="text-xs font-semibold text-foreground truncate">This Study</p>
        </div>

        {/* Linked Counterpart Card */}
        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              {isTintok ? "Full Standard Study" : "Tintok Micro-Study"}
            </span>
            <Badge
              variant={
                linkedItem.status === "ACTIVE"
                  ? "success"
                  : linkedItem.status === "COMPLETED"
                  ? "secondary"
                  : "warning"
              }
              className="text-[10px] px-1.5 py-0"
            >
              {linkedItem.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/researcher/studies/${linkedItem.id}`}
              className="text-xs font-bold text-foreground hover:text-primary transition-colors truncate flex items-center gap-1"
            >
              <span className="truncate">{linkedItem.title}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </Link>
            <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
              {linkedItem.responsesCount} {linkedItem.responsesCount === 1 ? "response" : "responses"}
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Scientific Data Integrity Warning */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <p>
          <strong className="font-semibold text-foreground">Statistical Mode Notice:</strong> The two datasets are separate and must not be pooled or merged without accounting for the answering mode. Survey format influences completion rates and cognitive heuristics.
        </p>
      </div>
    </div>
  );
}
