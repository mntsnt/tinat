"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "./components/ui/Button";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="p-3.5 rounded-2xl bg-destructive/10 text-destructive mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-destructive mb-2">
        Error Encountered
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
        Something didn&apos;t go as planned
      </h1>

      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        An unexpected error occurred while processing your request. You can try refreshing the view or return to the homepage.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" className="w-full sm:w-auto gap-2">
            <Home className="w-4 h-4" />
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
