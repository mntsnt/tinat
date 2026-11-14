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

// XML entity escaping for clean, strict SVG compliance
function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Safe Canvas 2D rounded rectangle painter with fallback
function drawCanvasRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w <= 0 || h <= 0) return;
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
}

// Pure Canvas 2D Renderer for instant, bulletproof PNG figure export
function renderChartToCanvas(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    scale: number;
    chartType: "bar" | "pie";
    metricMode: "count" | "percent";
    items: QuestionChartItem[];
    maxVal: number;
    totalAnswers: number;
    totalItemCount: number;
    figureIndex: number;
    questionText: string;
    studyTitle: string;
    typeLabel: string;
  }
) {
  const {
    width,
    height,
    scale,
    chartType,
    metricMode,
    items,
    maxVal,
    totalAnswers,
    totalItemCount,
    figureIndex,
    questionText,
    studyTitle,
    typeLabel,
  } = options;

  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.scale(scale, scale);

  // 1. Crisp White Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Outer Border & subtle frame
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  const padX = 40;
  let curY = 36;

  // 2. Publication Header
  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#059669";
  ctx.textAlign = "start";
  ctx.fillText("TINAT RESEARCH PLATFORM • EMPIRICAL FIGURE", padX, curY);

  curY += 22;
  // Study Title
  ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText(studyTitle.slice(0, 85), padX, curY);

  curY += 26;
  // Figure Number & Question Title (multi-line word wrap)
  ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#0f172a";
  const fullTitle = `Figure ${figureIndex}: ${questionText}`;
  const maxTitleWidth = width - padX * 2;
  const words = fullTitle.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTitleWidth && n > 0) {
      ctx.fillText(line.trim(), padX, curY);
      line = words[n] + " ";
      curY += 24;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), padX, curY);

  curY += 22;
  // Metadata row
  ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#64748b";
  const metaStr = `Sample Size: N = ${totalAnswers} • Type: ${typeLabel} • Visual Model: ${
    chartType === "bar" ? "Horizontal Frequency Bars" : "Proportional Donut Chart"
  } • Metric: ${metricMode === "count" ? "Raw Response Count" : "Cohort Percentage"}`;
  ctx.fillText(metaStr, padX, curY);

  curY += 18;
  // Divider line
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, curY);
  ctx.lineTo(width - padX, curY);
  ctx.stroke();

  curY += 26;

  // 3. Body Chart Rendering
  if (items.length === 0 || totalAnswers === 0) {
    ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("No participant responses recorded for this question yet.", width / 2, curY + 60);
    ctx.textAlign = "start";
  } else if (chartType === "bar") {
    // Horizontal Bars for maximum label readability
    const availableH = height - curY - 50;
    const rowH = Math.min(54, Math.max(38, availableH / items.length));
    const barAreaW = width - padX * 2;

    items.forEach((item, idx) => {
      const rowY = curY + idx * rowH;
      const val = metricMode === "count" ? item.count : item.percent;
      const ratio = maxVal > 0 ? Math.min(1, Math.max(0, val / maxVal)) : 0;

      // Color swatch pill
      ctx.fillStyle = item.color;
      ctx.beginPath();
      drawCanvasRoundRect(ctx, padX, rowY + 2, 11, 11, 3);
      ctx.fill();

      // Category label
      ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "start";
      ctx.fillText(item.label.slice(0, 50), padX + 18, rowY + 12);

      // Value badge on right: e.g. "45 (37.5%)"
      const badgeStr = `${item.count} (${item.percent}%)`;
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "end";
      ctx.fillText(badgeStr, width - padX, rowY + 12);
      ctx.textAlign = "start";

      // Track background
      const trackY = rowY + 18;
      const trackH = Math.max(8, Math.min(12, rowH - 26));
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      drawCanvasRoundRect(ctx, padX, trackY, barAreaW, trackH, trackH / 2);
      ctx.fill();

      // Value fill bar
      const fillW = Math.max(6, barAreaW * ratio);
      ctx.fillStyle = item.color;
      ctx.beginPath();
      drawCanvasRoundRect(ctx, padX, trackY, fillW, trackH, trackH / 2);
      ctx.fill();
    });
  } else {
    // Donut / Pie Chart Mode
    const chartCenterY = curY + (height - curY - 50) / 2;
    const centerX = padX + 130;
    const centerY = chartCenterY;
    const outerR = 95;
    const innerR = 54;

    if (totalItemCount > 0) {
      let currentAngle = -Math.PI / 2;
      items.forEach((item) => {
        if (item.count <= 0) return;
        const sliceAngle = (item.count / totalItemCount) * (2 * Math.PI);
        const nextAngle = currentAngle + sliceAngle;

        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerR, currentAngle, nextAngle);
        ctx.arc(centerX, centerY, innerR, nextAngle, currentAngle, true);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        currentAngle = nextAngle;
      });
    } else {
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerR, 0, 2 * Math.PI);
      ctx.arc(centerX, centerY, innerR, 2 * Math.PI, 0, true);
      ctx.closePath();
      ctx.fill();
    }

    // Donut Center Text
    ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.fillText(`${totalAnswers}`, centerX, centerY + 3);

    ctx.font = "600 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("RESPONSES", centerX, centerY + 18);
    ctx.textAlign = "start";

    // Legend on Right
    const legendX = padX + 270;
    const legendStartY = Math.max(curY + 10, chartCenterY - (items.length * 28) / 2);
    items.slice(0, 10).forEach((item, idx) => {
      const itemY = legendStartY + idx * 28;

      // Color Box
      ctx.fillStyle = item.color;
      ctx.beginPath();
      drawCanvasRoundRect(ctx, legendX, itemY + 2, 12, 12, 3);
      ctx.fill();

      // Label
      ctx.font = "500 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#334155";
      ctx.textAlign = "start";
      ctx.fillText(item.label.slice(0, 36), legendX + 20, itemY + 12);

      // Metric Badge
      const valStr = `${item.count} (${item.percent}%)`;
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "end";
      ctx.fillText(valStr, width - padX, itemY + 12);
      ctx.textAlign = "start";
    });
  }

  // 4. Publication Footer
  ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.textAlign = "start";
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  ctx.fillText(
    `Exported from Tinat Platform • Validated Medical Study Data • Generated: ${dateStr}`,
    padX,
    height - 18
  );
}

// Generate fully valid, standalone, standards-compliant Vector SVG
function generateFigureSvg(options: {
  width: number;
  height: number;
  chartType: "bar" | "pie";
  metricMode: "count" | "percent";
  items: QuestionChartItem[];
  maxVal: number;
  totalAnswers: number;
  totalItemCount: number;
  figureIndex: number;
  questionText: string;
  studyTitle: string;
  typeLabel: string;
}): string {
  const {
    width,
    height,
    chartType,
    metricMode,
    items,
    maxVal,
    totalAnswers,
    totalItemCount,
    figureIndex,
    questionText,
    studyTitle,
    typeLabel,
  } = options;

  const padX = 40;
  const safeStudyTitle = escapeXml(studyTitle.slice(0, 85));
  const safeQuestionText = escapeXml(questionText.slice(0, 85));
  const safeTypeLabel = escapeXml(typeLabel);
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  let bodySvg = "";

  if (items.length === 0 || totalAnswers === 0) {
    bodySvg = `
      <text x="${width / 2}" y="240" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#94a3b8">
        No participant responses recorded for this question yet.
      </text>
    `;
  } else if (chartType === "bar") {
    // Horizontal Bars
    const curY = 140;
    const availableH = height - curY - 50;
    const rowH = Math.min(54, Math.max(38, availableH / items.length));
    const barAreaW = width - padX * 2;

    let barsContent = "";
    items.forEach((item, idx) => {
      const rowY = curY + idx * rowH;
      const val = metricMode === "count" ? item.count : item.percent;
      const ratio = maxVal > 0 ? Math.min(1, Math.max(0, val / maxVal)) : 0;
      const fillW = Math.max(6, Math.round(barAreaW * ratio));
      const trackY = rowY + 18;
      const trackH = Math.max(8, Math.min(12, rowH - 26));

      barsContent += `
        <g>
          <!-- Color Swatch -->
          <rect x="${padX}" y="${rowY + 2}" width="11" height="11" rx="3" fill="${item.color}" />
          <!-- Label -->
          <text x="${padX + 18}" y="${rowY + 12}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#1e293b">${escapeXml(item.label.slice(0, 50))}</text>
          <!-- Value Badge -->
          <text x="${width - padX}" y="${rowY + 12}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#0f172a">${item.count} (${item.percent}%)</text>
          <!-- Track -->
          <rect x="${padX}" y="${trackY}" width="${barAreaW}" height="${trackH}" rx="${trackH / 2}" fill="#f1f5f9" />
          <!-- Fill Bar -->
          <rect x="${padX}" y="${trackY}" width="${fillW}" height="${trackH}" rx="${trackH / 2}" fill="${item.color}" />
        </g>
      `;
    });
    bodySvg = barsContent;
  } else {
    // Donut / Pie Chart Mode
    const curY = 140;
    const chartCenterY = curY + (height - curY - 50) / 2;
    const centerX = padX + 130;
    const centerY = chartCenterY;
    const outerR = 95;
    const innerR = 54;

    let slicesSvg = "";
    if (totalItemCount > 0) {
      let currentDeg = 0;
      items.forEach((item) => {
        if (item.count <= 0) return;
        const sliceDeg = (item.count / totalItemCount) * 360;
        const pathD = describeDonutSlice(centerX, centerY, outerR, innerR, currentDeg, currentDeg + sliceDeg);
        currentDeg += sliceDeg;
        slicesSvg += `<path d="${pathD}" fill="${item.color}" stroke="#ffffff" stroke-width="2.5" />\n`;
      });
    } else {
      slicesSvg = `<circle cx="${centerX}" cy="${centerY}" r="${outerR}" fill="#e2e8f0" stroke="#ffffff" stroke-width="2.5" />\n`;
    }

    // Legend on Right
    const legendX = padX + 270;
    const legendStartY = Math.max(curY + 10, chartCenterY - (items.length * 28) / 2);
    let legendSvg = "";
    items.slice(0, 10).forEach((item, idx) => {
      const itemY = legendStartY + idx * 28;
      legendSvg += `
        <g>
          <rect x="${legendX}" y="${itemY + 2}" width="12" height="12" rx="3" fill="${item.color}" />
          <text x="${legendX + 20}" y="${itemY + 12}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="#334155">${escapeXml(item.label.slice(0, 36))}</text>
          <text x="${width - padX}" y="${itemY + 12}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#0f172a">${item.count} (${item.percent}%)</text>
        </g>
      `;
    });

    bodySvg = `
      <g>
        ${slicesSvg}
        <!-- Center Hole -->
        <circle cx="${centerX}" cy="${centerY}" r="${innerR}" fill="#ffffff" />
        <text x="${centerX}" y="${centerY + 4}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="#0f172a">${totalAnswers}</text>
        <text x="${centerX}" y="${centerY + 18}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#64748b" letter-spacing="0.5">RESPONSES</text>
      </g>
      <g>
        ${legendSvg}
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Card Background -->
  <rect width="${width}" height="${height}" fill="#ffffff" rx="12" stroke="#e2e8f0" stroke-width="1" />

  <!-- Header Banner -->
  <g transform="translate(${padX}, 36)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#059669" letter-spacing="0.5">TINAT RESEARCH PLATFORM &#8226; EMPIRICAL FIGURE</text>
    <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#475569">${safeStudyTitle}</text>
    <text x="0" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="700" fill="#0f172a">Figure ${figureIndex}: ${safeQuestionText}</text>
    <text x="0" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748b">Sample Size: N = ${totalAnswers} &#8226; Type: ${safeTypeLabel} &#8226; Visual Model: ${chartType === "bar" ? "Horizontal Frequency Bars" : "Proportional Donut Chart"} &#8226; Metric: ${metricMode === "count" ? "Raw Response Count" : "Cohort Percentage"}</text>
    <line x1="0" y1="84" x2="${width - padX * 2}" y2="84" stroke="#e2e8f0" stroke-width="1" />
  </g>

  <!-- Chart Body -->
  ${bodySvg}

  <!-- Footer -->
  <text x="${padX}" y="${height - 18}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#94a3b8">Exported from Tinat Platform &#8226; Validated Medical Study Data &#8226; Generated: ${escapeXml(dateStr)}</text>
</svg>`;
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
        const sanitizedQuestion = questionText
          .trim()
          .slice(0, 30)
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .replace(/_+/g, "_");
        const filename = `Figure_${figureIndex}_${sanitizedQuestion || "Chart"}_${chartType}.${format}`;

        const width = 840;
        const height = Math.max(
          540,
          180 + items.length * (chartType === "bar" ? 46 : 32)
        );

        if (format === "svg") {
          const svgContent = generateFigureSvg({
            width,
            height,
            chartType,
            metricMode,
            items,
            maxVal,
            totalAnswers,
            totalItemCount,
            figureIndex,
            questionText,
            studyTitle,
            typeLabel,
          });

          const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
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
          // Direct HTML5 Canvas 2D PNG Export (instant & 100% reliable)
          const canvas = document.createElement("canvas");
          renderChartToCanvas(canvas, {
            width,
            height,
            scale: 2, // 2x high-DPI retina sharpness
            chartType,
            metricMode,
            items,
            maxVal,
            totalAnswers,
            totalItemCount,
            figureIndex,
            questionText,
            studyTitle,
            typeLabel,
          });

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              setExportedFormat("png");
              setTimeout(() => setExportedFormat(null), 3000);
            }
          }, "image/png");
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
                Figure {figureIndex} • {typeLabel}
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
            disabled={isExporting}
            className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            {isExporting ? (
              <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : exportedFormat === "png" ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            <span>
              {exportedFormat === "png"
                ? "Downloaded!"
                : isExporting
                ? "Exporting..."
                : "Download Image"}
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
