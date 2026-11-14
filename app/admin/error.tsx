"use client";

import { useEffect } from "react";
import { Button } from "../components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Admin console temporarily unavailable</h2>
      <p className="max-w-lg text-center text-sm text-muted-foreground">
        This section could not be loaded. Please try again; if the issue persists, contact support.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Error reference: {error.digest}</p>
      )}
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
