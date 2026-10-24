"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Download,
  Share2,
  Check,
  Sparkles,
  Smartphone,
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Copy,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Palette,
  Sliders,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

export type DeckTheme =
  | "tinat"
  | "dark"
  | "gradient"
  | "minimal"
  | "editorial"
  | "pop"
  | "crimson"
  | "sunset"
  | "mint"
  | "glass"
  | "custom";

export type DeckFormat = "story" | "square" | "portrait" | "landscape";

interface QuestionDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: {
    id: string;
    questionText: string;
    answerText?: string | null;
    createdAt?: string | Date;
  };
  recipient: {
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
}

interface ThemeConfig {
  id: DeckTheme;
  name: string;
  bgGradient: string[];
  textColor: string;
  questionCardBg: string;
  questionTextColor: string;
  answerTextColor: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  previewBg: string;
  fontFamily: "sans" | "serif";
}

const THEMES: ThemeConfig[] = [
  {
    id: "tinat",
    name: "Tinat Emerald",
    bgGradient: ["#022c22", "#064e3b", "#022c22"],
    textColor: "#ecfdf5",
    questionCardBg: "#042f2e",
    questionTextColor: "#ffffff",
    answerTextColor: "#a7f3d0",
    badgeBg: "#10b981",
    badgeText: "#ffffff",
    accentColor: "#10b981",
    previewBg: "from-emerald-950 via-teal-900 to-emerald-950",
    fontFamily: "sans",
  },
  {
    id: "dark",
    name: "Obsidian",
    bgGradient: ["#09090b", "#18181b", "#09090b"],
    textColor: "#fafafa",
    questionCardBg: "#1c1917",
    questionTextColor: "#f4f4f5",
    answerTextColor: "#e4e4e7",
    badgeBg: "#f97316",
    badgeText: "#ffffff",
    accentColor: "#f97316",
    previewBg: "from-zinc-950 via-zinc-900 to-zinc-950",
    fontFamily: "sans",
  },
  {
    id: "gradient",
    name: "Aurora",
    bgGradient: ["#4338ca", "#6d28d9", "#be185d"],
    textColor: "#ffffff",
    questionCardBg: "rgba(255, 255, 255, 0.96)",
    questionTextColor: "#1e1b4b",
    answerTextColor: "#ffffff",
    badgeBg: "rgba(255, 255, 255, 0.25)",
    badgeText: "#ffffff",
    accentColor: "#fbbf24",
    previewBg: "from-indigo-600 via-purple-600 to-pink-600",
    fontFamily: "sans",
  },
  {
    id: "minimal",
    name: "Clean Slate",
    bgGradient: ["#f8fafc", "#e2e8f0"],
    textColor: "#0f172a",
    questionCardBg: "#ffffff",
    questionTextColor: "#0f172a",
    answerTextColor: "#334155",
    badgeBg: "#0f172a",
    badgeText: "#ffffff",
    accentColor: "#059669",
    previewBg: "from-slate-100 to-slate-200 text-slate-900",
    fontFamily: "sans",
  },
  {
    id: "editorial",
    name: "Editorial",
    bgGradient: ["#fbf8f3", "#f4eee0"],
    textColor: "#292524",
    questionCardBg: "#ffffff",
    questionTextColor: "#1c1917",
    answerTextColor: "#44403c",
    badgeBg: "#78350f",
    badgeText: "#ffffff",
    accentColor: "#b45309",
    previewBg: "from-[#fbf8f3] to-[#f4eee0] text-stone-900",
    fontFamily: "serif",
  },
  {
    id: "pop",
    name: "Cyber Pop",
    bgGradient: ["#050814", "#0f172a", "#1e1035"],
    textColor: "#38bdf8",
    questionCardBg: "#0369a1",
    questionTextColor: "#f0f9ff",
    answerTextColor: "#e0e7ff",
    badgeBg: "#ec4899",
    badgeText: "#ffffff",
    accentColor: "#f43f5e",
    previewBg: "from-sky-950 via-indigo-950 to-fuchsia-950",
    fontFamily: "sans",
  },
  {
    id: "crimson",
    name: "Ruby Crimson",
    bgGradient: ["#3b0712", "#4c0519", "#1c040b"],
    textColor: "#ffe4e6",
    questionCardBg: "rgba(255, 255, 255, 0.95)",
    questionTextColor: "#4c0519",
    answerTextColor: "#ffe4e6",
    badgeBg: "#e11d48",
    badgeText: "#ffffff",
    accentColor: "#fbbf24",
    previewBg: "from-rose-950 via-rose-900 to-rose-950",
    fontFamily: "sans",
  },
  {
    id: "sunset",
    name: "Warm Sunset",
    bgGradient: ["#7c2d12", "#c2410c", "#ea580c"],
    textColor: "#fff7ed",
    questionCardBg: "rgba(255, 255, 255, 0.96)",
    questionTextColor: "#7c2d12",
    answerTextColor: "#fff7ed",
    badgeBg: "#ea580c",
    badgeText: "#ffffff",
    accentColor: "#fde047",
    previewBg: "from-orange-900 via-amber-700 to-orange-600",
    fontFamily: "sans",
  },
  {
    id: "mint",
    name: "Clean Mint",
    bgGradient: ["#042f2e", "#115e59", "#134e4a"],
    textColor: "#f0fdf4",
    questionCardBg: "rgba(255, 255, 255, 0.96)",
    questionTextColor: "#064e3b",
    answerTextColor: "#ecfdf5",
    badgeBg: "#10b981",
    badgeText: "#ffffff",
    accentColor: "#34d399",
    previewBg: "from-emerald-950 via-teal-900 to-emerald-950",
    fontFamily: "sans",
  },
  {
    id: "glass",
    name: "Glass Modern",
    bgGradient: ["#020617", "#0f172a", "#1e1b4b"],
    textColor: "#f8fafc",
    questionCardBg: "rgba(255, 255, 255, 0.12)",
    questionTextColor: "#ffffff",
    answerTextColor: "#cbd5e1",
    badgeBg: "#6366f1",
    badgeText: "#ffffff",
    accentColor: "#818cf8",
    previewBg: "from-slate-950 via-slate-900 to-indigo-950",
    fontFamily: "sans",
  },
];

interface DeckPreset {
  format: DeckFormat;
  themeId: DeckTheme;
  customBgStart?: string;
  customBgEnd?: string;
  customAccent?: string;
  showWatermark: boolean;
  showProfile: boolean;
  showAnonBadge: boolean;
  ultraHd: boolean;
  savedAt: string;
}

const PRESET_STORAGE_KEY = "tinat_ask_deck_preset_v1";

export function QuestionDeckModal({
  isOpen,
  onClose,
  question,
  recipient,
}: QuestionDeckModalProps) {
  // Format / Dimensions: story (9:16), square (1:1), portrait (4:5), landscape (16:9)
  const [format, setFormat] = useState<DeckFormat>("story");
  const [selectedTheme, setSelectedTheme] = useState<DeckTheme>("tinat");

  // Custom theme colors
  const [customBgStart, setCustomBgStart] = useState("#064e3b");
  const [customBgEnd, setCustomBgEnd] = useState("#022c22");
  const [customAccent, setCustomAccent] = useState("#10b981");

  // Elements
  const [showWatermark, setShowWatermark] = useState(true);
  const [showProfile, setShowProfile] = useState(true);
  const [showAnonBadge, setShowAnonBadge] = useState(true);

  // Quality: Ultra HD 4K Supersampling vs Standard
  const [ultraHd, setUltraHd] = useState(true);

  // Preset state
  const [hasSavedPreset, setHasSavedPreset] = useState(false);
  const [presetFeedback, setPresetFeedback] = useState<string | null>(null);

  // Export states
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load saved preset on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRESET_STORAGE_KEY);
      if (saved) {
        const preset: DeckPreset = JSON.parse(saved);
        setHasSavedPreset(true);
        if (preset.format) setFormat(preset.format);
        if (preset.themeId) setSelectedTheme(preset.themeId);
        if (preset.customBgStart) setCustomBgStart(preset.customBgStart);
        if (preset.customBgEnd) setCustomBgEnd(preset.customBgEnd);
        if (preset.customAccent) setCustomAccent(preset.customAccent);
        if (typeof preset.showWatermark === "boolean") setShowWatermark(preset.showWatermark);
        if (typeof preset.showProfile === "boolean") setShowProfile(preset.showProfile);
        if (typeof preset.showAnonBadge === "boolean") setShowAnonBadge(preset.showAnonBadge);
        if (typeof preset.ultraHd === "boolean") setUltraHd(preset.ultraHd);
        setPresetFeedback("Applied your saved style preset");
        const t = setTimeout(() => setPresetFeedback(null), 3000);
        return () => clearTimeout(t);
      }
    } catch (e) {
      console.error("Could not load saved deck preset", e);
    }
  }, []);

  const handleSavePreset = () => {
    try {
      const preset: DeckPreset = {
        format,
        themeId: selectedTheme,
        customBgStart,
        customBgEnd,
        customAccent,
        showWatermark,
        showProfile,
        showAnonBadge,
        ultraHd,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(preset));
      setHasSavedPreset(true);
      setPresetFeedback("Saved! All future social decks will open with this style.");
      setTimeout(() => setPresetFeedback(null), 4000);
    } catch (e) {
      console.error("Could not save deck preset", e);
    }
  };

  const handleClearPreset = () => {
    try {
      localStorage.removeItem(PRESET_STORAGE_KEY);
      setHasSavedPreset(false);
      setPresetFeedback("Preset cleared. Reverted to Tinat default.");
      setTimeout(() => setPresetFeedback(null), 3000);
    } catch (e) {
      console.error("Could not clear deck preset", e);
    }
  };

  // Determine current active theme configuration
  const activeTheme: ThemeConfig =
    selectedTheme === "custom"
      ? {
          id: "custom",
          name: "Custom Palette",
          bgGradient: [customBgStart, customBgEnd],
          textColor: "#ffffff",
          questionCardBg: "rgba(255, 255, 255, 0.95)",
          questionTextColor: "#09090b",
          answerTextColor: "#ffffff",
          badgeBg: customAccent,
          badgeText: "#ffffff",
          accentColor: customAccent,
          previewBg: "from-emerald-900 to-zinc-950",
          fontFamily: "sans",
        }
      : THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dimensions config per format
    const formatDims: Record<
      DeckFormat,
      { w: number; h: number; startY: number; marginX: number; footerOffset: number }
    > = {
      story: { w: 1080, h: 1920, startY: 360, marginX: 90, footerOffset: 160 },
      portrait: { w: 1080, h: 1350, startY: 150, marginX: 90, footerOffset: 110 },
      square: { w: 1080, h: 1080, startY: 100, marginX: 80, footerOffset: 95 },
      landscape: { w: 1200, h: 675, startY: 44, marginX: 80, footerOffset: 65 },
    };

    const cfg = formatDims[format];
    // Scale for Ultra-HD Crisp 2x Supersampling
    const scale = ultraHd ? 2 : 1;

    canvas.width = cfg.w * scale;
    canvas.height = cfg.h * scale;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Apply supersampling transform
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const width = cfg.w;
    const height = cfg.h;

    // 1. Draw Background Gradient
    if (activeTheme.bgGradient.length === 1) {
      ctx.fillStyle = activeTheme.bgGradient[0];
      ctx.fillRect(0, 0, width, height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      const step = 1 / (activeTheme.bgGradient.length - 1);
      activeTheme.bgGradient.forEach((color, i) => {
        grad.addColorStop(i * step, color);
      });
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Ambient radial overlay for studio lighting
    const radial = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      120,
      width / 2,
      height * 0.35,
      width * 0.85
    );
    radial.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    radial.addColorStop(1, "rgba(0, 0, 0, 0.22)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    const marginX = cfg.marginX;
    const cardWidth = width - marginX * 2;
    let startY = cfg.startY;

    // 3. Draw Header (Avatar + Name + Handle)
    const avatarRadius = format === "landscape" ? 34 : 42;
    const avatarX = marginX + avatarRadius;
    const avatarY = startY + avatarRadius;
    let questionCardY = startY;

    if (showProfile) {
      // Avatar circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = activeTheme.accentColor;
      ctx.fill();

      // Initials in avatar
      const initials = (recipient.displayName || recipient.username || "T")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const initialsFontSize = format === "landscape" ? 26 : 34;
      ctx.font = `bold ${initialsFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials, avatarX, avatarY);
      ctx.restore();

      // Display name
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const nameFontSize = format === "landscape" ? 30 : 38;
      ctx.font = `bold ${nameFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = activeTheme.textColor;
      const maxHeaderWidth = cardWidth - (avatarRadius * 2 + 30);
      let displayName = recipient.displayName || recipient.username;
      while (ctx.measureText(displayName).width > maxHeaderWidth && displayName.length > 4) {
        displayName = displayName.slice(0, -2) + "…";
      }
      ctx.fillText(displayName, avatarX + avatarRadius + 22, avatarY - 3);

      const handleFontSize = format === "landscape" ? 22 : 26;
      ctx.font = `500 ${handleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle =
        activeTheme.id === "minimal" || activeTheme.id === "editorial"
          ? "rgba(0, 0, 0, 0.6)"
          : "rgba(255, 255, 255, 0.7)";
      let handleText = `@${recipient.username}`;
      while (ctx.measureText(handleText).width > maxHeaderWidth && handleText.length > 4) {
        handleText = handleText.slice(0, -2) + "…";
      }
      ctx.fillText(handleText, avatarX + avatarRadius + 22, avatarY + (format === "landscape" ? 26 : 30));
      ctx.restore();

      questionCardY = avatarY + avatarRadius + (format === "landscape" ? 30 : 45);
    }

    // 4. Draw Question Card
    const questionPadding = format === "landscape" ? 34 : 46;
    const maxQuestionWidth = cardWidth - questionPadding * 2;
    const questionFontSize =
      format === "landscape" ? 28 : format === "square" ? 34 : 36;
    const questionFont =
      activeTheme.fontFamily === "serif"
        ? `italic 600 ${questionFontSize + 2}px Georgia, serif`
        : `600 ${questionFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    const questionLineHeight = format === "landscape" ? 40 : 50;
    const questionLines = wrapText(ctx, question.questionText, maxQuestionWidth, questionFont);
    const questionTextHeight = questionLines.length * questionLineHeight;

    const badgeHeight = showAnonBadge ? (format === "landscape" ? 36 : 42) : 0;
    const badgeMargin = showAnonBadge ? (format === "landscape" ? 16 : 20) : 0;
    const questionCardHeight = questionPadding * 2 + badgeHeight + badgeMargin + questionTextHeight;

    // Draw question card with subtle elevation shadow
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;

    drawRoundedRect(
      ctx,
      marginX,
      questionCardY,
      cardWidth,
      questionCardHeight,
      format === "landscape" ? 24 : 30,
      activeTheme.questionCardBg,
      activeTheme.id === "minimal" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.18)"
    );
    ctx.restore();

    const badgeX = marginX + questionPadding;
    const badgeY = questionCardY + questionPadding;

    if (showAnonBadge) {
      const badgeW = format === "landscape" ? 220 : 250;
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeHeight, badgeHeight / 2, activeTheme.badgeBg);

      ctx.save();
      const badgeFontSize = format === "landscape" ? 17 : 19;
      ctx.font = `bold ${badgeFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = activeTheme.badgeText;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ANONYMOUS QUESTION", badgeX + badgeW / 2, badgeY + badgeHeight / 2);
      ctx.restore();
    }

    // Question lines
    ctx.save();
    ctx.font = questionFont;
    ctx.fillStyle = activeTheme.questionTextColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let currentY = badgeY + (showAnonBadge ? badgeHeight + (format === "landscape" ? 18 : 22) : 0);
    questionLines.forEach((line) => {
      ctx.fillText(line, badgeX, currentY);
      currentY += questionLineHeight;
    });
    ctx.restore();

    // 5. Draw Answer (if present)
    const answerGap = format === "landscape" ? 28 : 42;
    const answerStartY = questionCardY + questionCardHeight + answerGap;
    if (question.answerText && question.answerText.trim().length > 0) {
      const answerFontSize = format === "landscape" ? 28 : format === "square" ? 34 : 36;
      const answerFont =
        activeTheme.fontFamily === "serif"
          ? `${answerFontSize}px Georgia, serif`
          : `500 ${answerFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      const answerLineHeight = format === "landscape" ? 40 : 52;
      const answerLines = wrapText(ctx, question.answerText, cardWidth - 16, answerFont);

      ctx.save();
      ctx.font = answerFont;
      ctx.fillStyle = activeTheme.answerTextColor;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      let ansY = answerStartY;
      answerLines.forEach((line) => {
        ctx.fillText(line, marginX + 8, ansY);
        ansY += answerLineHeight;
      });
      ctx.restore();
    }

    // 6. Watermark / Ask link sticker pill (dynamically measured to fit any username length without overflowing)
    if (showWatermark) {
      const footerY = height - cfg.footerOffset;
      const pillText = `Ask me anything: tinat.app/ask/${recipient.username}`;

      let pillFontSize = format === "landscape" ? 18 : 22;
      ctx.font = `bold ${pillFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      let textWidth = ctx.measureText(pillText).width;

      const maxPillWidth = cardWidth;
      const horizontalPadding = format === "landscape" ? 36 : 46;
      let calculatedWidth = textWidth + horizontalPadding * 2;

      // If text is wider than available width, dynamically scale font to fit comfortably
      if (calculatedWidth > maxPillWidth) {
        const shrinkFactor = (maxPillWidth - horizontalPadding * 2) / textWidth;
        pillFontSize = Math.max(14, Math.floor(pillFontSize * shrinkFactor));
        ctx.font = `bold ${pillFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        textWidth = ctx.measureText(pillText).width;
        calculatedWidth = textWidth + horizontalPadding * 2;
      }

      const pillWidth = Math.min(maxPillWidth, calculatedWidth);
      const pillHeight = format === "landscape" ? 48 : 58;
      const pillX = (width - pillWidth) / 2;

      const pillBg =
        activeTheme.id === "minimal"
          ? "rgba(15, 23, 42, 0.88)"
          : activeTheme.id === "editorial"
          ? "rgba(41, 37, 36, 0.90)"
          : "rgba(0, 0, 0, 0.55)";
      const pillStroke =
        activeTheme.id === "minimal" || activeTheme.id === "editorial"
          ? "rgba(255, 255, 255, 0.22)"
          : "rgba(255, 255, 255, 0.25)";

      // Draw subtle shadow for floating sticker effect
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;

      drawRoundedRect(
        ctx,
        pillX,
        footerY,
        pillWidth,
        pillHeight,
        pillHeight / 2,
        pillBg,
        pillStroke
      );
      ctx.restore();

      // Draw centered text with guaranteed safe padding
      ctx.save();
      ctx.font = `bold ${pillFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        pillText,
        width / 2,
        footerY + pillHeight / 2
      );
      ctx.restore();
    }
  }, [
    format,
    ultraHd,
    activeTheme,
    showProfile,
    showAnonBadge,
    showWatermark,
    recipient,
    question,
  ]);

  useEffect(() => {
    if (isOpen) {
      renderCanvas();
    }
  }, [isOpen, renderCanvas]);

  if (!isOpen) return null;

  function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    fillColor: string,
    strokeColor?: string
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    font: string
  ): string[] {
    ctx.save();
    ctx.font = font;
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + " " + word;
      const width = ctx.measureText(testLine).width;
      if (width < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    ctx.restore();
    return lines;
  }

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tinat-ask-${recipient.username}-${format}-${ultraHd ? "4k" : "hd"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting high-res image:", err);
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );
      if (!blob) return;

      if (navigator.clipboard && "write" in navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        handleDownload();
      }
    } catch (err) {
      console.error("Clipboard copy error:", err);
      handleDownload();
    }
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );
      if (!blob) return;

      const file = new File(
        [blob],
        `tinat-ask-${recipient.username}-${format}.png`,
        { type: "image/png" }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Tinat Ask - ${recipient.displayName}`,
          text: `Ask me anything anonymously at tinat.app/ask/${recipient.username}`,
        });
      } else {
        handleDownload();
        const askUrl = `${window.location.origin}/ask/${recipient.username}`;
        await navigator.clipboard.writeText(askUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  }

  const askUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ask/${recipient.username}`
      : `tinat.app/ask/${recipient.username}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                Social Deck Studio
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Ultra-high quality deck exports for Instagram Stories, Reels, Telegram, WhatsApp & X
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {presetFeedback && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-in fade-in">
                <Check className="w-3 h-3" />
                {presetFeedback}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close social deck studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Body: Controls & Live Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-5 order-2 lg:order-1">
            {/* Dimensions Switcher */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Dimensions & Aspect Ratio
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {format === "story" && "1080 × 1920 (9:16)"}
                  {format === "square" && "1080 × 1080 (1:1)"}
                  {format === "portrait" && "1080 × 1350 (4:5)"}
                  {format === "landscape" && "1200 × 675 (16:9)"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat("story")}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    format === "story"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="font-semibold">Story (9:16)</span>
                  <span className="text-[10px] opacity-75">Reels & Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("square")}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    format === "square"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Square className="w-4 h-4" />
                  <span className="font-semibold">Square (1:1)</span>
                  <span className="text-[10px] opacity-75">Feed & Posts</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("portrait")}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    format === "portrait"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <RectangleVertical className="w-4 h-4" />
                  <span className="font-semibold">Portrait (4:5)</span>
                  <span className="text-[10px] opacity-75">IG Tall Feed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("landscape")}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    format === "landscape"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <RectangleHorizontal className="w-4 h-4" />
                  <span className="font-semibold">Banner (16:9)</span>
                  <span className="text-[10px] opacity-75">X & Channels</span>
                </button>
              </div>
            </div>

            {/* Themes & Palettes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  Color Palettes
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {THEMES.length} styles + custom
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {THEMES.map((theme) => {
                  const isSelected = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-medium transition-all ${
                        isSelected
                          ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-muted/70 text-foreground"
                          : "border-border hover:bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-gradient-to-tr ${theme.previewBg} border border-white/20 shrink-0 shadow-sm`}
                      />
                      <span className="truncate">{theme.name}</span>
                    </button>
                  );
                })}

                {/* Custom Color Mode Button */}
                <button
                  type="button"
                  onClick={() => setSelectedTheme("custom")}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-medium transition-all ${
                    selectedTheme === "custom"
                      ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-muted/70 text-foreground"
                      : "border-border hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-border shrink-0 shadow-sm"
                    style={{ background: customAccent }}
                  />
                  <span className="truncate font-semibold">Custom Studio</span>
                </button>
              </div>

              {/* Custom Color Editor when 'custom' is active */}
              {selectedTheme === "custom" && (
                <div className="mt-3 p-3 rounded-xl border border-border bg-card space-y-3">
                  <div className="text-xs font-semibold text-foreground">Custom Studio Colors</div>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="space-y-1 block">
                      <span className="text-[11px] text-muted-foreground block">Gradient Top</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customBgStart}
                          onChange={(e) => setCustomBgStart(e.target.value)}
                          className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono text-foreground">{customBgStart}</span>
                      </div>
                    </label>

                    <label className="space-y-1 block">
                      <span className="text-[11px] text-muted-foreground block">Gradient Bottom</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customBgEnd}
                          onChange={(e) => setCustomBgEnd(e.target.value)}
                          className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono text-foreground">{customBgEnd}</span>
                      </div>
                    </label>

                    <label className="space-y-1 block">
                      <span className="text-[11px] text-muted-foreground block">Accent Badge</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customAccent}
                          onChange={(e) => setCustomAccent(e.target.value)}
                          className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono text-foreground">{customAccent}</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Quality & Elements Controls */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Quality Switch */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  Rendering Quality
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUltraHd(true)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      ultraHd
                        ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="block font-bold">Ultra HD 4K</span>
                    <span className="text-[10px] opacity-75">2x Supersampled</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUltraHd(false)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      !ultraHd
                        ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="block font-bold">Standard HD</span>
                    <span className="text-[10px] opacity-75">1080p Web</span>
                  </button>
                </div>
              </div>

              {/* Elements Switch */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  Card Elements
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs">
                    <span>Profile Header & Avatar</span>
                    <input
                      type="checkbox"
                      checked={showProfile}
                      onChange={(e) => setShowProfile(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-emerald-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs">
                    <span>"Anonymous Question" Pill</span>
                    <input
                      type="checkbox"
                      checked={showAnonBadge}
                      onChange={(e) => setShowAnonBadge(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-emerald-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs">
                    <span>Ask Link Footer Sticker</span>
                    <input
                      type="checkbox"
                      checked={showWatermark}
                      onChange={(e) => setShowWatermark(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-emerald-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Preset Saver & Memory Card */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-foreground">Save as My Default Style</span>
                  {hasSavedPreset && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      <Check className="w-2.5 h-2.5" />
                      Active Preset
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Saves your chosen dimension, palette & element toggles for all future question decks.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSavePreset}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  Save Setting
                </button>

                {hasSavedPreset && (
                  <button
                    type="button"
                    onClick={handleClearPreset}
                    title="Clear saved preset"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs sm:text-sm shadow hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? "Exporting..." : `Download ${ultraHd ? "4K PNG" : "PNG"}`}
                </button>

                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border font-medium text-xs sm:text-sm hover:bg-muted transition-all"
                >
                  {copiedImage ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      Image Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Image
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border font-medium text-xs sm:text-sm hover:bg-muted transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share Deck
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(askUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied Ask Profile Link!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Ask Link ({askUrl})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-muted/20 rounded-2xl border border-border order-1 lg:order-2 min-h-[380px]">
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <span className="text-xs font-bold text-foreground">Live Render Preview</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {ultraHd ? "Ultra HD 4K" : "HD 1080p"}
              </span>
            </div>

            <div
              className={`relative overflow-hidden rounded-2xl shadow-2xl border border-border/80 transition-all ${
                format === "story"
                  ? "aspect-[9/16] w-full max-w-[270px] sm:max-w-[290px]"
                  : format === "square"
                  ? "aspect-square w-full max-w-[280px] sm:max-w-[320px]"
                  : format === "portrait"
                  ? "aspect-[4/5] w-full max-w-[280px] sm:max-w-[300px]"
                  : "aspect-[16/9] w-full max-w-[360px]"
              }`}
            >
              <canvas ref={canvasRef} className="w-full h-full object-contain block bg-black" />
            </div>

            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Real-time high-fidelity render ready for direct post & story sticker engagement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
