"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, ArrowRight, Check, Workflow, ClipboardList } from "lucide-react";
import { ToolIntegrationConfig } from "@/lib/academy/types";
import { singleProportion } from "@/lib/sampleSize";
import { mean, median, varianceAndSD } from "@/lib/statistics";
import { Button } from "@/app/components/ui/Button";

export function ToolEmbedCard({ config }: { config: ToolIntegrationConfig }) {
  // Live calculation state for sample size calculator
  const [p, setP] = useState<string>(String(config.prefilledParams?.p || "0.35"));
  const [margin, setMargin] = useState<string>(String(config.prefilledParams?.margin || "0.05"));
  const [sampleResult, setSampleResult] = useState<number | null>(null);

  // Live calculation state for statistical calculator
  const [dataValues, setDataValues] = useState<string>(String(config.prefilledParams?.values || "12, 15, 18, 22, 25, 29"));
  const [statsResult, setStatsResult] = useState<{ mean: number | null; median: number | null; sd: number | null } | null>(null);

  const handleComputeSampleSize = () => {
    try {
      const pNum = Number(p);
      const mNum = Number(margin);
      const res = singleProportion(pNum, mNum, 0.95);
      setSampleResult(res.value);
    } catch {
      setSampleResult(null);
    }
  };

  const handleComputeStats = () => {
    try {
      const nums = dataValues
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isFinite(n));
      const m = mean(nums).value;
      const med = median(nums).value;
      const { standardDeviation } = varianceAndSD(nums);
      const sd = standardDeviation.value;
      setStatsResult({ mean: m, median: med, sd });
    } catch {
      setStatsResult(null);
    }
  };

  const isSampleSize = config.type === "sample-size";
  const isStats = config.type === "statistical-calculator";
  const isWorkspace = config.type === "research-workspace";
  const isForms = config.type === "tinat-forms";

  return (
    <div className="my-8 rounded-md border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground">
            {isSampleSize || isStats ? (
              <Calculator className="h-4 w-4" />
            ) : isWorkspace ? (
              <Workflow className="h-4 w-4" />
            ) : (
              <ClipboardList className="h-4 w-4" />
            )}
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Research tool
            </span>
            <h3 className="m-0 text-base font-semibold text-foreground">{config.title}</h3>
          </div>
        </div>
        <Link
          href={config.ctaHref}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
        >
          Open standalone tool <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mb-5 text-sm leading-6 text-muted-foreground">
        {config.description}
      </p>

      {/* Interactive Sample Size Widget */}
      {isSampleSize && (
        <div className="space-y-4 rounded-md border border-border p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold">
              Expected Prevalence (p: 0–1):
              <input
                type="number"
                step="0.01"
                value={p}
                onChange={(e) => setP(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono"
              />
            </label>
            <label className="block text-xs font-semibold">
              Margin of Error (d: 0–1):
              <input
                type="number"
                step="0.01"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleComputeSampleSize} className="gap-1.5">
              Calculate sample size
            </Button>
            {sampleResult !== null && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Check className="h-4 w-4" />
                Required Sample Size: <span className="text-sm font-extrabold text-foreground">{sampleResult} participants</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Stats Widget */}
      {isStats && (
        <div className="space-y-4 rounded-md border border-border p-4">
          <label className="block text-xs font-semibold">
            Comma-separated data values (e.g. Systolic Blood Pressure):
            <input
              type="text"
              value={dataValues}
              onChange={(e) => setDataValues(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono"
            />
          </label>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleComputeStats} className="gap-1.5">
              Compute summary statistics
            </Button>
            {statsResult !== null && (
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span>Mean: <strong>{statsResult.mean?.toFixed(2)}</strong></span>
                <span>Median: <strong>{statsResult.median}</strong></span>
                <span>SD: <strong>{statsResult.sd?.toFixed(2)}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deep Link to Workspace or Forms */}
      {(isWorkspace || isForms) && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-4">
          <span className="text-sm text-muted-foreground">
            {isWorkspace
              ? "Prefill a new clinical or observational protocol in your collaborative research workspace."
              : "Design and test skip-logic questions in the visual drag-and-drop form builder."}
          </span>
          <Link
            href={config.ctaHref}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            {config.ctaText} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
