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
    <aside className="sticky top-0 hidden w-56 shrink-0 self-start p-4 @5xl:block">
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 border-b border-border pb-2.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{readingTimeMinutes} min reading time</span>
        </div>

        <div>
          <span className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <ListTree className="h-3.5 w-3.5" /> On this page
          </span>
          <nav className="space-y-1 text-sm">
            {sections.map((sec) => {
              const isActive = activeId === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className={cn(
                    "block truncate py-1 transition-colors hover:text-foreground",
                    isActive
                      ? "border-l-2 border-foreground pl-2 font-medium text-foreground"
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
