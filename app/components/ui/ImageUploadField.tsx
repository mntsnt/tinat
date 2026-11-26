"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Replace } from "lucide-react";
import { Button } from "./Button";

type Props = {
  label: string;
  value?: string | null;
  aspect?: "16:9" | "1:1" | "4:3" | "3:4";
  onChange: (value: string | null, aspect: "16:9" | "1:1" | "4:3" | "3:4") => void;
};

export function ImageUploadField({ label, value, aspect = "16:9", onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAspect, setSelectedAspect] = useState(aspect);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
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
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted" style={{ aspectRatio: selectedAspect.replace(":", " / ") }}>
          <Image src={value} alt={`${label} preview`} fill sizes="(max-width: 768px) 100vw, 600px" className="object-contain" unoptimized />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-8 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
        >
          <ImagePlus className="mb-2 h-5 w-5" />
          <span className="text-xs font-semibold">{uploading ? "Optimizing image..." : "Upload image"}</span>
        </button>
      )}
      {value && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Replace className="mr-1 h-3.5 w-3.5" /> Replace
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null, selectedAspect)}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
