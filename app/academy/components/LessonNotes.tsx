"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Check } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

export function LessonNotes({
  lessonSlug,
  isOpen,
  onClose,
}: {
  lessonSlug: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedNotes = localStorage.getItem(`tinat_academy_note_${lessonSlug}`) || "";
    setContent(savedNotes);
  }, [lessonSlug]);

  const handleSave = () => {
    localStorage.setItem(`tinat_academy_note_${lessonSlug}`, content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col justify-between border-l border-border bg-background p-5 shadow-lg sm:w-96">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-foreground m-0">Personal Study Notes</h4>
            <span className="text-[10px] text-muted-foreground">Saved automatically to your device</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Jot down key takeaways, questions for your mentor, or research ideas..."
          className="h-96 w-full resize-none rounded-md border border-input bg-background p-3.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {saved ? (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Check className="h-3 w-3" /> Saved
            </span>
          ) : (
            "Unsaved edits"
          )}
        </span>
        <Button size="sm" onClick={handleSave} className="gap-1.5">
          <Save className="h-3.5 w-3.5" /> Save Note
        </Button>
      </div>
    </aside>
  );
}
