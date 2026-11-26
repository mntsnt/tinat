"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  Target,
  Sparkles,
  BarChart2,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Sigma,
} from "lucide-react";
import { singleProportion } from "@/lib/sampleSize";
import { mean, median, varianceAndSD, rangeAndIQR } from "@/lib/statistics";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";

interface Question {
  id: string;
  text: string;
  type: string;
}

interface Answer {
  questionId: string;
  numberValue: number | null;
  textValue: string | null;
}

interface Response {
  id: string;
  answers: Answer[];
}

interface StudyCalculatorsTabProps {
  study: {
    id: string;
    title: string;
    participantTarget: number;
    targetPopulation?: string | null;
  };
  questions: Question[];
  responses: Response[];
}

export function StudyCalculatorsTab({
  study,
  questions,
  responses,
}: StudyCalculatorsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"sample-size" | "stats">("sample-size");

  // Sample Size State
  const [p, setP] = useState<number>(0.5);
  const [margin, setMargin] = useState<number>(0.05);
  const [confidence, setConfidence] = useState<number>(0.95);
  const [populationSize, setPopulationSize] = useState<string>("");
  const [nonResponseRate, setNonResponseRate] = useState<number>(10);
  const [targetSaved, setTargetSaved] = useState(false);
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  // Calculate sample size using Tinat mathematical library
  const sampleCalc = useMemo(() => {
    try {
      const baseResult = singleProportion(p, margin, confidence);
      const baseN = baseResult.value || 384;

      let adjustedN = baseN;
      const popN = Number(populationSize);
      if (popN && popN > 0) {
        adjustedN = Math.ceil(baseN / (1 + (baseN - 1) / popN));
      }

      const finalWithAttrition = Math.ceil(adjustedN / (1 - nonResponseRate / 100));

      return {
        baseN,
        adjustedN,
        finalN: finalWithAttrition,
        formula: baseResult.formula,
        steps: baseResult.steps,
      };
    } catch {
      return { baseN: 384, adjustedN: 384, finalN: 427, formula: "", steps: [] };
    }
  }, [p, margin, confidence, populationSize, nonResponseRate]);

  // Statistical Calculator State
  const numericQuestions = useMemo(() => {
    return questions.filter(
      (q) => q.type === "NUMERIC" || q.type === "RATING" || q.type === "SCALE"
    );
  }, [questions]);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    numericQuestions[0]?.id || "manual"
  );
  const [manualInput, setManualInput] = useState<string>("12, 18, 22, 25, 30, 35, 42");

  // Extract numbers for analysis
  const dataset = useMemo(() => {
    if (selectedQuestionId === "manual") {
      return manualInput
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isFinite(n));
    }

    const extracted: number[] = [];
    responses.forEach((resp) => {
      const ans = resp.answers.find((a) => a.questionId === selectedQuestionId);
      if (ans) {
        if (typeof ans.numberValue === "number" && Number.isFinite(ans.numberValue)) {
          extracted.push(ans.numberValue);
        } else if (ans.textValue && !isNaN(Number(ans.textValue))) {
          extracted.push(Number(ans.textValue));
        }
      }
    });
    return extracted;
  }, [selectedQuestionId, manualInput, responses]);

  // Compute summary statistics
  const statsResults = useMemo(() => {
    if (!dataset.length) return null;
    try {
      const meanRes = mean(dataset);
      const medianRes = median(dataset);
      const varRes = varianceAndSD(dataset);
      const rangeRes = rangeAndIQR(dataset);

      return {
        n: dataset.length,
        mean: meanRes.value,
        median: medianRes.value,
        variance: varRes.variance.value,
        sd: varRes.standardDeviation.value,
        range: rangeRes.range.value,
        iqr: rangeRes.iqr.value,
      };
    } catch {
      return null;
    }
  }, [dataset]);

  // Handle saving calculated sample size as study target
  const handleApplyToStudy = async () => {
    setIsSavingTarget(true);
    try {
      const res = await fetch(`/api/studies/${study.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantTarget: sampleCalc.finalN }),
      });
      if (res.ok) {
        setTargetSaved(true);
        setTimeout(() => setTargetSaved(false), 3000);
      }
    } catch (err) {
      console.error("Error updating participantTarget:", err);
    } finally {
      setIsSavingTarget(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
              <Calculator className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Integrated Study Calculators
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Perform sample size planning and compute response statistics directly for{" "}
            <span className="font-semibold text-foreground">"{study.title}"</span>.
          </p>
        </div>

        <div className="flex rounded-xl bg-muted p-1 border border-border">
          <button
            type="button"
            onClick={() => setActiveSubTab("sample-size")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeSubTab === "sample-size"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Target className="h-3.5 w-3.5" /> Sample Size &amp; Power
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("stats")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeSubTab === "stats"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sigma className="h-3.5 w-3.5" /> Response Statistics
          </button>
        </div>
      </div>

      {/* ── Sub-Tab 1: Sample Size Planning ── */}
      {activeSubTab === "sample-size" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Controls Panel */}
          <Card className="lg:col-span-2 border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  Study Sample Size Determination
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Cochran (1977) Formula
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Determine the minimum statistically valid sample size required to test your primary hypothesis with sufficient precision.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Expected Prevalence / Proportion */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Expected Proportion / Prevalence ($P$):
                    <span className="ml-1 font-mono text-emerald-600 font-bold">{(p * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.95"
                    step="0.01"
                    value={p}
                    onChange={(e) => setP(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Use 50% ($P=0.50$) if unknown for maximum conservative sample size.
                  </p>
                </div>

                {/* Margin of Error */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Margin of Error ($d$):
                    <span className="ml-1 font-mono text-emerald-600 font-bold">{(margin * 100).toFixed(1)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.10"
                    step="0.005"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Standard convention in health research is 5% ($d=0.05$).
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-border/60">
                {/* Confidence Level */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Confidence Level (1 - α):
                  </label>
                  <select
                    value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background p-2 text-xs"
                  >
                    <option value={0.95}>95% ($Z = 1.96$)</option>
                    <option value={0.90}>90% ($Z = 1.645$)</option>
                    <option value={0.99}>99% ($Z = 2.576$)</option>
                  </select>
                </div>

                {/* Finite Population */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Finite Population ($N$, optional):
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000 (leave blank if > 10,000)"
                    value={populationSize}
                    onChange={(e) => setPopulationSize(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background p-2 text-xs"
                  />
                </div>

                {/* Non-response rate */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Non-Response Buffer:
                    <span className="ml-1 font-mono text-emerald-600 font-bold">{nonResponseRate}%</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={nonResponseRate}
                    onChange={(e) => setNonResponseRate(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-input bg-background p-2 text-xs"
                  />
                </div>
              </div>

              {/* Formula & Methodological Transparency */}
              <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs space-y-1.5 font-mono">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                  Calculated Formula:
                </p>
                <p className="text-foreground">
                  n = (Z² × P(1 - P)) / d² = (1.96² × {p} × {(1 - p).toFixed(2)}) / {margin}² = {sampleCalc.baseN}
                </p>
                {populationSize && Number(populationSize) > 0 && (
                  <p className="text-emerald-700 dark:text-emerald-400">
                    Finite adjustment (N = {populationSize}): n_adj = n / [1 + (n - 1) / N] = {sampleCalc.adjustedN}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Result & Apply Card */}
          <div className="space-y-4">
            <Card className="border-2 border-emerald-600/40 bg-gradient-to-br from-emerald-500/10 via-card to-background">
              <CardHeader className="pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Recommended Study Sample Size
                </span>
                <CardTitle className="text-4xl font-extrabold text-foreground mt-1">
                  {sampleCalc.finalN}
                  <span className="text-sm font-normal text-muted-foreground ml-2">participants</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                <div className="space-y-1 text-xs border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base sample size:</span>
                    <span className="font-mono font-semibold">{sampleCalc.baseN}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Finite-corrected:</span>
                    <span className="font-mono font-semibold">{sampleCalc.adjustedN}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">With {nonResponseRate}% attrition buffer:</span>
                    <span className="font-mono font-semibold text-emerald-600 font-bold">{sampleCalc.finalN}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">Current Study Target:</span>
                    <span className="font-mono font-semibold">{study.participantTarget}</span>
                  </div>
                </div>

                <Button
                  onClick={handleApplyToStudy}
                  disabled={isSavingTarget}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                >
                  {targetSaved ? (
                    <>
                      <Check className="h-4 w-4" /> Applied to Study Target
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" /> Apply {sampleCalc.finalN} to Study Target
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground space-y-1">
              <strong className="block text-foreground font-semibold">IRB Compliance Tip:</strong>
              <p className="leading-relaxed">
                Include the exact parameters ($P={(p*100).toFixed(0)}\%$, $d={(margin*100).toFixed(1)}\%$, $95\%$ CI) in your Ethical Review protocol submission.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-Tab 2: Response Statistics ── */}
      {activeSubTab === "stats" && (
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sigma className="h-4 w-4 text-emerald-600" />
                    Study Dataset Statistical Calculator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Calculate summary statistics directly from your respondent data or enter custom observational numbers.
                  </CardDescription>
                </div>

                {/* Question selector */}
                <div className="w-full sm:w-auto">
                  <select
                    value={selectedQuestionId}
                    onChange={(e) => setSelectedQuestionId(e.target.value)}
                    className="w-full sm:w-72 rounded-lg border border-input bg-background p-2 text-xs font-medium"
                  >
                    {numericQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.text.length > 40 ? q.text.substring(0, 40) + "..." : q.text}
                      </option>
                    ))}
                    <option value="manual">Custom Numbers (Scratchpad)</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {selectedQuestionId === "manual" && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Enter comma-separated values for analysis:
                  </label>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. 12, 14, 18, 22, 25, 30"
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-xs font-mono"
                  />
                </div>
              )}

              {statsResults ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Mean */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      Sample Mean (x̄)
                    </p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {typeof statsResults.mean === "number" ? statsResults.mean.toFixed(2) : "N/A"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">Arithmetic average of {statsResults.n} observations</p>
                  </div>

                  {/* Median */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      Median (50th %ile)
                    </p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {typeof statsResults.median === "number" ? statsResults.median.toFixed(2) : "N/A"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">Robust to extreme outliers</p>
                  </div>

                  {/* Standard Deviation */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      Standard Deviation ($s$)
                    </p>
                    <p className="text-2xl font-bold font-mono text-emerald-600 font-bold mt-1">
                      {typeof statsResults.sd === "number" ? statsResults.sd.toFixed(2) : "N/A"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Variance: {typeof statsResults.variance === "number" ? statsResults.variance.toFixed(2) : "N/A"}
                    </p>
                  </div>

                  {/* Range & IQR */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      Dispersion (Range &amp; IQR)
                    </p>
                    <p className="text-xl font-bold font-mono text-foreground mt-1">
                      IQR: {typeof statsResults.iqr === "number" ? statsResults.iqr.toFixed(2) : "N/A"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Total Range: {statsResults.range}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground rounded-xl border border-dashed">
                  No numeric response values found for this selection. Try selecting another question or entering custom numbers.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
