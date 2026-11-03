"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  TERMS_OF_USE_SECTIONS,
  PRIVACY_NOTICE_SECTIONS,
  DATA_USE_SUMMARY_SECTIONS,
  PLATFORM_DOCUMENT_VERSIONS,
  getPlatformDocumentPayload,
} from "@/lib/legal/platformDocuments";
import {
  FileText,
  Shield,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ArrowDown,
  Info,
} from "lucide-react";

interface PlatformAgreementPanelProps {
  requireScrollToEnd?: boolean;
  requiredChecked: boolean;
  onRequiredCheckedChange: (checked: boolean) => void;
  optionalContactChecked: boolean;
  onOptionalContactCheckedChange: (checked: boolean) => void;
  diffHighlights?: string[];
  className?: string;
  onScrolledToEndChange?: (scrolled: boolean) => void;
}

export function PlatformAgreementPanel({
  requireScrollToEnd = true,
  requiredChecked,
  onRequiredCheckedChange,
  optionalContactChecked,
  onOptionalContactCheckedChange,
  diffHighlights,
  className = "",
  onScrolledToEndChange,
}: PlatformAgreementPanelProps) {
  const [scrolledToEnd, setScrolledToEnd] = useState(!requireScrollToEnd);
  const panelRef = useRef<HTMLDivElement>(null);
  const termsRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const payload = getPlatformDocumentPayload();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!requireScrollToEnd || scrolledToEnd) return;
    const target = e.currentTarget;
    const atEnd = target.scrollHeight - target.scrollTop - target.clientHeight <= 28;
    if (atEnd) {
      setScrolledToEnd(true);
      onScrolledToEndChange?.(true);
    }
  };

  const jumpTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current && panelRef.current) {
      const panelTop = panelRef.current.getBoundingClientRect().top;
      const targetTop = ref.current.getBoundingClientRect().top;
      const offset = targetTop - panelTop + panelRef.current.scrollTop - 8;
      panelRef.current.scrollTo({ top: offset, behavior: "smooth" });
    }
  };

  const skipToEnd = () => {
    if (panelRef.current) {
      panelRef.current.scrollTo({
        top: panelRef.current.scrollHeight,
        behavior: "smooth",
      });
      setScrolledToEnd(true);
      onScrolledToEndChange?.(true);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Diff / Update Banner if re-acceptance */}
      {diffHighlights && diffHighlights.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Platform Legal Agreement Updates
          </div>
          <p className="text-neutral-600 dark:text-neutral-300">
            Please review the updated agreements below. Key updates since your last acceptance:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-medium">
            {diffHighlights.map((diff, i) => (
              <li key={i}>{diff}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Table of Contents & Quick Jump */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/60 border border-border text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Table of Contents:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => jumpTo(termsRef)}
            className="px-2 py-1 rounded bg-background border border-border hover:bg-muted text-[11px] font-medium transition-colors"
          >
            a. Terms of Use
          </button>
          <button
            type="button"
            onClick={() => jumpTo(privacyRef)}
            className="px-2 py-1 rounded bg-background border border-border hover:bg-muted text-[11px] font-medium transition-colors"
          >
            b. Privacy Notice
          </button>
          <button
            type="button"
            onClick={() => jumpTo(summaryRef)}
            className="px-2 py-1 rounded bg-background border border-border hover:bg-muted text-[11px] font-medium transition-colors"
          >
            c. How Data is Used
          </button>
          {requireScrollToEnd && !scrolledToEnd && (
            <button
              type="button"
              onClick={skipToEnd}
              className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              aria-label="Skip to end of agreement panel to enable acceptance"
            >
              Skip to End <ArrowDown className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Single Scrollable Combined Document Panel */}
      <div
        ref={panelRef}
        onScroll={handleScroll}
        tabIndex={0}
        role="region"
        aria-label="Platform legal agreements: Terms of Use, Privacy Notice, and Data Usage"
        className="h-72 sm:h-80 overflow-y-auto rounded-xl border border-border bg-card p-4 sm:p-5 text-xs text-foreground leading-relaxed space-y-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-inner"
      >
        {/* SECTION A: TERMS OF USE */}
        <div ref={termsRef} id="panel-terms" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              a. Terms of Use (Full Text)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
              v{PLATFORM_DOCUMENT_VERSIONS.TERMS}
            </span>
          </div>

          {payload.terms.map((sec) => (
            <div key={sec.id} className="space-y-1.5">
              <h4 className="font-semibold text-foreground text-xs">{sec.title}</h4>
              {sec.paragraphs.map((p, i) => (
                <p key={i} className="text-muted-foreground">
                  {p}
                </p>
              ))}
              {sec.bullets && (
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {sec.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* SECTION B: PRIVACY NOTICE */}
        <div ref={privacyRef} id="panel-privacy" className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              b. Privacy Notice (Full Text)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
              v{PLATFORM_DOCUMENT_VERSIONS.PRIVACY}
            </span>
          </div>

          {payload.privacy.map((sec) => (
            <div key={sec.id} className="space-y-1.5">
              <h4 className="font-semibold text-foreground text-xs">{sec.title}</h4>
              {sec.paragraphs.map((p, i) => (
                <p key={i} className="text-muted-foreground">
                  {p}
                </p>
              ))}
              {sec.bullets && (
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {sec.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* SECTION C: HOW YOUR DATA IS USED */}
        <div ref={summaryRef} id="panel-summary" className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              c. How your data is used on Tinat (Plain-Language Summary)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
              v{PLATFORM_DOCUMENT_VERSIONS.SUMMARY}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <p className="font-medium text-foreground">
              Key participant privacy and credit protections:
            </p>
            <ul className="space-y-1.5 pl-1">
              {payload.summary[0]?.bullets?.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* End of Panel Anchor */}
        <div className="pt-2 pb-1 text-center text-[11px] text-muted-foreground border-t border-dashed border-border/80">
          &mdash; End of Platform Legal Agreements (Document Hash: {payload.documentHash.slice(0, 16)}...) &mdash;
        </div>
      </div>

      {/* Scroll-to-End Status Explainer Message */}
      {requireScrollToEnd && !scrolledToEnd ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Please scroll to the end of the agreement panel (or click &ldquo;Skip to End&rdquo;) to enable the agreement checkbox.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            Agreement reviewed. You may now indicate your consent below.
          </span>
        </div>
      )}

      {/* Checkboxes Area */}
      <div className="space-y-2.5 pt-1">
        {/* Required Checkbox 1 */}
        <label className={`flex items-start gap-2.5 cursor-pointer text-xs leading-snug select-none ${
          requireScrollToEnd && !scrolledToEnd ? "opacity-60 cursor-not-allowed" : ""
        }`}>
          <input
            type="checkbox"
            name="termsAccepted"
            checked={requiredChecked}
            disabled={requireScrollToEnd && !scrolledToEnd}
            onChange={(e) => onRequiredCheckedChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
            required
          />
          <span className="font-medium text-foreground">
            I have read and agree to the{" "}
            <span className="text-foreground font-semibold">Terms of Use</span> and the{" "}
            <span className="text-foreground font-semibold">Privacy Notice</span>.
            <span className="text-destructive ml-1">*</span>
          </span>
        </label>

        {/* Optional Checkbox 2 (Unbundled) */}
        <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-snug select-none text-muted-foreground hover:text-foreground transition-colors">
          <input
            type="checkbox"
            name="optionalContactConsent"
            checked={optionalContactChecked}
            onChange={(e) => onOptionalContactCheckedChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span>
            I agree to be contacted via email about future relevant research studies (optional).
          </span>
        </label>
      </div>
    </div>
  );
}
