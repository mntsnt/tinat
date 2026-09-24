"use client";

import { useState, useMemo, useRef } from "react";
import {
  BarChart3,
  Activity,
  Sliders,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  Table as TableIcon,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";

export interface QuestionData {
  id: string;
  text: string;
  type: string;
  order: number;
  options?: Array<{ id: string; text: string; order: number }>;
  rows?: Array<{ id: string; text: string; order: number }>;
  scaleMin?: number | null;
  scaleMax?: number | null;
  scaleMinLabel?: string | null;
  scaleMaxLabel?: string | null;
}

export interface AnswerData {
  questionId: string;
  textValue?: string | null;
  numberValue?: number | null;
  selectedOptions?: string[];
  matrixAnswers?: any;
}

export interface ResponseItem {
  id: string;
  submittedAt: string | Date;
  answers: AnswerData[];
}

interface DataVisualizationStudioProps {
  studyTitle: string;
  questions: QuestionData[];
  responses: ResponseItem[];
  participantTarget?: number;
}

const PALETTE = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#84cc16", // lime
];

type CategoricalStats = {
  type: "categorical" | "multichoice";
  items: Array<{ label: string; count: number; percent: number; color: string }>;
  totalAnswers: number;
};

type LikertStats = {
  type: "likert";
  items: Array<{ score: number; count: number; percent: number; color: string }>;
  mean: string;
  stdDev: string;
  minLabel: string;
  maxLabel: string;
  totalAnswers: number;
};

type NumberStats = {
  type: "number";
  min: number;
  max: number;
  mean: string;
  median: number;
  totalAnswers: number;
};

type EmptyStats = {
  type: "empty" | "text";
  totalAnswers: number;
};

type QuestionStats = CategoricalStats | LikertStats | NumberStats | EmptyStats;

type ContingencySuccess = {
  insufficient: false;
  rowQ: QuestionData;
  colQ: QuestionData;
  matrix: Record<string, Record<string, number>>;
  rowValues: string[];
  colValues: string[];
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  validCount: number;
  chiSquare: number;
  df: number;
  pValue: number;
  isSignificant: boolean;
  oddsRatio: { value: number; ciLower: number; ciUpper: number } | null;
};

type ContingencyInsufficient = {
  insufficient: true;
  rowQ: QuestionData;
  colQ: QuestionData;
  matrix: Record<string, Record<string, number>>;
  rowValues: string[];
  colValues: string[];
  validCount: number;
};

type ContingencyData = ContingencySuccess | ContingencyInsufficient;

// Normal cumulative distribution function approximation
function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

// Approximate Chi-Square p-value using Wilson-Hilferty transformation
function chiSquarePValue(chiSq: number, df: number): number {
  if (chiSq <= 0 || df <= 0) return 1.0;
  if (df === 1) {
    return Math.max(0.0001, 2 * (1 - normalCdf(Math.sqrt(chiSq))));
  }
  const term1 = Math.pow(chiSq / df, 1 / 3);
  const term2 = 1 - 2 / (9 * df);
  const term3 = Math.sqrt(2 / (9 * df));
  const z = (term1 - term2) / term3;
  return Math.max(0.0001, Math.min(1.0, 1 - normalCdf(z)));
}

export function DataVisualizationStudio({
  studyTitle,
  questions,
  responses,
  participantTarget = 50,
}: DataVisualizationStudioProps) {
  // Tabs: "charts", "contingency", "simulation"
  const [activeTab, setActiveTab] = useState<"charts" | "contingency" | "simulation">("charts");
  const [metricDisplay, setMetricDisplay] = useState<"percent" | "count">("percent");

  // Cohort Filtering
  const [filterQuestionId, setFilterQuestionId] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<string | null>(null);

  // Contingency Matrix Variables
  const categoricalQuestions = useMemo(() => {
    return questions.filter(
      (q) =>
        q.type === "SINGLE_CHOICE" ||
        q.type === "YES_NO" ||
        q.type === "DROPDOWN" ||
        (q.options && q.options.length > 0)
    );
  }, [questions]);

  const [rowVarId, setRowVarId] = useState<string>(categoricalQuestions[0]?.id || "");
  const [colVarId, setColVarId] = useState<string>(categoricalQuestions[1]?.id || categoricalQuestions[0]?.id || "");

  // Power Simulation State
  const [effectSize, setEffectSize] = useState<number>(0.5); // medium
  const [alphaLevel, setAlphaLevel] = useState<number>(0.05);
  const [targetPower, setTargetPower] = useState<number>(0.8);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute Filtered Responses
  const filteredResponses = useMemo(() => {
    if (!filterQuestionId || !filterValue) return responses;
    return responses.filter((resp) => {
      const ans = resp.answers.find((a) => a.questionId === filterQuestionId);
      if (!ans) return false;
      if (ans.textValue === filterValue) return true;
      if (Array.isArray(ans.selectedOptions) && ans.selectedOptions.includes(filterValue)) return true;
      return false;
    });
  }, [responses, filterQuestionId, filterValue]);

  const totalN = filteredResponses.length;
  const rawN = responses.length;

  // Question Answer Statistics Extractor
  function getQuestionStats(q: QuestionData): QuestionStats {
    const rawAnswers = filteredResponses
      .map((r) => r.answers.find((a) => a.questionId === q.id))
      .filter(Boolean);

    // Single choice / Yes-No / Dropdown
    if (q.type === "SINGLE_CHOICE" || q.type === "YES_NO" || q.type === "DROPDOWN") {
      const counts: Record<string, number> = {};
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => (counts[opt.text] = 0));
      } else if (q.type === "YES_NO") {
        counts["Yes"] = 0;
        counts["No"] = 0;
      }

      rawAnswers.forEach((ans) => {
        const val = ans?.textValue;
        if (val) {
          counts[val] = (counts[val] || 0) + 1;
        }
      });

      const items = Object.entries(counts).map(([label, count], idx) => ({
        label,
        count,
        percent: totalN > 0 ? Math.round((count / totalN) * 100) : 0,
        color: PALETTE[idx % PALETTE.length],
      }));

      return { type: "categorical", items, totalAnswers: rawAnswers.length };
    }

    // Multiple Choice
    if (q.type === "MULTIPLE_CHOICE") {
      const counts: Record<string, number> = {};
      if (q.options) {
        q.options.forEach((opt) => (counts[opt.text] = 0));
      }

      rawAnswers.forEach((ans) => {
        if (Array.isArray(ans?.selectedOptions)) {
          ans.selectedOptions.forEach((opt) => {
            counts[opt] = (counts[opt] || 0) + 1;
          });
        }
      });

      const items = Object.entries(counts).map(([label, count], idx) => ({
        label,
        count,
        percent: totalN > 0 ? Math.round((count / totalN) * 100) : 0,
        color: PALETTE[idx % PALETTE.length],
      }));

      return { type: "multichoice", items, totalAnswers: rawAnswers.length };
    }

    // Linear scale (Likert)
    if (q.type === "LINEAR_SCALE") {
      const min = q.scaleMin || 1;
      const max = q.scaleMax || 5;
      const counts: Record<number, number> = {};
      for (let i = min; i <= max; i++) counts[i] = 0;

      const numbers: number[] = [];
      rawAnswers.forEach((ans) => {
        if (typeof ans?.numberValue === "number") {
          counts[ans.numberValue] = (counts[ans.numberValue] || 0) + 1;
          numbers.push(ans.numberValue);
        }
      });

      const mean = numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
      const stdDev =
        numbers.length > 1
          ? Math.sqrt(
              numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (numbers.length - 1)
            )
          : 0;

      const items = Object.entries(counts).map(([scoreStr, count], idx) => ({
        score: parseInt(scoreStr, 10),
        count,
        percent: totalN > 0 ? Math.round((count / totalN) * 100) : 0,
        color: PALETTE[idx % PALETTE.length],
      }));

      return {
        type: "likert",
        items,
        mean: mean.toFixed(2),
        stdDev: stdDev.toFixed(2),
        minLabel: q.scaleMinLabel || "Low",
        maxLabel: q.scaleMaxLabel || "High",
        totalAnswers: numbers.length,
      };
    }

    // Number
    if (q.type === "NUMBER") {
      const numbers = rawAnswers
        .map((a) => a?.numberValue)
        .filter((n): n is number => typeof n === "number")
        .sort((a, b) => a - b);

      if (numbers.length === 0) return { type: "empty", totalAnswers: 0 };

      const min = numbers[0];
      const max = numbers[numbers.length - 1];
      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      const median =
        numbers.length % 2 === 0
          ? (numbers[numbers.length / 2 - 1] + numbers[numbers.length / 2]) / 2
          : numbers[Math.floor(numbers.length / 2)];

      return {
        type: "number",
        min,
        max,
        mean: mean.toFixed(1),
        median,
        totalAnswers: numbers.length,
      };
    }

    return { type: "text", totalAnswers: rawAnswers.length };
  }

  // Cross-Tabulation & Chi-Square Calculation
  const contingencyResult = useMemo<ContingencyData | null>(() => {
    if (!rowVarId || !colVarId || rowVarId === colVarId) return null;
    const rowQ = questions.find((q) => q.id === rowVarId);
    const colQ = questions.find((q) => q.id === colVarId);
    if (!rowQ || !colQ) return null;

    // Determine row and col categories
    const rowValues =
      rowQ.options && rowQ.options.length > 0
        ? rowQ.options.map((o) => o.text)
        : rowQ.type === "YES_NO"
        ? ["Yes", "No"]
        : [];
    const colValues =
      colQ.options && colQ.options.length > 0
        ? colQ.options.map((o) => o.text)
        : colQ.type === "YES_NO"
        ? ["Yes", "No"]
        : [];

    if (rowValues.length === 0 || colValues.length === 0) return null;

    // Build Observed Matrix
    const matrix: Record<string, Record<string, number>> = {};
    rowValues.forEach((r) => {
      matrix[r] = {};
      colValues.forEach((c) => {
        matrix[r][c] = 0;
      });
    });

    let validCount = 0;
    filteredResponses.forEach((resp) => {
      const rAns = resp.answers.find((a) => a.questionId === rowVarId);
      const cAns = resp.answers.find((a) => a.questionId === colVarId);
      const rVal = rAns?.textValue;
      const cVal = cAns?.textValue;
      if (rVal && cVal && matrix[rVal] && matrix[rVal][cVal] !== undefined) {
        matrix[rVal][cVal]++;
        validCount++;
      }
    });

    if (validCount < 5) {
      return {
        insufficient: true,
        rowQ,
        colQ,
        matrix,
        rowValues,
        colValues,
        validCount,
      };
    }

    // Row totals and Col totals
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    rowValues.forEach((r) => (rowTotals[r] = 0));
    colValues.forEach((c) => (colTotals[c] = 0));

    rowValues.forEach((r) => {
      colValues.forEach((c) => {
        const val = matrix[r][c];
        rowTotals[r] += val;
        colTotals[c] += val;
      });
    });

    // Compute Chi-Square Statistic
    let chiSquare = 0;
    rowValues.forEach((r) => {
      colValues.forEach((c) => {
        const expected = (rowTotals[r] * colTotals[c]) / validCount;
        if (expected > 0) {
          const diff = matrix[r][c] - expected;
          chiSquare += (diff * diff) / expected;
        }
      });
    });

    const df = Math.max(1, (rowValues.length - 1) * (colValues.length - 1));
    const pValue = chiSquarePValue(chiSquare, df);

    // Odds Ratio if 2x2
    let oddsRatio: { value: number; ciLower: number; ciUpper: number } | null = null;
    if (rowValues.length === 2 && colValues.length === 2) {
      const a = matrix[rowValues[0]][colValues[0]];
      const b = matrix[rowValues[0]][colValues[1]];
      const c = matrix[rowValues[1]][colValues[0]];
      const d = matrix[rowValues[1]][colValues[1]];
      if (a > 0 && b > 0 && c > 0 && d > 0) {
        const or = (a * d) / (b * c);
        const logOr = Math.log(or);
        const se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
        oddsRatio = {
          value: parseFloat(or.toFixed(2)),
          ciLower: parseFloat(Math.exp(logOr - 1.96 * se).toFixed(2)),
          ciUpper: parseFloat(Math.exp(logOr + 1.96 * se).toFixed(2)),
        };
      }
    }

    return {
      insufficient: false,
      rowQ,
      colQ,
      matrix,
      rowValues,
      colValues,
      rowTotals,
      colTotals,
      validCount,
      chiSquare: parseFloat(chiSquare.toFixed(2)),
      df,
      pValue: parseFloat(pValue.toFixed(4)),
      isSignificant: pValue < 0.05,
      oddsRatio,
    };
  }, [rowVarId, colVarId, questions, filteredResponses]);

  // Statistical Power Curve Points
  const powerCurveData = useMemo(() => {
    const points: Array<{ n: number; power: number }> = [];
    const zAlpha = alphaLevel === 0.01 ? 2.576 : alphaLevel === 0.05 ? 1.96 : 1.645;

    for (let n = 10; n <= 250; n += 10) {
      const zBeta = effectSize * Math.sqrt(n / 4) - zAlpha;
      const power = normalCdf(zBeta);
      points.push({ n, power: Math.max(0, Math.min(1, power)) });
    }

    // Current recruited power
    const currentZBeta = effectSize * Math.sqrt(rawN / 4) - zAlpha;
    const currentPower = Math.max(0, Math.min(1, normalCdf(currentZBeta)));

    // Required N for target power
    const zTargetBeta =
      targetPower === 0.95 ? 1.645 : targetPower === 0.9 ? 1.282 : targetPower === 0.8 ? 0.842 : 0.524;
    const requiredN = Math.ceil(4 * Math.pow((zAlpha + zTargetBeta) / effectSize, 2));

    return { points, currentPower, requiredN };
  }, [effectSize, alphaLevel, targetPower, rawN]);

  // Export helper
  const handleExportSvg = () => {
    if (!containerRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${studyTitle} - Visual Figures</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            p { font-size: 13px; color: #666; margin-top: 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; page-break-inside: avoid; }
            .title { font-weight: 600; font-size: 14px; margin-bottom: 12px; }
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <h1>${studyTitle}</h1>
          <p>Tinat Medical Platform • Data Visualization Studio • Sample Size N = ${totalN} • Generated: ${new Date().toLocaleDateString()}</p>
          <div class="grid">
            ${containerRef.current.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* ── Studio Header & Sub-Navigation ──────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Activity className="h-4 w-4" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Data Visualization & Interactive Studio
            </h3>
            <Badge variant="outline" className="text-[11px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
              Live Figures &bull; N = {totalN}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Explore distributions, cross-tabulate cohort subgroups, test statistical significance, and simulate statistical power.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Selector */}
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs font-medium">
            <button
              onClick={() => setActiveTab("charts")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "charts"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              <span>Figures & Charts</span>
            </button>
            <button
              onClick={() => setActiveTab("contingency")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "contingency"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-purple-500" />
              <span>Hypothesis Testing (χ²)</span>
            </button>
            <button
              onClick={() => setActiveTab("simulation")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "simulation"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              <span>Power Simulation</span>
            </button>
          </div>

          {activeTab === "charts" && (
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs font-medium">
              <button
                onClick={() => setMetricDisplay("percent")}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  metricDisplay === "percent"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                % Percent
              </button>
              <button
                onClick={() => setMetricDisplay("count")}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  metricDisplay === "count"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                N Count
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSvg}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Figures</span>
          </Button>
        </div>
      </div>

      {/* ── Active Cohort Filter Pill ──────────────────────────── */}
      {filterQuestionId && filterValue && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Active Cohort Stratification:</strong> Filtered by{" "}
              <code className="bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold font-mono">
                {questions.find((q) => q.id === filterQuestionId)?.text.slice(0, 30)}... = &ldquo;{filterValue}&rdquo;
              </code>{" "}
              ({totalN} of {rawN} participants)
            </span>
          </div>
          <button
            onClick={() => {
              setFilterQuestionId(null);
              setFilterValue(null);
            }}
            className="flex items-center gap-1 font-semibold hover:underline"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filter
          </button>
        </div>
      )}

      {/* ── TAB 1: Figures & Charts Breakdown ──────────────────── */}
      {activeTab === "charts" && (
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questions.map((q, idx) => {
            const stats = getQuestionStats(q);

            // Categorical Donut & Bar chart
            if (stats.type === "categorical" || stats.type === "multichoice") {
              const maxVal = Math.max(...stats.items.map((i) => (metricDisplay === "percent" ? i.percent : i.count)), 1);

              return (
                <Card key={q.id} className="border-border hover:border-primary/40 transition-colors shadow-xs">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Figure {idx + 1} &bull; {stats.type === "categorical" ? "Single Choice" : "Multi-Choice"}
                        </span>
                        <CardTitle className="text-base font-semibold text-foreground line-clamp-2 mt-0.5">
                          {q.text}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[11px] font-medium">
                        N = {stats.totalAnswers}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    {/* Horizontal Bar Visualizer */}
                    <div className="space-y-2.5">
                      {stats.items.map((item) => {
                        const isThisFilter = filterQuestionId === q.id && filterValue === item.label;
                        const barWidth = Math.max(4, Math.round(((metricDisplay === "percent" ? item.percent : item.count) / maxVal) * 100));

                        return (
                          <div
                            key={item.label}
                            onClick={() => {
                              if (isThisFilter) {
                                setFilterQuestionId(null);
                                setFilterValue(null);
                              } else {
                                setFilterQuestionId(q.id);
                                setFilterValue(item.label);
                              }
                            }}
                            className={`group p-2 rounded-lg cursor-pointer transition-all ${
                              isThisFilter
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-medium text-foreground truncate max-w-[70%] flex items-center gap-1.5">
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                                {item.label}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                {metricDisplay === "percent" ? `${item.percent}%` : item.count}{" "}
                                <span className="opacity-60 font-sans text-[11px]">
                                  ({metricDisplay === "percent" ? `${item.count} responses` : `${item.percent}%`})
                                </span>
                              </span>
                            </div>

                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${barWidth}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-muted-foreground italic text-right pt-2 border-t border-border/40">
                      Click any bar above to stratify entire dataset by this cohort.
                    </p>
                  </CardContent>
                </Card>
              );
            }

            // Likert Scale Diverging Distribution
            if (stats.type === "likert") {
              return (
                <Card key={q.id} className="border-border hover:border-primary/40 transition-colors shadow-xs">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Figure {idx + 1} &bull; Likert Scale
                        </span>
                        <CardTitle className="text-base font-semibold text-foreground line-clamp-2 mt-0.5">
                          {q.text}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[11px] font-medium">
                        N = {stats.totalAnswers}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Cohort Mean (μ)</span>
                        <div className="text-xl font-bold text-foreground mt-0.5">{stats.mean}</div>
                        <span className="text-[10px] text-muted-foreground">Scale {q.scaleMin || 1} to {q.scaleMax || 5}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Std Deviation (σ)</span>
                        <div className="text-xl font-bold text-foreground mt-0.5">±{stats.stdDev}</div>
                        <span className="text-[10px] text-muted-foreground">Response variance</span>
                      </div>
                    </div>

                    {/* Scale Distribution Visualizer */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] text-muted-foreground font-medium mb-1">
                        <span>1: {stats.minLabel}</span>
                        <span>5: {stats.maxLabel}</span>
                      </div>

                      <div className="space-y-2">
                        {stats.items.map((item) => (
                          <div key={item.score} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-foreground">Score {item.score}</span>
                              <span className="text-muted-foreground font-mono">
                                {item.count} ({item.percent}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{
                                  width: `${item.percent}%`,
                                  opacity: 0.3 + item.score * 0.15,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            // Continuous Numerical Distribution
            if (stats.type === "number") {
              return (
                <Card key={q.id} className="border-border hover:border-primary/40 transition-colors shadow-xs">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Figure {idx + 1} &bull; Continuous Metric
                        </span>
                        <CardTitle className="text-base font-semibold text-foreground line-clamp-2 mt-0.5">
                          {q.text}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[11px] font-medium">
                        N = {stats.totalAnswers}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border text-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Min</span>
                        <div className="text-lg font-bold text-foreground mt-0.5">{stats.min}</div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Median</span>
                        <div className="text-lg font-bold text-foreground mt-0.5">{stats.median}</div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Mean (μ)</span>
                        <div className="text-lg font-bold text-foreground mt-0.5">{stats.mean}</div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Max</span>
                        <div className="text-lg font-bold text-foreground mt-0.5">{stats.max}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* ── TAB 2: Contingency Matrix & Hypothesis Testing (χ²) ─ */}
      {activeTab === "contingency" && (
        <Card className="border-border shadow-xs">
          <CardHeader className="border-b border-border bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-xs">
                    Hypothesis Testing
                  </Badge>
                  <span className="text-xs text-muted-foreground">Pearson&rsquo;s Chi-Square of Independence</span>
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Cross-Tabulation & Contingency Matrix
                </CardTitle>
              </div>

              {/* Variable Selectors */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground font-medium">Row Variable:</span>
                  <select
                    value={rowVarId}
                    onChange={(e) => setRowVarId(e.target.value)}
                    className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {categoricalQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.text.slice(0, 35)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground font-medium">Col Variable:</span>
                  <select
                    value={colVarId}
                    onChange={(e) => setColVarId(e.target.value)}
                    className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {categoricalQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.text.slice(0, 35)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {contingencyResult && !contingencyResult.insufficient ? (
              <>
                {/* Significance Summary Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                    contingencyResult.isSignificant
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                      : "bg-muted/40 border-border text-foreground"
                  }`}
                >
                  {contingencyResult.isSignificant ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">
                        {contingencyResult.isSignificant
                          ? "Statistically Significant Association Detected (p < 0.05)"
                          : "No Statistically Significant Association (p ≥ 0.05)"}
                      </span>
                      <Badge variant="outline" className="font-mono text-xs">
                        χ² = {contingencyResult.chiSquare}, df = {contingencyResult.df}, p = {contingencyResult.pValue}
                      </Badge>
                      {contingencyResult.oddsRatio && (
                        <Badge className="bg-purple-600 text-white text-xs">
                          Odds Ratio (OR) = {contingencyResult.oddsRatio.value} [95% CI: {contingencyResult.oddsRatio.ciLower}–{contingencyResult.oddsRatio.ciUpper}]
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed">
                      {contingencyResult.isSignificant
                        ? `The distribution of responses in "${contingencyResult.rowQ.text.slice(0, 45)}..." significantly depends on "${contingencyResult.colQ.text.slice(0, 45)}..." in this study cohort.`
                        : `The two variables appear statistically independent in this cohort. The observed variations are within expected sampling error.`}
                    </p>
                  </div>
                </div>

                {/* Contingency Table */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-3 border-r border-border">
                          {contingencyResult.rowQ.text.slice(0, 30)}... \ {contingencyResult.colQ.text.slice(0, 30)}...
                        </th>
                        {contingencyResult.colValues.map((c) => (
                          <th key={c} className="p-3 text-center border-r border-border">
                            {c}
                          </th>
                        ))}
                        <th className="p-3 text-center font-bold">Total Row</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {contingencyResult.rowValues.map((r) => (
                        <tr key={r} className="hover:bg-muted/20">
                          <td className="p-3 font-semibold text-foreground border-r border-border bg-muted/10">
                            {r}
                          </td>
                          {contingencyResult.colValues.map((c) => {
                            const count = contingencyResult.matrix[r][c];
                            const rowTotal = contingencyResult.rowTotals[r] || 1;
                            const pct = Math.round((count / rowTotal) * 100);
                            return (
                              <td key={c} className="p-3 text-center border-r border-border font-mono">
                                <span className="font-bold text-foreground">{count}</span>
                                <span className="text-xs text-muted-foreground block">({pct}%)</span>
                              </td>
                            );
                          })}
                          <td className="p-3 text-center font-mono font-bold bg-muted/10">
                            {contingencyResult.rowTotals[r]}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-bold border-t-2 border-border">
                        <td className="p-3 border-r border-border">Total Column</td>
                        {contingencyResult.colValues.map((c) => (
                          <td key={c} className="p-3 text-center border-r border-border font-mono">
                            {contingencyResult.colTotals[c]}
                          </td>
                        ))}
                        <td className="p-3 text-center font-mono text-primary">
                          {contingencyResult.validCount}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                Select two distinct categorical questions above to calculate cross-tabulation and Pearson&rsquo;s Chi-Square.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 3: Sample Size & Statistical Power Simulator ──── */}
      {activeTab === "simulation" && (
        <Card className="border-border shadow-xs">
          <CardHeader className="border-b border-border bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs">
                    Clinical Trial Simulator
                  </Badge>
                  <span className="text-xs text-muted-foreground">Post-Hoc & Prospective Power Modeling</span>
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Statistical Power & Sample Size Curve
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                Current Recruitment: {rawN} / {participantTarget} participants
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Simulation Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Anticipated Effect Size (Cohen&rsquo;s d):</span>
                  <span className="font-mono text-primary font-bold">{effectSize.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.2"
                  step="0.05"
                  value={effectSize}
                  onChange={(e) => setEffectSize(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Small (0.2)</span>
                  <span>Medium (0.5)</span>
                  <span>Large (0.8+)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Type I Error Rate (α):</span>
                  <span className="font-mono text-primary font-bold">{alphaLevel}</span>
                </div>
                <div className="flex gap-2">
                  {[0.01, 0.05, 0.1].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAlphaLevel(val)}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-all ${
                        alphaLevel === val
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      α = {val}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">Standard medical research threshold is α = 0.05</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Target Statistical Power:</span>
                  <span className="font-mono text-primary font-bold">{Math.round(targetPower * 100)}%</span>
                </div>
                <div className="flex gap-2">
                  {[0.7, 0.8, 0.9, 0.95].map((val) => (
                    <button
                      key={val}
                      onClick={() => setTargetPower(val)}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-all ${
                        targetPower === val
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {Math.round(val * 100)}%
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">80% is standard; 90% is high rigor</p>
              </div>
            </div>

            {/* Verdict Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-border bg-card text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Current Statistical Power</span>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    powerCurveData.currentPower >= 0.8
                      ? "text-emerald-500"
                      : powerCurveData.currentPower >= 0.6
                      ? "text-amber-500"
                      : "text-red-500"
                  }`}
                >
                  {Math.round(powerCurveData.currentPower * 100)}%
                </div>
                <span className="text-[10px] text-muted-foreground">with N = {rawN} participants</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Required Sample Size (N)</span>
                <div className="text-2xl font-bold text-primary mt-1">{powerCurveData.requiredN}</div>
                <span className="text-[10px] text-muted-foreground">for {Math.round(targetPower * 100)}% power at d = {effectSize}</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Study Power Status</span>
                <div className="text-sm font-bold mt-2">
                  {rawN >= powerCurveData.requiredN ? (
                    <span className="text-emerald-500 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Adequately Powered
                    </span>
                  ) : (
                    <span className="text-amber-500 flex items-center justify-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Need +{powerCurveData.requiredN - rawN} more
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {rawN >= powerCurveData.requiredN
                    ? "Sufficient to detect target effect"
                    : "Risk of Type II false-negative error"}
                </span>
              </div>
            </div>

            {/* Interactive SVG Power Curve */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Power vs. Sample Size Curve (α = {alphaLevel}, d = {effectSize})
              </h4>

              <div className="w-full h-56 relative">
                <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 0.8, 1.0].map((level) => {
                    const y = 180 - level * 160;
                    return (
                      <g key={level}>
                        <line
                          x1="40"
                          y1={y}
                          x2="480"
                          y2={y}
                          stroke={level === 0.8 ? "#10b981" : "currentColor"}
                          strokeOpacity={level === 0.8 ? 0.6 : 0.1}
                          strokeDasharray={level === 0.8 ? "4 4" : undefined}
                          strokeWidth="1"
                        />
                        <text
                          x="32"
                          y={y + 3}
                          fontSize="9"
                          fill="currentColor"
                          opacity="0.5"
                          textAnchor="end"
                        >
                          {Math.round(level * 100)}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Curve Path */}
                  <path
                    d={powerCurveData.points
                      .map((pt, i) => {
                        const x = 40 + ((pt.n - 10) / 240) * 440;
                        const y = 180 - pt.power * 160;
                        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                  />

                  {/* Current N Marker */}
                  {(() => {
                    const currentX = 40 + (Math.min(250, Math.max(10, rawN) - 10) / 240) * 440;
                    const currentY = 180 - powerCurveData.currentPower * 160;
                    return (
                      <g>
                        <line
                          x1={currentX}
                          y1="20"
                          x2={currentX}
                          y2="180"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        <circle cx={currentX} cy={currentY} r="5" fill="#ef4444" />
                        <text
                          x={currentX}
                          y={Math.max(15, currentY - 10)}
                          fontSize="10"
                          fontWeight="bold"
                          fill="#ef4444"
                          textAnchor="middle"
                        >
                          Current N={rawN} ({Math.round(powerCurveData.currentPower * 100)}%)
                        </text>
                      </g>
                    );
                  })()}

                  {/* X Axis Labels */}
                  {[10, 50, 100, 150, 200, 250].map((nVal) => {
                    const x = 40 + ((nVal - 10) / 240) * 440;
                    return (
                      <text
                        key={nVal}
                        x={x}
                        y="196"
                        fontSize="9"
                        fill="currentColor"
                        opacity="0.5"
                        textAnchor="middle"
                      >
                        N={nVal}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
