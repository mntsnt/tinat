"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Download,
  Share2,
  Check,
  Sparkles,
  Smartphone,
  Square,
  Copy,
  ExternalLink,
} from "lucide-react";

export type DeckTheme =
  | "minimal"
  | "dark"
  | "gradient"
  | "editorial"
  | "pop"
  | "mint"
  | "glass";

export type DeckFormat = "post" | "story";

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
  bgGradient: string[]; // For canvas gradient or fill
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
    bgGradient: ["#4f46e5", "#7c3aed", "#db2777"],
    textColor: "#ffffff",
    questionCardBg: "rgba(255, 255, 255, 0.95)",
    questionTextColor: "#1e1b4b",
    answerTextColor: "#ffffff",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    accentColor: "#fbbf24",
    previewBg: "from-indigo-600 via-purple-600 to-pink-600",
    fontFamily: "sans",
  },
  {
    id: "minimal",
    name: "Minimal",
    bgGradient: ["#f8fafc", "#f1f5f9"],
    textColor: "#0f172a",
    questionCardBg: "#ffffff",
    questionTextColor: "#0f172a",
    answerTextColor: "#334155",
    badgeBg: "#0f172a",
    badgeText: "#ffffff",
    accentColor: "#2563eb",
    previewBg: "from-slate-100 to-slate-200 text-slate-900",
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
    bgGradient: ["#0f172a", "#1e1b4b", "#311042"],
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

export function QuestionDeckModal({
  isOpen,
  onClose,
  question,
  recipient,
}: QuestionDeckModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<DeckTheme>("dark");
  const [format, setFormat] = useState<DeckFormat>("story");
  const [showWatermark, setShowWatermark] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const themeConfig = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  useEffect(() => {
    if (isOpen) {
      renderCanvas();
    }
  }, [isOpen, selectedTheme, format, showWatermark]);

  if (!isOpen) return null;

  function renderCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    // Post: 1080 x 1350
    // Story: 1080 x 1920
    const width = 1080;
    const height = format === "story" ? 1920 : 1350;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw Background
    if (themeConfig.bgGradient.length === 1) {
      ctx.fillStyle = themeConfig.bgGradient[0];
      ctx.fillRect(0, 0, width, height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      const step = 1 / (themeConfig.bgGradient.length - 1);
      themeConfig.bgGradient.forEach((color, i) => {
        grad.addColorStop(i * step, color);
      });
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Ambient radial overlay for sleek lighting
    const radial = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      100,
      width / 2,
      height * 0.35,
      width * 0.8
    );
    radial.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    radial.addColorStop(1, "rgba(0, 0, 0, 0.15)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // Geometry margins & card widths
    const marginX = 90;
    const cardWidth = width - marginX * 2;
    let startY = format === "story" ? 380 : 160;

    // 3. Draw Header (Avatar + Username handle)
    const avatarRadius = 42;
    const avatarX = marginX + avatarRadius;
    const avatarY = startY + avatarRadius;

    // Avatar background circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = themeConfig.accentColor;
    ctx.fill();

    // Initials in avatar
    const initials = (recipient.displayName || recipient.username || "T")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, avatarX, avatarY);
    ctx.restore();

    // Display Name and handle
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = themeConfig.textColor;
    ctx.fillText(recipient.displayName, avatarX + avatarRadius + 24, avatarY - 4);

    ctx.font = "500 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    if (themeConfig.id === "minimal" || themeConfig.id === "editorial") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    }
    ctx.fillText(`@${recipient.username}`, avatarX + avatarRadius + 24, avatarY + 32);
    ctx.restore();

    // 4. Draw Question Card
    const questionCardY = avatarY + avatarRadius + 50;

    // Calculate Question Text Height with wrap
    const questionPadding = 48;
    const maxQuestionWidth = cardWidth - questionPadding * 2;
    const questionFont =
      themeConfig.fontFamily === "serif"
        ? "italic 600 38px Georgia, serif"
        : "600 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const questionLineHeight = 52;
    const questionLines = wrapText(ctx, question.questionText, maxQuestionWidth, questionFont);
    const questionTextHeight = questionLines.length * questionLineHeight;

    const badgeHeight = 44;
    const questionCardHeight = questionPadding * 2 + badgeHeight + 20 + questionTextHeight;

    // Draw question card rounded rect
    drawRoundedRect(
      ctx,
      marginX,
      questionCardY,
      cardWidth,
      questionCardHeight,
      32,
      themeConfig.questionCardBg,
      "rgba(255, 255, 255, 0.15)"
    );

    // Pill Badge "Anonymous Question"
    const badgeX = marginX + questionPadding;
    const badgeY = questionCardY + questionPadding;
    drawRoundedRect(ctx, badgeX, badgeY, 260, badgeHeight, 22, themeConfig.badgeBg);

    ctx.save();
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = themeConfig.badgeText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ANONYMOUS QUESTION", badgeX + 130, badgeY + badgeHeight / 2);
    ctx.restore();

    // Draw Question Lines
    ctx.save();
    ctx.font = questionFont;
    ctx.fillStyle = themeConfig.questionTextColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let currentY = badgeY + badgeHeight + 24;
    questionLines.forEach((line) => {
      ctx.fillText(line, badgeX, currentY);
      currentY += questionLineHeight;
    });
    ctx.restore();

    // 5. Draw Answer (if present)
    const answerStartY = questionCardY + questionCardHeight + 50;
    if (question.answerText && question.answerText.trim().length > 0) {
      const answerFont =
        themeConfig.fontFamily === "serif"
          ? "38px Georgia, serif"
          : "500 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const answerLineHeight = 56;
      const answerLines = wrapText(ctx, question.answerText, cardWidth - 20, answerFont);

      ctx.save();
      ctx.font = answerFont;
      ctx.fillStyle = themeConfig.answerTextColor;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      let ansY = answerStartY;
      answerLines.forEach((line) => {
        ctx.fillText(line, marginX + 10, ansY);
        ansY += answerLineHeight;
      });
      ctx.restore();
    }

    // 6. Footer / Watermark
    if (showWatermark) {
      const footerY = height - (format === "story" ? 180 : 100);

      // Tinat Pill
      const pillWidth = 460;
      const pillHeight = 58;
      const pillX = (width - pillWidth) / 2;

      drawRoundedRect(
        ctx,
        pillX,
        footerY,
        pillWidth,
        pillHeight,
        29,
        "rgba(0, 0, 0, 0.4)",
        "rgba(255, 255, 255, 0.2)"
      );

      ctx.save();
      ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `Ask me anything: tinat.app/ask/${recipient.username}`,
        width / 2,
        footerY + pillHeight / 2
      );
      ctx.restore();
    }
  }

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
      a.download = `tinat-ask-${recipient.username}-${question.id.slice(0, 6)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting image:", err);
    } finally {
      setDownloading(false);
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
        `tinat-ask-${recipient.username}.png`,
        { type: "image/png" }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Tinat Ask - ${recipient.displayName}`,
          text: `Ask me anything anonymously at tinat.app/ask/${recipient.username}`,
        });
      } else {
        // Fallback: download image and copy link
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Generate Social Question Deck</h2>
              <p className="text-xs text-muted-foreground">
                Export crisp, high-res images ready for Instagram, Telegram, WhatsApp & X
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Preview & Controls */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
          {/* Controls Column */}
          <div className="md:col-span-6 space-y-6 flex flex-col justify-between order-2 md:order-1">
            <div className="space-y-5">
              {/* Format Switcher */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("story")}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      format === "story"
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    Story (9:16)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("post")}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      format === "post"
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    Post (4:5)
                  </button>
                </div>
              </div>

              {/* Theme Picker */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Theme Preset
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {THEMES.map((theme) => {
                    const isSelected = theme.id === selectedTheme;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-medium transition-all ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 bg-muted/60"
                            : "border-border hover:bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full bg-gradient-to-tr ${theme.previewBg} border border-white/20 shrink-0`}
                        />
                        <span className="truncate">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Watermark Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                <div>
                  <span className="text-sm font-medium">Show Ask Link Badge</span>
                  <p className="text-xs text-muted-foreground">
                    Includes tinat.app/ask/{recipient.username}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
              </div>

              {/* Direct share tips */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs space-y-1 text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Pro-tip for Instagram & Telegram
                </span>
                <p>
                  Download the image, post it to your Story or Channel, and paste your ask link sticker so your followers can tap and ask directly!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? "Exporting..." : "Download PNG"}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-muted transition-all"
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
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied your Ask Link!
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
          <div className="md:col-span-6 flex flex-col items-center justify-center p-4 bg-muted/20 rounded-xl border border-border order-1 md:order-2">
            <div className="text-xs text-muted-foreground mb-3 font-medium">
              Live Canvas Render ({format === "story" ? "1080×1920 Story" : "1080×1350 Post"})
            </div>
            <div
              className={`relative overflow-hidden rounded-2xl shadow-xl border border-border/60 max-w-[280px] sm:max-w-[320px] transition-all ${
                format === "story" ? "aspect-[9/16]" : "aspect-[4/5]"
              }`}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain block"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
