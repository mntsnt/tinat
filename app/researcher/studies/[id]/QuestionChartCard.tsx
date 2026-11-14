"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import {
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  ImageDown,
  Check,
  FileCode,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";

export const PALETTE = [
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

export interface QuestionChartItem {
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface QuestionChartCardProps {
  questionId: string;
  questionText: string;
  questionType: string;
  figureIndex: number;
  studyTitle: string;
  items: QuestionChartItem[];
  totalAnswers: number;
  totalStudyN: number;
  filterQuestionId?: string | null;
  filterValue?: string | null;
  onStratify?: (questionId: string, label: string) => void;
}

// Math helpers for SVG Donut/Pie
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeDonutSlice(
  x: number,
  y: number,
  radius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  // If a single slice covers nearly 360 degrees
  if (endAngle - startAngle >= 359.9) {
    return [
      `M ${x - radius} ${y}`,
      `A ${radius} ${radius} 0 1 0 ${x + radius} ${y}`,
      `A ${radius} ${radius} 0 1 0 ${x - radius} ${y}`,
      `M ${x - innerRadius} ${y}`,
      `A ${innerRadius} ${innerRadius} 0 1 1 ${x + innerRadius} ${y}`,
      `A ${innerRadius} ${innerRadius} 0 1 1 ${x - innerRadius} ${y}`,
      "Z",
    ].join(" ");
  }

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const innerStart = polarToCartesian(x, y, innerRadius, endAngle);
  const innerEnd = polarToCartesian(x, y, innerRadius, startAngle);

  const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
    "L", innerEnd.x, innerEnd.y,
    "A", innerRadius, innerRadius, 0, arcSweep, 1, innerStart.x, innerStart.y,
    "Z",
  ].join(" ");
}

export function QuestionChartCard({
  questionId,
  questionText,
  questionType,
  figureIndex,
  studyTitle,
  items,
  totalAnswers,
  totalStudyN,
  filterQuestionId,
  filterValue,
  onStratify,
}: QuestionChartCardProps) {
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [metricMode, setMetricMode] = useState<"count" | "percent">("count");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const isMultiChoice = questionType === "MULTIPLE_CHOICE";
  const typeLabel = isMultiChoice ? "Multi-Choice" : "Single Choice";

  const totalItemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.count, 0);
  }, [items]);

  const maxVal = useMemo(() => {
    const vals = items.map((i) => (metricMode === "count" ? i.count : i.percent));
    return Math.max(...vals, 1);
  }, [items, metricMode]);

  // Compute donut slices
  const donutSlices = useMemo(() => {
    if (totalItemCount === 0) return [];
    let currentAngle = 0;
    return items.map((item, idx) => {
      const sliceAngle = (item.count / totalItemCount) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle += sliceAngle;
      return {
        ...item,
        index: idx,
        startAngle,
        endAngle,
        path: describeDonutSlice(150, 150, 110, 62, startAngle, endAngle),
      };
    });
  }, [items, totalItemCount]);

  // Client-side High-Resolution PNG & SVG Exporter
  const handleExportImage = useCallback(
    async (format: "png" | "svg") => {
      setIsExporting(true);
      setShowExportMenu(false);

      try {
        const width = 800;
        const height = 540;
        const filename = `Figure_${figureIndex}_${questionText.slice(0, 24).replace(/[^a-zA-Z0-9]/g, "_")}_${chartType}.${format}`;

        // Construct high-resolution standalone SVG document with baked-in styles & publication typography
        const svgHeader = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <style>
              .bg { fill: #ffffff; }
              .pub-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; fill: #059669; text-transform: uppercase; letter-spacing: 0.5px; }
              .study-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; fill: #475569; }
              .fig-heading { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; fill: #0f172a; }
              .meta-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; fill: #64748b; }
              .axis-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; fill: #64748b; text-anchor: middle; }
              .bar-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; fill: #0f172a; text-anchor: middle; }
              .legend-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 500; fill: #334155; }
              .legend-sub { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; fill: #64748b; }
              .grid-line { stroke: #e2e8f0; stroke-width: 1; stroke-dasharray: 3 3; }
              .axis-line { stroke: #cbd5e1; stroke-width: 1.5; }
              .footer { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10px; fill: #94a3b8; }
            </style>
            <rect width="${width}" height="${height}" class="bg" rx="12" />
            
            <!-- Header Banner -->
            <g transform="translate(36, 32)">
              <text y="0" class="pub-title">Tinat Research Platform &bull; Empirical Figure</text>
              <text y="18" class="study-title">${studyTitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").slice(0, 80)}</text>
              <text y="40" class="fig-heading">Figure ${figureIndex}: ${questionText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").slice(0, 75)}</text>
              <text y="58" class="meta-text">Sample Size: N = ${totalAnswers} &bull; Type: ${typeLabel} &bull; Visual Model: ${chartType === "bar" ? "Frequency Bar Graph" : "Proportional Donut Chart"}</text>
            </g>
        `;

        let svgBody = "";

        if (chartType === "bar") {
          // Render SVG Vertical Bars
          const plotLeft = 60;
          const plotTop = 130;
          const plotWidth = width - 120;
          const plotHeight = 310;
          const barCount = items.length;
          const slotWidth = plotWidth / Math.max(1, barCount);
          const barWidth = Math.min(68, Math.max(24, slotWidth * 0.65));

          // 4 Gridlines
          let gridSvg = "";
          for (let step = 0; step <= 4; step++) {
            const stepVal = Math.round((maxVal / 4) * step);
            const yPos = plotTop + plotHeight - (plotHeight / 4) * step;
            gridSvg += `
              <line x1="${plotLeft}" y1="${yPos}" x2="${plotLeft + plotWidth}" y2="${yPos}" class="grid-line" />
              <text x="${plotLeft - 10}" y="${yPos + 4}" class="meta-text" style="text-anchor: end; font-size: 10px;">${metricMode === "count" ? stepVal : `${stepVal}%`}</text>
            `;
          }

          // Bars
          let barsSvg = "";
          items.forEach((item, idx) => {
            const val = metricMode === "count" ? item.count : item.percent;
            const barH = maxVal > 0 ? (val / maxVal) * plotHeight : 0;
            const barX = plotLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
            const barY = plotTop + plotHeight - barH;
            const labelX = barX + barWidth / 2;
            const cleanLabel = item.label.slice(0, 18).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

            barsSvg += `
              <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barH}" rx="5" fill="${item.color}" />
              <text x="${labelX}" y="${Math.max(plotTop + 14, barY - 8)}" class="bar-val">${item.count} (${item.percent}%)</text>
              <text x="${labelX}" y="${plotTop + plotHeight + 20}" class="axis-label">${cleanLabel}</text>
            `;
          });

          svgBody = `
            ${gridSvg}
            <line x1="${plotLeft}" y1="${plotTop + plotHeight}" x2="${plotLeft + plotWidth}" y2="${plotTop + plotHeight}" class="axis-line" />
            ${barsSvg}
          `;
        } else {
          // Render SVG Pie / Donut Chart with Legend on Right
          const centerX = 230;
          const centerY = 290;
          const outerR = 140;
          const innerR = 78;

          let slicesSvg = "";
          let currentDeg = 0;
          items.forEach((item) => {
            if (totalItemCount === 0) return;
            const sliceDeg = (item.count / totalItemCount) * 360;
            const pathD = describeDonutSlice(centerX, centerY, outerR, innerR, currentDeg, currentDeg + sliceDeg);
            currentDeg += sliceDeg;
            slicesSvg += `<path d="${pathD}" fill="${item.color}" stroke="#ffffff" stroke-width="2" />`;
          });

          // Center Text
          const centerText = `
            <text x="${centerX}" y="${centerY - 4}" text-anchor="middle" style="font-family: -apple-system, sans-serif; font-size: 24px; font-weight: 800; fill: #0f172a;">${totalAnswers}</text>
            <text x="${centerX}" y="${centerY + 16}" text-anchor="middle" style="font-family: -apple-system, sans-serif; font-size: 11px; font-weight: 600; fill: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Responses</text>
          `;

          // Legend on Right
          const legendX = 430;
          const legendStartY = 160;
          let legendSvg = "";
          items.slice(0, 10).forEach((item, idx) => {
            const itemY = legendStartY + idx * 30;
            const cleanLabel = item.label.slice(0, 24).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            legendSvg += `
              <g transform="translate(${legendX}, ${itemY})">
                <rect x="0" y="2" width="12" height="12" rx="3" fill="${item.color}" />
                <text x="20" y="12" class="legend-text">${cleanLabel}</text>
                <text x="290" y="12" class="legend-sub" text-anchor="end">${item.count} (${item.percent}%)</text>
              </g>
            `;
          });

          svgBody = `
            ${slicesSvg}
            ${centerText}
            ${legendSvg}
          `;
        }

        const svgFooter = `
            <!-- Footer -->
            <text x="36" y="${height - 24}" class="footer">Exported from Tinat Platform &bull; Validated Medical Study Data &bull; Date: ${new Date().toLocaleDateString()}</text>
          </svg>
        `;

        const fullSvgString = `${svgHeader}\n${svgBody}\n${svgFooter}`;

        if (format === "svg") {
          // Vector SVG Download
          const blob = new Blob([fullSvgString], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setExportedFormat("svg");
          setTimeout(() => setExportedFormat(null), 3000);
        } else {
          // High-Res 2x PNG Rasterizer Download
          const svgBlob = new Blob([fullSvgString], { type: "image/svg+xml;charset=utf-8" });
          const svgUrl = URL.createObjectURL(svgBlob);
          const img = new Image();

          img.onload = () => {
            const scale = 2; // 2x retina crispness
            const canvas = document.createElement("canvas");
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext("2d");

            if (ctx) {
              ctx.scale(scale, scale);
              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob((blob) => {
                if (blob) {
                  const pngUrl = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = pngUrl;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(pngUrl);
                  setExportedFormat("png");
                  setTimeout(() => setExportedFormat(null), 3000);
                }
              }, "image/png");
            }

            URL.revokeObjectURL(svgUrl);
          };

          img.src = svgUrl;
        }
      } catch (err) {
        console.error("Export error:", err);
      } finally {
        setIsExporting(false);
      }
    },
    [chartType, figureIndex, items, maxVal, metricMode, questionText, studyTitle, totalAnswers, totalItemCount, typeLabel]
  );

  return (
    <Card className="border-border hover:border-primary/40 transition-colors shadow-xs flex flex-col justify-between">
      {/* ── CARD HEADER ── */}
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Figure {figureIndex} &bull; {typeLabel}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                N = {totalAnswers}
              </span>
            </div>
            <CardTitle className="text-base font-semibold text-foreground line-clamp-2 leading-snug">
              {questionText}
            </CardTitle>
          </div>

          {/* Quick Toolbar: Bar vs Pie, Count vs %, Export Image */}
          <div className="flex items-center gap-1.5 self-start shrink-0">
            {/* View Mode Toggle: Bar vs Pie */}
            <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                title="Switch to Bar Graph"
                className={`p-1.5 rounded-md transition-colors ${
                  chartType === "bar"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType("pie")}
                title="Switch to Pie / Donut Chart"
                className={`p-1.5 rounded-md transition-colors ${
                  chartType === "pie"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Metric Mode Toggle: Count vs Percent */}
            <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setMetricMode("count")}
                title="Display Raw Counts"
                className={`px-2 py-1 rounded-md transition-colors ${
                  metricMode === "count"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                #
              </button>
              <button
                type="button"
                onClick={() => setMetricMode("percent")}
                title="Display Percentages"
                className={`px-2 py-1 rounded-md transition-colors ${
                  metricMode === "percent"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                %
              </button>
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                title="Download this figure as an image"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs"
              >
                {exportedFormat ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <ImageDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg space-y-1">
                  <button
                    type="button"
                    onClick={() => handleExportImage("png")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted text-left transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Download PNG Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportImage("svg")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted text-left transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5 text-purple-500" />
                    <span>Download Vector SVG</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* ── CARD CONTENT & CHART VISUALIZATION ── */}
      <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-between" ref={chartContainerRef}>
        {items.length === 0 || totalAnswers === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No participant responses recorded for this question yet.
          </div>
        ) : chartType === "bar" ? (
          /* ════════════════════ BAR GRAPH MODE ════════════════════ */
          <div className="space-y-3">
            {/* Horizontal Bar Breakdown for Clear Label Readability */}
            <div className="space-y-2">
              {items.map((item, idx) => {
                const isThisFilter = filterQuestionId === questionId && filterValue === item.label;
                const barWidth = Math.max(4, Math.round(((metricMode === "count" ? item.count : item.percent) / maxVal) * 100));

                return (
                  <div
                    key={item.label}
                    onClick={() => onStratify?.(questionId, item.label)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`group p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isThisFilter
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-xs"
                        : hoveredIndex === idx
                        ? "bg-muted/50 border-border"
                        : "bg-card border-border/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-foreground truncate max-w-[65%] flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-md shrink-0 shadow-2xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="font-mono text-xs text-muted-foreground font-semibold">
                        <span className="text-foreground font-bold">
                          {metricMode === "count" ? item.count : `${item.percent}%`}
                        </span>{" "}
                        <span className="opacity-60 text-[11px] font-sans">
                          ({metricMode === "count" ? `${item.percent}%` : `${item.count} responses`})
                        </span>
                      </span>
                    </div>

                    {/* Fluid Track & Bar */}
                    <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
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
          </div>
        ) : (
          /* ════════════════════ PIE / DONUT CHART MODE ════════════════════ */
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative shrink-0 flex items-center justify-center">
              <svg width="220" height="220" viewBox="0 0 300 300" className="overflow-visible">
                {donutSlices.map((slice, idx) => {
                  const isHovered = hoveredIndex === idx;
                  return (
                    <path
                      key={slice.label}
                      d={slice.path}
                      fill={slice.color}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="transition-transform duration-200 cursor-pointer origin-center"
                      style={{
                        transform: isHovered ? "scale(1.04)" : "scale(1)",
                        filter: isHovered ? "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" : "none",
                      }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => onStratify?.(questionId, slice.label)}
                    >
                      <title>{`${slice.label}: ${slice.count} responses (${slice.percent}%)`}</title>
                    </path>
                  );
                })}
              </svg>

              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl font-black tracking-tight text-foreground">
                  {totalAnswers}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Responses
                </span>
              </div>
            </div>

            {/* Interactive Legend with Values */}
            <div className="w-full sm:w-auto flex-1 max-w-xs space-y-1.5">
              {items.map((item, idx) => {
                const isThisFilter = filterQuestionId === questionId && filterValue === item.label;
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={item.label}
                    onClick={() => onStratify?.(questionId, item.label)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`flex items-center justify-between gap-2 p-1.5 px-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isThisFilter
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : isHovered
                        ? "bg-muted text-foreground"
                        : "hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-foreground font-medium">{item.label}</span>
                    </span>
                    <span className="font-mono text-[11px] shrink-0 font-semibold text-foreground/80">
                      {item.count} <span className="opacity-60 font-sans">({item.percent}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Hint */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
          <span className="italic">
            {onStratify ? "Click any category to stratify dataset by this cohort." : "Export chart directly as publication image."}
          </span>
          <button
            type="button"
            onClick={() => handleExportImage("png")}
            className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            <span>Download Image</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
