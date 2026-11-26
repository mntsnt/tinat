"use client";

import React, { useState, useEffect } from "react";
import { Clock, ListTree } from "lucide-react";
import { LessonSection } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

export function TableOfContents({
  sections,
  readingTimeMinutes,
}: {
  sections: LessonSection[];
  readingTimeMinutes: number;
}) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveId(s.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  return (
    <aside className="hidden xl:block w-64 shrink-0 p-4 sticky top-28 self-start">
      <div className="rounded-xl border border-border bg-card/60 p-4 shadow-2xs backdrop-blur-xs space-y-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold border-b border-border pb-2.5">
          <Clock className="h-3.5 w-3.5 text-emerald-600" />
          <span>{readingTimeMinutes} min reading time</span>
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block mb-2 flex items-center gap-1">
            <ListTree className="h-3 w-3" /> ON THIS PAGE
          </span>
          <nav className="space-y-1.5 text-xs">
            {sections.map((sec) => {
              const isActive = activeId === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className={cn(
                    "block truncate py-1 transition-colors hover:text-foreground",
                    isActive
                      ? "text-emerald-700 dark:text-emerald-300 font-bold border-l-2 border-emerald-600 pl-2"
                      : "text-muted-foreground pl-2"
                  )}
                >
                  {sec.title}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
