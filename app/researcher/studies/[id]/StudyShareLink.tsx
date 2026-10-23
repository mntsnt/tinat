"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Share2 } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface StudyShareLinkProps {
  studyId: string;
}

export function StudyShareLink({ studyId }: StudyShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const getFullUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/participant/studies/${studyId}`;
    }
    return `/participant/studies/${studyId}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFullUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Share2 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Share Form with Participants</h3>
            <p className="text-xs text-muted-foreground">
              Send this link to respondents via WhatsApp, Telegram, email, or social media to collect responses.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={handleCopy}
            className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </>
            )}
          </Button>

          <a
            href={`/participant/studies/${studyId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Form
          </a>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground font-mono">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="truncate flex-1 select-all">{getFullUrl()}</span>
      </div>
    </div>
  );
}
