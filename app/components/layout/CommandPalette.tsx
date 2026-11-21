"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  LayoutDashboard,
  Compass,
  FilePlus,
  ClipboardList,
  Wallet,
  BookOpen,
  Sparkles,
  Sun,
  Moon,
  ArrowRight,
  X,
  Stethoscope,
  Activity,
  HeartPulse,
  Brain,
  Baby,
  Apple,
  Dna,
  GraduationCap,
  FolderKanban,
  ExternalLink,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Actions" | "Disciplines" | "Tools";
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K and custom trigger
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }

    function handleCustomOpen() {
      setIsOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-browse",
        title: "Browse Active Health Studies",
        subtitle: "Explore clinical & public health research",
        category: "Navigation",
        icon: Compass,
        action: () => router.push("/participant/studies"),
        keywords: ["studies", "surveys", "questionnaires", "participate", "health"],
      },
      {
        id: "nav-publish",
        title: "Publish New Research Study",
        subtitle: "Build questionnaire with branching logic & SPSS export",
        category: "Navigation",
        icon: FilePlus,
        action: () => router.push("/researcher/studies/new"),
        keywords: ["create", "publish", "study", "new", "survey", "form", "research"],
      },
      {
        id: "nav-collector",
        title: "Field Data Collection Portal",
        subtitle: "In-person door-to-door enumeration & ETB compensation",
        category: "Navigation",
        icon: ClipboardList,
        action: () => router.push("/collector/dashboard"),
        keywords: ["collector", "field", "offline", "roster", "cash", "etb", "enumerator"],
      },
      {
        id: "nav-wallet",
        title: "Participant & Collector Wallet",
        subtitle: "Check Tinat Credits (TC) & earned ETB cash balance",
        category: "Navigation",
        icon: Wallet,
        action: () => router.push("/participant/wallet"),
        keywords: ["wallet", "credits", "balance", "etb", "money", "tc", "payout"],
      },
      {
        id: "nav-projects",
        title: "Collaborative Project Workspaces",
        subtitle: "Kanban boards, team discussions, and literature notes",
        category: "Navigation",
        icon: FolderKanban,
        action: () => router.push("/projects"),
        keywords: ["projects", "kanban", "workspace", "team", "collaborate"],
      },
      {
        id: "nav-history",
        title: "My Research History",
        subtitle: "View completed study submissions & ratings",
        category: "Navigation",
        icon: BookOpen,
        action: () => router.push("/participant/history"),
        keywords: ["history", "submissions", "completed", "ratings"],
      },
      {
        id: "nav-literature",
        title: "Literature Review & ScholarXiv",
        subtitle: "Search medical papers, synthesize insights with AI",
        category: "Navigation",
        icon: GraduationCap,
        action: () => router.push("/researcher/literature"),
        keywords: ["literature", "papers", "scholar", "citations", "bibtex"],
      },

      // Actions
      {
        id: "action-theme",
        title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
        subtitle: "Toggle platform theme preference",
        category: "Actions",
        icon: theme === "dark" ? Sun : Moon,
        action: () => setTheme(theme === "dark" ? "light" : "dark"),
        keywords: ["theme", "dark", "light", "mode", "toggle", "appearance"],
      },

      // Disciplines
      {
        id: "disc-public-health",
        title: "Public Health Studies",
        subtitle: "Community sanitation, hygiene, and health systems",
        category: "Disciplines",
        icon: Activity,
        action: () => router.push("/participant/studies?category=Public+Health"),
        keywords: ["public health", "wash", "community", "water"],
      },
      {
        id: "disc-epidemiology",
        title: "Epidemiology & Biostatistics",
        subtitle: "Disease prevalence, incidence, and risk factors",
        category: "Disciplines",
        icon: HeartPulse,
        action: () => router.push("/participant/studies?category=Epidemiology+%26+Biostatistics"),
        keywords: ["epidemiology", "biostatistics", "disease", "prevalence"],
      },
      {
        id: "disc-clinical",
        title: "Clinical Research",
        subtitle: "Therapeutic efficacy, diagnostic tests, and trials",
        category: "Disciplines",
        icon: Stethoscope,
        action: () => router.push("/participant/studies?category=Clinical+Research"),
        keywords: ["clinical", "trial", "hospital", "doctor"],
      },
      {
        id: "disc-maternal",
        title: "Maternal & Child Health",
        subtitle: "Antenatal care, infant nutrition, and immunization",
        category: "Disciplines",
        icon: Baby,
        action: () => router.push("/participant/studies?category=Maternal+%26+Child+Health"),
        keywords: ["maternal", "child", "infant", "anc", "vaccine"],
      },
    ],
    [router, theme, setTheme]
  );

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(lower)) ||
        (item.keywords && item.keywords.some((k) => k.toLowerCase().includes(lower)))
    );
  }, [items, query]);

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false);
    item.action();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global Command Palette"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 bg-muted/20">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search studies, topics, tools..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
              ESC
            </kbd>
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No matching commands or studies found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-emerald-500/10 text-emerald-900 font-semibold dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        isSelected
                          ? "border-emerald-500/30 bg-emerald-600 text-white shadow-2xs"
                          : "border-border bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{item.title}</p>
                      {item.subtitle && (
                        <p className="truncate text-[11px] text-muted-foreground font-normal mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`ml-2 shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-card px-1 py-0.5 text-[10px] font-mono">↑↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-mono">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Tinat Quick Search
          </span>
        </div>
      </div>
    </div>
  );
}
