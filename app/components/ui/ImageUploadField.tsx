"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Replace, Sparkles, Check, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface PresetCover {
  id: string;
  title: string;
  category: string;
  url: string;
}

export const PRESET_COVER_IMAGES: PresetCover[] = [
  {
    id: "field-collector",
    title: "Field Survey & Data Collection",
    category: "Field Research",
    url: "/field-collector.png",
  },
  {
    id: "researcher-hero",
    title: "Clinical & Hospital Medicine",
    category: "Clinical",
    url: "/researcher-hero.png",
  },
  {
    id: "participant-study",
    title: "Community & Participant Health",
    category: "Community",
    url: "/participant-study.png",
  },
  {
    id: "collaborative-team",
    title: "Collaborative Research Team",
    category: "Team & Focus Group",
    url: "/collaborative-team.png",
  },
  {
    id: "digital-survey",
    title: "Digital Questionnaire & Mobile",
    category: "Survey Tools",
    url: "/assets/academy/modules/module-07-questionnaire-development.jpg",
  },
  {
    id: "health-science",
    title: "Health Science & Protocol",
    category: "Health Science",
    url: "/assets/academy/modules/module-01-intro-health-research.jpg",
  },
  {
    id: "epidemiology",
    title: "Epidemiology & Public Health",
    category: "Public Health",
    url: "/assets/academy/modules/module-08-epidemiology.jpg",
  },
  {
    id: "focus-group",
    title: "Qualitative Community Study",
    category: "Social & Behavioral",
    url: "/assets/academy/modules/module-11-qualitative-methods.jpg",
  },
];

type Props = {
  label: string;
  value?: string | null;
  aspect?: "16:9" | "1:1" | "4:3" | "3:4";
  showPresets?: boolean;
  onChange: (value: string | null, aspect: "16:9" | "1:1" | "4:3" | "3:4") => void;
};

export function ImageUploadField({
  label,
  value,
  aspect = "16:9",
  showPresets = true,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAspect, setSelectedAspect] = useState(aspect);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  async function upload(file: File) {
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be 8 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/research-images", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      onChange(data.dataUrl, selectedAspect);
      setIsPresetsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function selectPreset(url: string) {
    onChange(url, selectedAspect);
  }

  const isPresetSelected = (url: string) => value === url;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{label}</span>
        <select
          value={selectedAspect}
          onChange={(event) => {
            const next = event.target.value as "16:9" | "1:1" | "4:3" | "3:4";
            setSelectedAspect(next);
            onChange(value || null, next);
          }}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
          aria-label={`${label} aspect ratio`}
        >
          <option value="16:9">16:9 Wide banner</option>
          <option value="1:1">1:1 Square</option>
          <option value="4:3">4:3 Landscape</option>
          <option value="3:4">3:4 Portrait</option>
        </select>
      </div>

      {/* Active Preview */}
      {value ? (
        <div className="space-y-2">
          <div
            className="relative overflow-hidden rounded-xl border border-border bg-muted shadow-xs"
            style={{ aspectRatio: selectedAspect.replace(":", " / ") }}
          >
            <Image
              src={value}
              alt={`${label} preview`}
              fill
              sizes="(max-width: 768px) 100vw, 700px"
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {showPresets && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPresetsOpen((prev) => !prev)}
                className="gap-1.5 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                {isPresetsOpen ? "Hide presets" : "Change preset"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="gap-1.5 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload custom
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null, selectedAspect)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove cover
            </Button>
          </div>
        </div>
      ) : (
        /* Empty State: Choice between Presets & Upload */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {showPresets && (
              <button
                type="button"
                onClick={() => setIsPresetsOpen((prev) => !prev)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-all cursor-pointer",
                  isPresetsOpen
                    ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                    : "border-border bg-muted/20 hover:border-emerald-500/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="mb-2 rounded-full bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-foreground">Select from Presets</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Choose from 8 curated research covers
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center transition-all hover:border-emerald-500/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <div className="mb-2 rounded-full bg-primary/10 p-2.5 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {uploading ? "Uploading & optimizing..." : "Upload your own"}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                PNG, JPG, or WebP up to 8 MB
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Preset Library Grid */}
      {showPresets && (isPresetsOpen || !value) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-foreground">Preset Cover Library</span>
            </div>
            <span className="text-[11px] text-muted-foreground">Click any image to select</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESET_COVER_IMAGES.map((preset) => {
              const selected = isPresetSelected(preset.url);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset.url)}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all cursor-pointer",
                    selected
                      ? "border-emerald-600 ring-2 ring-emerald-500 shadow-sm"
                      : "border-border hover:border-foreground/40 hover:shadow-xs"
                  )}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    <img
                      src={preset.url}
                      alt={preset.title}
                      className="h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    {selected && (
                      <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="rounded-full bg-emerald-600 p-1 text-white shadow-xs">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-card">
                    <span className="block text-[11px] font-semibold text-foreground truncate leading-snug">
                      {preset.title}
                    </span>
                    <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
                      {preset.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
